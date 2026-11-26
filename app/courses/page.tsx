"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

type CourseItem = {
  id: number;
  name: string;
  description: string | null;
  creator: { id: number; name: string };
  _count: { members: number };
};

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then((res) => res.json()),
      fetch("/api/notifications").then((res) => res.json()).catch(() => []),
    ])
      .then(([coursesData, notifData]) => {
        if (Array.isArray(coursesData)) setCourses(coursesData);
        if (Array.isArray(notifData)) {
          setNotifications(notifData.filter((n: NotificationItem) => !n.isRead));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const markAsRead = async (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* แถบแจ้งเตือนเมื่ออาจารย์เพิ่มเข้าห้องเรียน */}
      {notifications.length > 0 && (
        <div className="mb-6 space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f59e0b]/50 bg-[#0f172a] px-4 py-3.5 text-white shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#f59e0b] shrink-0 animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-[#f59e0b]">{notif.title}</p>
                  <p className="text-xs sm:text-sm text-slate-200 mt-0.5">{notif.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {notif.link && (
                  <Link
                    href={notif.link}
                    onClick={() => markAsRead(notif.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#f59e0b] text-slate-950 text-xs font-bold hover:opacity-90 transition"
                  >
                    เข้าสู่ห้องเรียน
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => markAsRead(notif.id)}
                  className="px-3 py-1.5 rounded-xl border border-slate-600 text-xs text-slate-300 hover:bg-slate-800 transition"
                >
                  รับทราบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#3b076b]">ห้องเรียนของฉัน</h1>
          <p className="text-sm text-zinc-600 mt-1">
            {user?.role === "TEACHER"
              ? "ห้องเรียนที่คุณสร้าง"
              : "ห้องเรียนที่คุณได้รับเชิญเข้าร่วม"}
          </p>
        </div>

        {user?.role === "TEACHER" && (
          <Link
            href="/courses/create"
            className="px-4 py-2 bg-[#700d2b] hover:opacity-90 text-white rounded-xl font-semibold transition shadow-xs"
          >
            + สร้างห้องเรียนใหม่
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-zinc-500">กำลังโหลดข้อมูลห้องเรียน...</p>
      ) : courses.length === 0 ? (
        <div className="border border-dashed border-[#c4b5fd] bg-[#f3e8ff] rounded-2xl p-10 text-center text-zinc-600">
          {user?.role === "TEACHER"
            ? "คุณยังไม่ได้สร้างห้องเรียน กดปุ่ม '+ สร้างห้องเรียนใหม่' เพื่อเริ่มต้น"
            : "คุณยังไม่ได้อยู่ในห้องเรียนใดๆ"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((item) => (
            <Link
              key={item.id}
              href={`/courses/${item.id}`}
              className="block p-5 rounded-2xl bg-[#f3e8ff] border border-[#d8b4fe] hover:border-[#700d2b] transition shadow-xs"
            >
              <h2 className="text-lg font-extrabold text-[#3b076b] mb-1">{item.name}</h2>
              {item.description && (
                <p className="text-sm text-zinc-600 line-clamp-2 mb-3">
                  {item.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-zinc-600 pt-3 border-t border-[#e9d5ff]">
                <span>ผู้ดูแล: {item.creator.name}</span>
                <span className="font-bold text-[#700d2b]">
                  สมาชิก {item._count.members} คน
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}