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
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ตัวกรอง การเรียงลำดับ และช่องค้นหา (เหมือนรูปตัวอย่าง)
  const [filterStatus, setFilterStatus] = useState<"ALL" | "OVERDUE" | "UPCOMING" | "NO_DUE">("ALL");
  const [sortBy, setSortBy] = useState<"DATE" | "COURSE">("DATE");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/timeline")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();

  const processedItems = useMemo(() => {
    return items
      .filter((item) => {
        // กรองตามคำค้นหา (ชื่องาน, ชื่อวิชา, ชื่อหัวข้อ)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchCourse = item.courseName.toLowerCase().includes(q);
          const matchSection = item.sectionTitle.toLowerCase().includes(q);
          if (!matchTitle && !matchCourse && !matchSection) return false;
        }

        // กรองตามสถานะเวลา
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
        // เรียงตามวันที่กำหนดส่ง (งานที่มีกำหนดส่งขึ้นก่อน งานไม่มีกำหนดส่งอยู่ล่าง)
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [items, filterStatus, sortBy, searchQuery]);

  // จัดกลุ่มรายการตามหัวข้อ (ตามวันที่ หรือ ตามรายวิชา)
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

  const overdueCount = items.filter(
    (i) => i.dueDate && new Date(i.dueDate) < now
  ).length;
  const upcomingCount = items.filter(
    (i) => i.dueDate && new Date(i.dueDate) >= now
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* หัวข้อ Dashboard + สรุปตัวเลขด้านบน */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#3b076b]">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            {user?.role === "TEACHER"
              ? "รวมรายการงานและเอกสารทั้งหมดที่คุณสั่งไว้ในแต่ละรายวิชา"
              : "รวมรายการงานและเอกสารทั้งหมดจากรายวิชาที่คุณลงเรียน"}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-[#f3e8ff] border border-[#d8b4fe] text-[#3b076b]">
            ทั้งหมด {items.length} รายการ
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-red-100 border border-red-200 text-red-700">
            เลยกำหนด {overdueCount}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700">
            กำลังจะถึง {upcomingCount}
          </span>
        </div>
      </div>

      {/* กล่อง Timeline หลัก (ดีไซน์ตามรูปตัวอย่าง) */}
      <section className="bg-[#f3e8ff] rounded-2xl border border-[#d8b4fe] shadow-sm overflow-visible">
        {/* ส่วนหัว Timeline + ตัวกรอง + ช่องค้นหา */}
        <div className="p-5 md:p-6 border-b border-[#d8b4fe] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#3b076b] flex items-center gap-2">
              <span>Timeline</span>
            </h2>
            <Link
              href="/courses"
              className="text-xs font-bold text-[#700d2b] hover:underline"
            >
              ดูรายวิชาทั้งหมด
            </Link>
          </div>

          {/* แถบ Filter / Sort / Search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* ปุ่มเลือกสถานะ */}
              <TimelineSelect
                value={filterStatus}
                onChange={(val) =>
                  setFilterStatus(
                    val as "ALL" | "OVERDUE" | "UPCOMING" | "NO_DUE"
                  )
                }
                buttonClassName="bg-[#700d2b] text-white"
                options={[
                  { value: "ALL", label: "ทั้งหมด" },
                  { value: "OVERDUE", label: "เลยกำหนด" },
                  { value: "UPCOMING", label: "ยังไม่ถึงกำหนด" },
                  { value: "NO_DUE", label: "ไม่มีกำหนดส่ง" },
                ]}
              />

              {/* ปุ่มเรียงลำดับ */}
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

            {/* ช่องค้นหางานหรือชื่อวิชา */}
            <div className="w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by activity type or name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#c4b5fd] bg-white text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              />
            </div>
          </div>
        </div>

        {/* เนื้อหารายการ Timeline */}
        <div className="bg-white p-5 md:p-6 rounded-b-2xl">
          {loading ? (
            <p className="text-center text-sm text-zinc-500 py-10">
              กำลังโหลดข้อมูล Timeline...
            </p>
          ) : groupedItems.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-zinc-500 text-sm">
                ไม่พบรายการงานหรือกิจกรรมที่ตรงกับเงื่อนไข
              </p>
              {user?.role === "TEACHER" && (
                <Link
                  href="/courses"
                  className="inline-block mt-2 px-4 py-2 rounded-xl bg-[#700d2b] text-white text-xs font-semibold"
                >
                  ไปที่รายวิชาเพื่อสั่งงาน
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {groupedItems.map(([groupTitle, groupItems]) => (
                <div key={groupTitle} className="space-y-2">
                  {/* หัวข้อวันที่ หรือ ชื่อรายวิชา */}
                  <h3 className="text-sm md:text-base font-extrabold text-[#3b076b] pb-2 border-b border-[#e9d5ff]">
                    {groupTitle}
                  </h3>

                  <div className="divide-y divide-[#f3e8ff]">
                    {groupItems.map((item) => {
                      const isOverdue =
                        item.dueDate !== null && new Date(item.dueDate) < now;

                      return (
                        <div
                          key={item.id}
                          className="py-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 hover:bg-[#f5f0ff]/50 px-2 rounded-xl transition"
                        >
                          {/* ฝั่งซ้าย: เวลา + ไอคอน + รายละเอียดงาน */}
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            {/* เวลา */}
                            <span className="text-xs font-mono font-semibold text-zinc-500 w-11 shrink-0">
                              {formatTimeOnly(item.dueDate)}
                            </span>

                            {/* ไอคอนประเภทกิจกรรม */}
                            {item.type === "MATERIAL" ? (
                              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 font-bold text-xs border border-sky-200">
                                PDF
                              </span>
                            ) : (
                              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-600 text-white font-bold text-sm">
                                ✎
                              </span>
                            )}

                            {/* ชื่องาน + ป้าย Overdue + ชื่อรายวิชา */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  href={`/courses/${item.courseId}`}
                                  className="text-sm md:text-base font-bold text-[#7c3aed] hover:underline truncate"
                                >
                                  {item.title}
                                </Link>

                                {isOverdue && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white">
                                    Overdue
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-zinc-600 mt-0.5 truncate">
                                {item.type === "ASSIGNMENT"
                                  ? "Assignment is due"
                                  : "Course material"}{" "}
                                ·{" "}
                                <span className="font-semibold text-[#3b076b]">
                                  {item.courseName}
                                </span>{" "}
                                <span className="text-zinc-400">
                                  ({item.sectionTitle})
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* ฝั่งขวา: ปุ่ม View / เข้าดูห้องเรียน */}
                          <Link
                            href={`/courses/${item.courseId}`}
                            className="shrink-0 px-3.5 py-1.5 rounded-xl border border-[#c4b5fd] bg-[#f5f0ff] hover:bg-[#700d2b] hover:text-white hover:border-[#700d2b] text-xs font-bold text-[#3b076b] transition"
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