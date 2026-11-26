import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApi } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Context) {
  const auth = await authorizeApi("TEACHER");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const groupId = Number(id);

  try {
    const group = await prisma.studentGroup.findFirst({
      where: { id: groupId, creatorId: auth.user.id },
    });
    if (!group) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์จัดการกลุ่มนี้" }, { status: 404 });
    }

    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title || title.length > 150) {
      return NextResponse.json({ error: "กรุณากรอกชื่อหัวข้อไม่เกิน 150 ตัวอักษร" }, { status: 400 });
    }

    const section = await prisma.groupSection.create({
      data: {
        title,
        groupId,
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch {
    return NextResponse.json({ error: "สร้างหัวข้อไม่สำเร็จ" }, { status: 500 });
  }
}