import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// ดึงรายการแจ้งเตือนของผู้ใช้ปัจจุบัน
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json([], { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(notifications);
}

// กดอ่านแจ้งเตือน (อ่านทั้งหมด หรืออ่านเฉพาะรายการ)
export async function PATCH(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.id) {
    await prisma.notification.updateMany({
      where: { id: Number(body.id), userId: user.id },
      data: { isRead: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}