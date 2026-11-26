import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { studentSchema } from "@/lib/studentSchema";
import { authorizeApi } from "@/lib/session";

// ดูรายชื่อ: เห็นเฉพาะนักศึกษาที่อยู่ในกลุ่มเดียวกัน (ยกเว้นอาจารย์เรียก ?all=true เพื่อเลือกคนเข้ากลุ่ม)
export async function GET(req: Request) {
  const auth = await authorizeApi("ANY");
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const fetchAllForSelect = searchParams.get("all") === "true";

  try {
    const user = auth.user;

    if (user.role === "TEACHER") {
      // ตอนอาจารย์เลือกนักศึกษาเข้ากลุ่ม ให้เห็นรายชื่อทั้งหมดในระบบได้
      if (fetchAllForSelect) {
        const allStudents = await prisma.student.findMany({
          orderBy: { studentId: "asc" },
        });
        return NextResponse.json(allStudents);
      }

      // หน้าหลัก /students แสดงเฉพาะนักศึกษาที่อยู่ในกลุ่มของอาจารย์คนนี้
      const students = await prisma.student.findMany({
        where: {
          groups: {
            some: {
              group: { creatorId: user.id },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(students);
    }

    // นักศึกษาเห็นเฉพาะเพื่อนร่วมกลุ่มเดียวกัน
    const students = await prisma.student.findMany({
      where: {
        groups: {
          some: {
            group: {
              members: {
                some: {
                  student: { studentId: user.username },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: "ดึงข้อมูลล้มเหลว" }, { status: 500 });
  }
}

// เพิ่มข้อมูล: เฉพาะอาจารย์
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