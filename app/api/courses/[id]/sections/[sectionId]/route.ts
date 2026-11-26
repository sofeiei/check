import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApi } from "@/lib/session";

type Context = { params: Promise<{ id: string; sectionId: string }> };

export async function DELETE(req: Request, { params }: Context) {
  const auth = await authorizeApi("TEACHER");
  if ("response" in auth) return auth.response;

  const { id, sectionId } = await params;
  const groupId = Number(id);
  const secId = Number(sectionId);

  try {
    const group = await prisma.studentGroup.findFirst({
      where: { id: groupId, creatorId: auth.user.id },
    });
    if (!group) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์จัดการกลุ่มนี้" }, { status: 404 });
    }

    await prisma.groupSection.deleteMany({
      where: { id: secId, groupId },
    });

    return NextResponse.json({ message: "ลบหัวข้อสำเร็จ" });
  } catch {
    return NextResponse.json({ error: "ลบหัวข้อไม่สำเร็จ" }, { status: 500 });
  }
}