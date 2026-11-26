import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { studentSchema } from "@/lib/studentSchema";
import { authorizeApi } from "@/lib/session";

// ซิงก์นักศึกษาที่สมัครสมาชิก (User role=STUDENT) เข้าตาราง Student อัตโนมัติ
async function syncRegisteredStudents() {
  const registeredUsers = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { username: true, studentId: true, name: true },
  });

  for (const u of registeredUsers) {
    const sid = (u.studentId || u.username).trim();
    if (!sid) continue;

    await prisma.student.upsert({
      where: { studentId: sid },
      update: { name: u.name },
      create: {
        studentId: sid,
        name: u.name,
        gpa: 0.0,
      },
    });
  }
}

export async function GET() {
  const auth = await authorizeApi("ANY");
  if ("response" in auth) return auth.response;

  try {
    await syncRegisteredStudents();

    const allStudents = await prisma.student.findMany({
      orderBy: { studentId: "asc" },
    });
    return NextResponse.json(allStudents);
  } catch (error: any) {
    console.error("GET /api/students error:", error);
    return NextResponse.json(
      { error: error?.message || "ดึงข้อมูลล้มเหลว" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await authorizeApi("TEACHER");
  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    const validatedData = studentSchema.parse(body);
    const newStudent = await prisma.student.create({
      data: validatedData,
    });
    return NextResponse.json({ message: "Success", data: newStudent });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    if (error.code === "P2002") {
      return NextResponse.json({ error: "รหัสนักศึกษานี้มีในระบบแล้ว" }, { status: 400 });
    }

    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}