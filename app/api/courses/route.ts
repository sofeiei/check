import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApi } from "@/lib/session";

export async function GET() {
  const auth = await authorizeApi("ANY");
  if ("response" in auth) return auth.response;

  try {
    const user = auth.user;

    if (user.role === "TEACHER") {
      const groups = await prisma.studentGroup.findMany({
        where: { creatorId: user.id },
        include: {
          creator: { select: { id: true, name: true } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(groups);
    }

    // ดึงข้อมูล studentId ล่าสุดของ user จากฐานข้อมูล
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true, studentId: true, name: true },
    });

    const studentIdentifiers = [dbUser?.studentId, dbUser?.username, user.username].filter(
      (v): v is string => Boolean(v)
    );
    const studentName = dbUser?.name || user.name;

    // ค้นหาห้องเรียนจากทั้ง รหัสนักศึกษา (studentId/username) และ ชื่อ-นามสกุล (name)
    const groups = await prisma.studentGroup.findMany({
      where: {
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
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(groups);
  } catch {
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลรายวิชาได้" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await authorizeApi("TEACHER");
  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const rawIds: number[] = Array.isArray(body.studentIds)
      ? body.studentIds.filter(
          (id: unknown): id is number =>
            typeof id === "number" && Number.isInteger(id) && id > 0
        )
      : [];
    const studentIds: number[] = Array.from(new Set<number>(rawIds));

    if (!name || name.length > 100) {
      return NextResponse.json({ error: "กรุณากรอกชื่อรายวิชาไม่เกิน 100 ตัวอักษร" }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, studentId: true, name: true },
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json({ error: "พบข้อมูลนักศึกษาที่ไม่ถูกต้อง" }, { status: 400 });
    }

    const group = await prisma.studentGroup.create({
      data: {
        name,
        description: description || null,
        creatorId: auth.user.id,
        members: {
          create: studentIds.map((studentId) => ({ studentId })),
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    // ส่งแจ้งเตือนให้นักศึกษาที่ถูกเพิ่มตั้งแต่ตอนสร้างห้องเรียน
    for (const student of students) {
      const matchedUsers = await prisma.user.findMany({
        where: {
          role: "STUDENT",
          OR: [
            { studentId: student.studentId },
            { username: student.studentId },
            { name: { equals: student.name, mode: "insensitive" } },
          ],
        },
      });

      if (matchedUsers.length > 0) {
        await prisma.notification.createMany({
          data: matchedUsers.map((u) => ({
            userId: u.id,
            title: "คุณถูกเพิ่มเข้าสู่รายวิชาใหม่",
            message: `อาจารย์ ${auth.user.name} ได้เพิ่มคุณเข้าสู่รายวิชา "${group.name}" เรียบร้อยแล้ว`,
            link: `/courses/${group.id}`,
          })),
        });
      }
    }

    return NextResponse.json(group, { status: 201 });
  } catch {
    return NextResponse.json({ error: "สร้างรายวิชาไม่สำเร็จ" }, { status: 500 });
  }
}