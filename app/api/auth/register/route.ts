import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/authSchema";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const data = registerSchema.parse(await req.json());

    // [แก้ตรงนี้ 1] ลบการเช็ก process.env.TEACHER_CODE ออก เปลี่ยนเป็นเช็กความยาวรหัสที่อาจารย์ตั้งเองแทน
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
        username: data.username.toLowerCase(),
        name: data.name,
        role: data.role,
        passwordHash: await hashPassword(data.password),
        // [หมายเหตุ] หากในตาราง User (schema.prisma) มีคอลัมน์ teacherCode ให้เปิดคอมเมนต์บรรทัดล่างนี้เพื่อบันทึกลงฐานข้อมูลด้วย:
        // teacherCode: data.role === "TEACHER" ? data.teacherCode.trim() : null,
      },
    });

    await setSessionCookie({ id: user.id, username: user.username, name: user.name, role: user.role });
    return NextResponse.json({ message: "Success" });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" }, { status: 400 });
    }
    return NextResponse.json({ error: "สมัครสมาชิกไม่สำเร็จ" }, { status: 500 });
  }
}