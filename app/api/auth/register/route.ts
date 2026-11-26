import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/authSchema";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const data = registerSchema.parse(await req.json());
    const cleanUsername = data.username.trim().toLowerCase();
    const cleanName = data.name.trim().toUpperCase();

    if (data.role === "TEACHER") {
      if (!data.teacherCode || data.teacherCode.trim().length < 4) {
        return NextResponse.json(
          { error: "กรุณาตั้งรหัสสำหรับอาจารย์อย่างน้อย 4 ตัวอักษร" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        studentId: data.role === "STUDENT" ? cleanUsername : null,
        name: cleanName,
        role: data.role,
        passwordHash: await hashPassword(data.password),
      },
    });

    // ถ้านักเรียนสมัครสมาชิก ให้สร้างข้อมูลในตาราง Student ให้อัตโนมัติ
    if (data.role === "STUDENT") {
      await prisma.student.upsert({
        where: { studentId: cleanUsername },
        update: { name: cleanName },
        create: {
          studentId: cleanUsername,
          name: cleanName,
          gpa: 0.0,
        },
      });
    }

    await setSessionCookie({ id: user.id, username: user.username, name: user.name, role: user.role });
    return NextResponse.json({ message: "Success" });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "รหัสผู้ใช้นี้ถูกใช้สมัครสมาชิกแล้ว" }, { status: 400 });
    }
    return NextResponse.json({ error: "สมัครสมาชิกไม่สำเร็จ" }, { status: 500 });
  }
}