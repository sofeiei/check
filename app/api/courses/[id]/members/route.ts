import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApi } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

// เพิ่มนักศึกษาเข้ากลุ่ม (เฉพาะอาจารย์เจ้าของกลุ่ม)
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
    const studentIds: number[] = Array.isArray(body.studentIds)
      ? body.studentIds.filter((sid: unknown) => typeof sid === "number" && Number.isInteger(sid))
      : [];

    if (studentIds.length === 0) {
      return NextResponse.json({ error: "กรุณาเลือกนักศึกษา" }, { status: 400 });
    }

    // 1. เพิ่มนักศึกษาเข้ากลุ่ม
    await prisma.studentGroupMember.createMany({
      data: studentIds.map((studentId) => ({ groupId, studentId })),
      skipDuplicates: true,
    });

    // 2. ดึงข้อมูลรหัสนักศึกษาและชื่อ-นามสกุลของคนที่เพิ่งถูกเพิ่ม
    const addedStudents = await prisma.student.findMany({
      where: { id: { in: studentIds } },
    });

    // 3. ค้นหาบัญชี User ของนักศึกษาเหล่านั้น แล้วสร้างการแจ้งเตือน
    for (const student of addedStudents) {
      const matchedUsers = await prisma.user.findMany({
        where: {
          role: "STUDENT",
          OR: [
            { studentId: student.studentId },
            { username: student.studentId },
            { name: student.name },
          ],
        },
      });

      if (matchedUsers.length > 0) {
        await prisma.notification.createMany({
          data: matchedUsers.map((u) => ({
            userId: u.id,
            title: "คุณถูกเพิ่มเข้าสู่รายวิชาใหม่",
            message: `อาจารย์ ${auth.user.name} ได้เพิ่มคุณเข้าสู่รายวิชา "${group.name}" เรียบร้อยแล้ว`,
            link: `/courses/${group.id}`,
          })),
        });
      }
    }

    return NextResponse.json({ message: "เพิ่มสมาชิกสำเร็จ" });
  } catch {
    return NextResponse.json({ error: "เพิ่มสมาชิกไม่สำเร็จ" }, { status: 500 });
  }
}

// ลบนักศึกษาออกจากกลุ่ม (เฉพาะอาจารย์เจ้าของกลุ่ม)
export async function DELETE(req: Request, { params }: Context) {
  const auth = await authorizeApi("TEACHER");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const groupId = Number(id);
  const { searchParams } = new URL(req.url);
  const studentId = Number(searchParams.get("studentId"));

  try {
    const group = await prisma.studentGroup.findFirst({
      where: { id: groupId, creatorId: auth.user.id },
    });
    if (!group) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์จัดการกลุ่มนี้" }, { status: 404 });
    }

    await prisma.studentGroupMember.deleteMany({
      where: { groupId, studentId },
    });

    return NextResponse.json({ message: "ลบสมาชิกออกจากกลุ่มสำเร็จ" });
  } catch {
    return NextResponse.json({ error: "ลบสมาชิกไม่สำเร็จ" }, { status: 500 });
  }
}