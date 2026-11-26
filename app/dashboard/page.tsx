"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import TimelineSelect from "@/app/components/TimelineSelect";

type TimelineItem = {
  id: number;
  title: string;
  description: string | null;
  type: "ASSIGNMENT" | "MATERIAL";
  openedAt: string | null;
  dueDate: string | null;
  createdAt: string;
  sectionTitle: string;
  courseId: number;
  courseName: string;
  teacherName: string;
};

function formatDateHeader(dateStr: string | null) {
  if (!dateStr) return "ไม่มีกำหนดส่ง (No Due Date)";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeOnly(dateStr: string | null) {
  if (!dateStr) return "--:--";
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState<"ALL" | "OVERDUE" | "UPCOMING" | "NO_DUE">("ALL");
  const [sortBy, setSortBy] = useState<"DATE" | "COURSE">("DATE");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
    fetch("/api/dashboard/timeline")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const processedItems = useMemo(() => {
    const now = new Date();
    return items
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchCourse = item.courseName.toLowerCase().includes(q);
          const matchSection = item.sectionTitle.toLowerCase().includes(q);
          if (!matchTitle && !matchCourse && !matchSection) return false;
        }

        const due = item.dueDate ? new Date(item.dueDate) : null;
        if (filterStatus === "OVERDUE") {
          return due !== null && due < now;
        }
        if (filterStatus === "UPCOMING") {
          return due !== null && due >= now;
        }
        if (filterStatus === "NO_DUE") {
          return due === null;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "COURSE") {
          return a.courseName.localeCompare(b.courseName);
        }
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [items, filterStatus, sortBy, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    for (const item of processedItems) {
      const groupKey =
        sortBy === "COURSE" ? item.courseName : formatDateHeader(item.dueDate);
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    }
    return Object.entries(groups);
  }, [processedItems, sortBy]);

  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center text-[#f59e0b] font-bold animate-pulse">
        กำลังโหลดข้อมูล Dashboard...
      </div>
    );
  }

  const now = new Date();
  const overdueCount = items.filter(
    (i) => i.dueDate && new Date(i.dueDate) < now
  ).length;
  const upcomingCount = items.filter(
    (i) => i.dueDate && new Date(i.dueDate) >= now
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 mt-2">
      {/* หัวข้อ Dashboard + สรุปตัวเลขด้านบน */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#f59e0b]">
            Dashboard
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {user?.role === "TEACHER"
              ? "รวมรายการงานและเอกสารทั้งหมดที่คุณสั่งไว้ในแต่ละรายวิชา"
              : "รวมรายการงานและเอกสารทั้งหมดจากรายวิชาที่คุณลงเรียน"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs font-extrabold">
          <span className="px-4 py-1.5 rounded-full bg-[#1e2638] border border-[#f59e0b] text-[#f59e0b]">
            ทั้งหมด {items.length} รายการ
          </span>
          <span className="px-4 py-1.5 rounded-full bg-red-100 border border-red-200 text-red-700">
            เลยกำหนด {overdueCount}
          </span>
          <span className="px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700">
            กำลังจะถึง {upcomingCount}
          </span>
        </div>
      </div>

      {/* กล่อง Timeline หลัก */}
      <section className="bg-[#151c2c] rounded-3xl border border-[#2a3447] shadow-xl overflow-visible">
        {/* ส่วนหัว Timeline + ตัวกรอง + ช่องค้นหา */}
        <div className="p-5 md:p-6 border-b border-[#2a3447] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#f59e0b]">
              Timeline
            </h2>
            <Link
              href="/courses"
              className="text-xs font-bold text-[#f59e0b] no-underline hover:opacity-80 transition"
            >
              ดูรายวิชาทั้งหมด
            </Link>
          </div>

          {/* แถบ Filter / Sort / Search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <TimelineSelect
                value={filterStatus}
                onChange={(val) =>
                  setFilterStatus(
                    val as "ALL" | "OVERDUE" | "UPCOMING" | "NO_DUE"
                  )
                }
                buttonClassName="bg-[#f59e0b] text-white"
                options={[
                  { value: "ALL", label: "ทั้งหมด" },
                  { value: "OVERDUE", label: "เลยกำหนด" },
                  { value: "UPCOMING", label: "ยังไม่ถึงกำหนด" },
                  { value: "NO_DUE", label: "ไม่มีกำหนดส่ง" },
                ]}
              />

              <TimelineSelect
                value={sortBy}
                onChange={(val) => setSortBy(val as "DATE" | "COURSE")}
                buttonClassName="bg-[#7c3aed] text-white"
                options={[
                  { value: "DATE", label: "เรียงตามวันที่" },
                  { value: "COURSE", label: "เรียงตามรายวิชา" },
                ]}
              />
            </div>

            <div className="w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by activity type or name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-[#3a465c] bg-[#263042] text-sm text-white placeholder-[#7f8999] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] transition"
              />
            </div>
          </div>
        </div>

        {/* เนื้อหารายการ Timeline */}
        <div className="p-5 md:p-6">
          {loading ? (
            <p className="text-center text-sm text-[#f59e0b] font-bold py-10 animate-pulse">
              กำลังโหลดข้อมูล Timeline...
            </p>
          ) : groupedItems.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-slate-400 text-sm">
                ไม่พบรายการงานหรือกิจกรรมที่ตรงกับเงื่อนไข
              </p>
              {user?.role === "TEACHER" && (
                <Link
                  href="/courses"
                  className="inline-block mt-2 px-4 py-2 rounded-full bg-[#f59e0b] text-[#0f172a] text-xs font-extrabold no-underline hover:opacity-90 transition"
                >
                  ไปที่รายวิชาเพื่อสั่งงาน
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {groupedItems.map(([groupTitle, groupItems]) => (
                <div key={groupTitle} className="space-y-2">
                  <h3 className="text-sm md:text-base font-extrabold text-[#f59e0b] pb-2 border-b border-[#2a3447]">
                    {groupTitle}
                  </h3>

                  <div className="divide-y divide-[#2a3447]">
                    {groupItems.map((item) => {
                      const isOverdue =
                        item.dueDate !== null && new Date(item.dueDate) < now;

                      return (
                        <div
                          key={item.id}
                          className="py-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 hover:bg-[#1e2638]/60 px-2.5 rounded-2xl transition"
                        >
                          {/* ฝั่งซ้าย: เวลา + ไอคอน + รายละเอียดงาน */}
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            <span className="text-xs font-mono font-semibold text-slate-400 w-11 shrink-0">
                              {formatTimeOnly(item.dueDate)}
                            </span>

                            {item.type === "MATERIAL" ? (
                              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 font-bold text-xs border border-sky-500/30">
                                PDF
                              </span>
                            ) : (
                              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-600 text-white font-bold text-sm">
                                ✎
                              </span>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  href={`/courses/${item.courseId}`}
                                  className="text-sm md:text-base font-bold text-[#a78bfa] no-underline hover:opacity-80 transition truncate"
                                >
                                  {item.title}
                                </Link>

                                {isOverdue && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white">
                                    Overdue
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-400 mt-0.5 truncate">
                                {item.type === "ASSIGNMENT"
                                  ? "Assignment is due"
                                  : "Course material"}{" "}
                                ·{" "}
                                <span className="font-bold text-[#f59e0b]">
                                  {item.courseName}
                                </span>{" "}
                                <span className="text-slate-400">
                                  ({item.sectionTitle})
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* ฝั่งขวา: ปุ่ม View / เข้าดูห้องเรียน */}
                          <Link
                            href={`/courses/${item.courseId}`}
                            className="shrink-0 px-4 py-1.5 rounded-full border border-[#3a465c] bg-[#1e2638] hover:bg-[#f59e0b] hover:text-[#0f172a] hover:border-[#f59e0b] text-xs font-bold text-white no-underline transition"
                          >
                            {item.type === "ASSIGNMENT" ? "View / ดูงาน" : "View"}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}