import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApi } from "@/lib/session";

export async function GET() {
  const auth = await authorizeApi("ANY");
  if ("response" in auth) return auth.response;

  const user = auth.user;

  try {
    // ดึงเฉพาะรายวิชาที่อาจารย์คนนี้สร้าง หรือรายวิชาที่นักศึกษาคนนี้เป็นสมาชิก
    const courses = await prisma.studentGroup.findMany({
      where:
        user.role === "TEACHER"
          ? { creatorId: user.id }
          : {
              members: {
                some: {
                  student: { studentId: user.username },
                },
              },
            },
      select: {
        id: true,
        name: true,
        creator: { select: { name: true } },
        sections: {
          select: {
            id: true,
            title: true,
            items: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    // รวมรายการทั้งหมดจากทุกหัวข้อในแต่ละวิชาให้เป็นรายการ Timeline เดียว
    const timeline = courses.flatMap((course) =>
      course.sections.flatMap((section) =>
        section.items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type,
          openedAt: item.openedAt,
          dueDate: item.dueDate,
          createdAt: item.createdAt,
          sectionTitle: section.title,
          courseId: course.id,
          courseName: course.name,
          teacherName: course.creator.name,
        }))
      )
    );

    return NextResponse.json(timeline);
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลรายการงานได้" },
      { status: 500 }
    );
  }
}