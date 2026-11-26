import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authorizeApi } from "@/lib/session";

export async function GET() {
  const auth = await authorizeApi("ANY");
  if ("response" in auth) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const auth = await authorizeApi("ANY");
  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    const name =
      typeof body.name === "string" ? body.name.trim().toUpperCase() : "";
    const avatar =
      typeof body.avatar === "string" || body.avatar === null
        ? body.avatar
        : undefined;
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword.trim() : "";

    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อ-นามสกุลไม่เกิน 100 ตัวอักษร" },
        { status: 400 }
      );
    }

    if (!/^[A-Z\s]+$/.test(name)) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อ-นามสกุลเป็นภาษาอังกฤษเท่านั้น (A-Z)" },
        { status: 400 }
      );
    }

    if (avatar && avatar.length > 1_500_000) {
      return NextResponse.json(
        { error: "ขนาดไฟล์รูปภาพใหญ่เกินไป" },
        { status: 400 }
      );
    }

    const updateData: {
      name: string;
      avatar?: string | null;
      passwordHash?: string;
    } = { name };

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" },
          { status: 400 }
        );
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
      },
    });

    if (updated.role === "STUDENT") {
      await prisma.student.updateMany({
        where: { studentId: updated.username },
        data: {
          name: updated.name,
          ...(avatar !== undefined ? { image: updated.avatar } : {}),
        },
      });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้" },
      { status: 500 }
    );
  }
}