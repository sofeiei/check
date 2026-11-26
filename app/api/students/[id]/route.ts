import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeApi } from "@/lib/session";

const updateStudentSchema = z.object({
  studentId: z.string().regex(/^\d{3,15}$/, "กรุณากรอกรหัสนักศึกษาเป็นตัวเลขเท่านั้น"),
  name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  year: z.string().optional().nullable(),
  facultyMajor: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
});

// 1. ดึงข้อมูลนักศึกษารายคน (GET) — ผู้ใช้ที่ login แล้วทุกคน
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi("ANY");
  if ("response" in auth) return auth.response;

  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}

// 2. อัปเดตข้อมูล (PUT) — เฉพาะอาจารย์
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi("TEACHER");
  if ("response" in auth) return auth.response;

  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);

    const body = await req.json();
    const validatedData = updateStudentSchema.parse(body);

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        studentId: validatedData.studentId.trim(),
        name: validatedData.name.trim().toUpperCase(),
        year: validatedData.year?.trim() || null,
        facultyMajor: validatedData.facultyMajor?.trim() || null,
        ...(validatedData.image !== undefined ? { image: validatedData.image || null } : {}),
      },
    });
    return NextResponse.json({ message: "Success", data: updatedStudent });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "รหัสนักศึกษานี้ถูกใช้ไปแล้ว" }, { status: 400 });
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแก้ไข" }, { status: 500 });
  }
}

// 3. ลบข้อมูล (DELETE) — เฉพาะอาจารย์
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi("TEACHER");
  if ("response" in auth) return auth.response;

  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);

    await prisma.student.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "ลบข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}