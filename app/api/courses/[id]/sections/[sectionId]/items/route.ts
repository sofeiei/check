import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApi } from "@/lib/session";

type Context = { params: Promise<{ id: string; sectionId: string }> };

export async function POST(req: Request, { params }: Context) {
  const auth = await authorizeApi("TEACHER");
  if ("response" in auth) return auth.response;

  const { id, sectionId } = await params;
  const groupId = Number(id);
  const secId = Number(sectionId);

  try {
    const section = await prisma.groupSection.findFirst({
      where: {
        id: secId,
        group: { id: groupId, creatorId: auth.user.id },
      },
    });
    if (!section) {
      return NextResponse.json({ error: "ไม่พบหัวข้อหรือไม่มีสิทธิ์จัดการ" }, { status: 404 });
    }

    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const type = body.type === "MATERIAL" ? "MATERIAL" : "ASSIGNMENT";
    const openedAt = body.openedAt ? new Date(body.openedAt) : null;
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;

    if (!title || title.length > 200) {
      return NextResponse.json({ error: "กรุณากรอกชื่องาน/รายการ" }, { status: 400 });
    }

    const item = await prisma.groupItem.create({
      data: {
        title,
        description: description || null,
        type,
        openedAt: openedAt && !isNaN(openedAt.getTime()) ? openedAt : null,
        dueDate: dueDate && !isNaN(dueDate.getTime()) ? dueDate : null,
        sectionId: secId,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "เพิ่มรายการไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Context) {
  const auth = await authorizeApi("TEACHER");
  if ("response" in auth) return auth.response;

  const { id, sectionId } = await params;
  const groupId = Number(id);
  const secId = Number(sectionId);
  const { searchParams } = new URL(req.url);
  const itemId = Number(searchParams.get("itemId"));

  try {
    const section = await prisma.groupSection.findFirst({
      where: {
        id: secId,
        group: { id: groupId, creatorId: auth.user.id },
      },
    });
    if (!section) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์จัดการ" }, { status: 404 });
    }

    await prisma.groupItem.deleteMany({
      where: { id: itemId, sectionId: secId },
    });

    return NextResponse.json({ message: "ลบรายการสำเร็จ" });
  } catch {
    return NextResponse.json({ error: "ลบรายการไม่สำเร็จ" }, { status: 500 });
  }
}