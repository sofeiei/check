import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApi } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Context) {
  const auth = await authorizeApi("ANY");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId) || groupId <= 0) {
    return NextResponse.json({ error: "รหัสกลุ่มไม่ถูกต้อง" }, { status: 400 });
  }

  const user = auth.user;

  try {
    // ดึงข้อมูล studentId ล่าสุดของ user จากฐานข้อมูล
    const dbUser =
      user.role === "STUDENT"
        ? await prisma.user.findUnique({
            where: { id: user.id },
            select: { username: true, studentId: true, name: true },
          })
        : null;

    const studentIdentifiers = [dbUser?.studentId, dbUser?.username, user.username].filter(
      (v): v is string => Boolean(v)
    );
    const studentName = dbUser?.name || user.name;

    const group = await prisma.studentGroup.findFirst({
      where: {
        id: groupId,
        OR: [
          { creatorId: user.role === "TEACHER" ? user.id : -1 },
          {
            members: {
              some: {
                student: {
                  OR: [
                    { studentId: { in: studentIdentifiers } },
                    { name: { equals: studentName, mode: "insensitive" } },
                  ],
                },
              },
            },
          },
        ],
      },
      include: {
        creator: { select: { id: true, name: true } },
        members: {
          include: { student: true },
          orderBy: { student: { studentId: "asc" } },
        },
        sections: {
          orderBy: { createdAt: "asc" },
          include: {
            items: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "ไม่พบกลุ่มหรือคุณไม่มีสิทธิ์เข้าถึง" }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch {
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลกลุ่มได้" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Context) {
  const auth = await authorizeApi("TEACHER");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId) || groupId <= 0) {
    return NextResponse.json({ error: "รหัสกลุ่มไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const result = await prisma.studentGroup.deleteMany({
      where: { id: groupId, creatorId: auth.user.id },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "ไม่พบกลุ่มหรือคุณไม่มีสิทธิ์ลบ" }, { status: 404 });
    }

    return NextResponse.json({ message: "ลบกลุ่มสำเร็จ" });
  } catch {
    return NextResponse.json({ error: "ลบกลุ่มไม่สำเร็จ" }, { status: 500 });
  }
}