import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/authSchema";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);
    const requestedRole = body.role === "TEACHER" ? "TEACHER" : body.role === "STUDENT" ? "STUDENT" : null;

    const user = await prisma.user.findUnique({ where: { username: data.username.toLowerCase() } });

    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      return NextResponse.json({ error: "รหัสผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    if (requestedRole && user.role !== requestedRole) {
      return NextResponse.json(
        {
          error:
            requestedRole === "TEACHER"
              ? "บัญชีนี้เป็นบัญชีนักเรียน กรุณาเลือกแท็บ 'นักเรียน'"
              : "บัญชีนี้เป็นบัญชีอาจารย์ กรุณาเลือกแท็บ 'อาจารย์'",
        },
        { status: 403 }
      );
    }

    await setSessionCookie({ id: user.id, username: user.username, name: user.name, role: user.role });
    return NextResponse.json({ message: "Success" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    return NextResponse.json({ error: "เข้าสู่ระบบไม่สำเร็จ" }, { status: 500 });
  }
}