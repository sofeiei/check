"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

type Student = {
  id: number;
  studentId: string;
  name: string;
  gpa: number;
};

type CourseItem = {
  id: number;
  title: string;
  description: string | null;
  type: "MATERIAL" | "ASSIGNMENT";
  openedAt: string | null;
  dueDate: string | null;
};

type CourseSection = {
  id: number;
  title: string;
  items: CourseItem[];
};

type CourseDetail = {
  id: number;
  name: string;
  description: string | null;
  creatorId: number;
  creator: { id: number; name: string };
  members: { id: number; student: Student }[];
  sections: CourseSection[];
};

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"course" | "participants">("course");

  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");

  const [targetSectionId, setTargetSectionId] = useState<number | null>(null);
  const [itemTitle, setItemTitle] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemType, setItemType] = useState<"ASSIGNMENT" | "MATERIAL">("ASSIGNMENT");
  const [itemOpenedAt, setItemOpenedAt] = useState("");
  const [itemDueDate, setItemDueDate] = useState("");

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedNewIds, setSelectedNewIds] = useState<number[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const loadCourse = async () => {
    const res = await fetch(`/api/courses/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "ไม่พบรายวิชาหรือคุณไม่มีสิทธิ์เข้าถึง");
      return;
    }
    setCourse(data);
    if (Array.isArray(data.sections) && data.sections.length > 0) {
      setExpandedSections((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        return { [data.sections[0].id]: true };
      });
    }
  };

  useEffect(() => {
    loadCourse();
  }, [id]);

  const isOwner = user?.role === "TEACHER" && course?.creatorId === user.id;

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    const res = await fetch(`/api/courses/${id}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newSectionTitle }),
    });
    if (res.ok) {
      const created = await res.json();
      setNewSectionTitle("");
      setShowNewSection(false);
      setExpandedSections((prev) => ({ ...prev, [created.id]: true }));
      loadCourse();
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!confirm("ยืนยันการลบหัวข้อนี้? รายการสั่งงานทั้งหมดในหัวข้อนี้จะถูกลบด้วย")) return;
    await fetch(`/api/courses/${id}/sections/${sectionId}`, { method: "DELETE" });
    loadCourse();
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSectionId || !itemTitle.trim()) return;

    const res = await fetch(`/api/courses/${id}/sections/${targetSectionId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: itemTitle,
        description: itemDesc,
        type: itemType,
        openedAt: itemOpenedAt || null,
        dueDate: itemDueDate || null,
      }),
    });

    if (res.ok) {
      setExpandedSections((prev) => ({ ...prev, [targetSectionId]: true }));
      setTargetSectionId(null);
      setItemTitle("");
      setItemDesc("");
      setItemType("ASSIGNMENT");
      setItemOpenedAt("");
      setItemDueDate("");
      loadCourse();
    }
  };

  const handleDeleteItem = async (sectionId: number, itemId: number) => {
    if (!confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) return;
    await fetch(`/api/courses/${id}/sections/${sectionId}/items?itemId=${itemId}`, {
      method: "DELETE",
    });
    loadCourse();
  };

  const openAddMembers = async () => {
    const res = await fetch("/api/students?all=true");
    const data = await res.json();
    if (Array.isArray(data) && course) {
      const existingIds = new Set(course.members.map((m) => m.student.id));
      setAllStudents(data.filter((s) => !existingIds.has(s.id)));
      setSelectedNewIds([]);
      setShowAddMemberModal(true);
    }
  };

  const handleAddMembers = async () => {
    if (selectedNewIds.length === 0) return;
    await fetch(`/api/courses/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds: selectedNewIds }),
    });
    setShowAddMemberModal(false);
    loadCourse();
  };

  const handleRemoveMember = async (studentId: number) => {
    if (!confirm("ต้องการลบนักศึกษาคนนี้ออกจากรายวิชาใช่หรือไม่?")) return;
    await fetch(`/api/courses/${id}/members?studentId=${studentId}`, {
      method: "DELETE",
    });
    loadCourse();
  };

  const handleDeleteCourse = async () => {
    if (!confirm("ยืนยันการลบรายวิชานี้? ข้อมูลทั้งหมดจะถูกลบถาวร")) return;
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/courses");
      router.refresh();
    }
  };

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-red-400 font-medium mb-4">{error}</p>
        <Link href="/courses" className="text-[#f59e0b] hover:underline font-semibold">
          ← กลับหน้ารายวิชาทั้งหมด
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 text-center text-[#f59e0b] font-bold animate-pulse">
        กำลังโหลดข้อมูลรายวิชา...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 mt-4">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151c2c] px-5 py-3 rounded-2xl border border-[#2a3447] text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Link
            href="/courses"
            className="hover:text-[#f59e0b] font-semibold flex items-center gap-1.5 transition"
          >
            <svg className="w-5 h-5 text-[#f59e0b]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
            </svg>
            <span>Courses</span>
          </Link>
          <span className="text-slate-500">›</span>
          <span className="font-bold text-[#f59e0b]">{course.name}</span>
        </div>

        {isOwner && (
          <button
            onClick={handleDeleteCourse}
            className="text-xs px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition cursor-pointer"
          >
            ลบรายวิชา
          </button>
        )}
      </div>

      {/* กล่องหลักของรายวิชา */}
      <div className="bg-[#151c2c] rounded-3xl border border-[#2a3447] shadow-xl overflow-hidden">
        <div className="p-6 pb-0">
          {/* ชื่อคอร์ส (ซ้าย) ตรงข้ามกับปุ่ม Add Section (ขวา) */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-[#f59e0b] break-words">
                {course.name}
              </h1>
              {course.description && (
                <p className="text-sm text-slate-300 mt-1">{course.description}</p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                อาจารย์ผู้สอน: {course.creator.name}
              </p>
            </div>

            {isOwner && !showNewSection && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("course");
                  setShowNewSection(true);
                }}
                className="text-xs px-3.5 py-1.5 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition cursor-pointer"
              >
                Add Section
              </button>
            )}
          </div>

          {/* ฟอร์มเพิ่มหัวข้อใหม่ (แสดงเมื่อกด Add Section) */}
          {isOwner && showNewSection && (
            <form
              onSubmit={handleCreateSection}
              className="mt-4 w-full flex flex-wrap items-center gap-2 bg-[#1e2638] p-3.5 rounded-2xl border border-[#3a465c]"
            >
              <input
                type="text"
                required
                autoFocus
                placeholder="Add new section title"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                className="flex-1 min-w-[200px] px-3.5 py-2 text-sm border border-[#3a465c] rounded-xl bg-[#263042] text-white placeholder-[#7f8999] outline-none focus:ring-2 focus:ring-[#f59e0b]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#f59e0b] text-[#0f172a] text-sm font-extrabold cursor-pointer"
              >
                บันทึกหัวข้อ
              </button>
              <button
                type="button"
                onClick={() => setShowNewSection(false)}
                className="px-3.5 py-2 rounded-xl border border-[#3a465c] bg-[#263042] text-sm text-slate-300 hover:text-white cursor-pointer"
              >
                ยกเลิก
              </button>
            </form>
          )}

          <div className="flex items-center gap-6 mt-5 border-b border-[#2a3447] text-sm font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("course")}
              className={`pb-3 border-b-2 transition cursor-pointer ${activeTab === "course"
                  ? "border-[#f59e0b] text-[#f59e0b]"
                  : "border-transparent text-slate-400 hover:text-white"
                }`}
            >
              Course ({course.sections?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("participants")}
              className={`pb-3 border-b-2 transition cursor-pointer ${activeTab === "participants"
                  ? "border-[#f59e0b] text-[#f59e0b]"
                  : "border-transparent text-slate-400 hover:text-white"
                }`}
            >
              Participants ({course.members.length})
            </button>
          </div>
        </div>

        {/* แท็บ 1: Course */}
        {activeTab === "course" && (
          <div className="p-6 space-y-4">
            {!course.sections || course.sections.length === 0 ? (
              <div className="bg-[#1e2638] rounded-2xl border border-[#3a465c] p-10 text-center text-sm text-slate-400">
                ยังไม่มีหัวข้อหรือคำสั่งงานในรายวิชานี้
              </div>
            ) : (
              <div className="divide-y divide-[#2a3447] border border-[#2a3447] rounded-2xl bg-[#1e2638] overflow-hidden">
                {course.sections.map((section) => {
                  const isExpanded = !!expandedSections[section.id];
                  return (
                    <div key={section.id} className="transition-colors">
                      <div className="flex items-center justify-between px-5 py-4 hover:bg-[#263042]/60">
                        <button
                          type="button"
                          onClick={() => toggleSection(section.id)}
                          className="flex items-center gap-3.5 text-left flex-1 cursor-pointer"
                        >
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#263042] border border-[#3a465c] text-[#f59e0b] font-bold text-sm transition-transform">
                            {isExpanded ? "⌄" : "›"}
                          </span>
                          <span className="text-base md:text-lg font-extrabold text-white">
                            {section.title}
                          </span>
                        </button>

                        {isOwner && (
                          <div className="flex items-center gap-2 ml-3">
                            <button
                              type="button"
                              onClick={() => setTargetSectionId(section.id)}
                              className="text-xs px-3.5 py-1.5 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition cursor-pointer"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(section.id)}
                              className="text-xs px-3.5 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold transition cursor-pointer"
                            >
                              ลบ
                            </button>
                          </div>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="px-6 pb-5 pt-2 pl-14 space-y-3 border-t border-[#2a3447] bg-[#151c2c]/60">
                          {section.items.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2">
                              ยังไม่มีรายการในหัวข้อนี้
                            </p>
                          ) : (
                            section.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-start justify-between gap-4 py-3 border-b last:border-b-0 border-[#2a3447]"
                              >
                                <div className="flex items-start gap-3.5">
                                  {item.type === "MATERIAL" ? (
                                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                      </svg>
                                    </span>
                                  ) : (
                                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                      </svg>
                                    </span>
                                  )}

                                  <div>
                                    <p className="text-sm md:text-base font-bold text-[#f59e0b]">
                                      {item.title}
                                    </p>

                                    {item.description && (
                                      <p className="text-sm text-slate-300 mt-1 whitespace-pre-line">
                                        {item.description}
                                      </p>
                                    )}

                                    {(item.openedAt || item.dueDate) && (
                                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400 mt-1.5">
                                        {item.openedAt && (
                                          <span>
                                            <strong className="text-slate-200">Opened:</strong>{" "}
                                            {formatDateTime(item.openedAt)}
                                          </span>
                                        )}
                                        {item.dueDate && (
                                          <span>
                                            <strong className="text-slate-200">Due:</strong>{" "}
                                            {formatDateTime(item.dueDate)}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {isOwner && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(section.id, item.id)}
                                    className="text-xs text-red-400 hover:underline shrink-0 cursor-pointer"
                                  >
                                    ลบ
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* แท็บ 2: Participants */}
        {activeTab === "participants" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">
                รายชื่อนักศึกษาในรายวิชา ({course.members.length} คน)
              </h2>
              {isOwner && (
                <button
                  onClick={openAddMembers}
                  className="px-4 py-1.5 bg-[#f59e0b] hover:opacity-90 text-[#0f172a] text-sm rounded-full font-extrabold cursor-pointer"
                >
                  เพิ่มสมาชิก
                </button>
              )}
            </div>

            {course.members.length === 0 ? (
              <p className="text-slate-400 text-sm bg-[#1e2638] border border-[#3a465c] p-6 rounded-2xl text-center">
                ยังไม่มีนักศึกษาในรายวิชานี้
              </p>
            ) : (
              <div className="border border-[#2a3447] rounded-2xl overflow-hidden bg-[#1e2638]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#263042] border-b border-[#3a465c] text-[#f59e0b]">
                    <tr>
                      <th className="p-3.5">รหัสนักศึกษา</th>
                      <th className="p-3.5">ชื่อ-นามสกุล</th>
                      {isOwner && <th className="p-3.5 text-right">จัดการ</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a3447] text-slate-200">
                    {course.members.map(({ student }) => (
                      <tr key={student.id} className="hover:bg-[#263042]/50">
                        <td className="p-3.5 font-mono text-[#f59e0b] font-bold">
                          {student.studentId}
                        </td>
                        <td className="p-3.5 font-semibold text-white">{student.name}</td>
                        {isOwner && (
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleRemoveMember(student.id)}
                              className="text-red-400 hover:underline text-xs font-semibold cursor-pointer"
                            >
                              นำออกจากรายวิชา
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal สั่งงาน / เพิ่มเอกสาร */}
      {targetSectionId !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateItem}
            className="bg-[#151c2c] border border-[#2a3447] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-extrabold text-lg text-[#f59e0b]">
              {course.sections.find((s) => s.id === targetSectionId)?.title}
            </h3>

            <div>
              <label className="block text-xs font-bold text-white mb-1.5">ประเภท</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setItemType("ASSIGNMENT")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer ${itemType === "ASSIGNMENT"
                      ? "bg-[#f59e0b] text-[#0f172a] border-[#f59e0b] shadow-md"
                      : "bg-[#263042] text-slate-300 border-[#3a465c] hover:bg-[#2f3b52] hover:text-white"
                    }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  <span>Assignment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setItemType("MATERIAL")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer ${itemType === "MATERIAL"
                      ? "bg-[#f59e0b] text-[#0f172a] border-[#f59e0b] shadow-md"
                      : "bg-[#263042] text-slate-300 border-[#3a465c] hover:bg-[#2f3b52] hover:text-white"
                    }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span>Lecture</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1">
                {itemType === "ASSIGNMENT" ? "ชื่องานที่สั่ง *" : "ชื่อเอกสาร / สไลด์ *"}
              </label>
              <input
                type="text"
                required
                placeholder={
                  itemType === "ASSIGNMENT"
                    ? "เช่น Assignment 1: Submit 1 research article + short note"
                    : "เช่น Lecture 1: Course Overview & Introduction Slides"
                }
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-[#3a465c] rounded-xl bg-[#263042] text-white placeholder-[#7f8999] outline-none focus:ring-2 focus:ring-[#f59e0b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1">
                {itemType === "ASSIGNMENT"
                  ? "รายละเอียดคำสั่งงาน หรือลิงก์เพิ่มเติม"
                  : "คำอธิบายเอกสาร หรือลิงก์ดาวน์โหลด"}
              </label>
              <textarea
                rows={3}
                placeholder={
                  itemType === "ASSIGNMENT"
                    ? "พิมพ์คำสั่งงาน รายละเอียดการส่ง หรือแปะลิงก์ไฟล์ที่นี่..."
                    : "พิมพ์สรุปเนื้อหาเอกสาร หรือแปะลิงก์ไฟล์สไลด์ที่นี่..."
                }
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-[#3a465c] rounded-xl bg-[#263042] text-white placeholder-[#7f8999] outline-none focus:ring-2 focus:ring-[#f59e0b]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  วันเปิด (ไม่บังคับ)
                </label>
                <input
                  type="datetime-local"
                  value={itemOpenedAt}
                  onChange={(e) => setItemOpenedAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#3a465c] rounded-xl bg-[#263042] text-white outline-none focus:ring-2 focus:ring-[#f59e0b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  กำหนดส่ง (ไม่บังคับ)
                </label>
                <input
                  type="datetime-local"
                  value={itemDueDate}
                  onChange={(e) => setItemDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#3a465c] rounded-xl bg-[#263042] text-white outline-none focus:ring-2 focus:ring-[#f59e0b]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTargetSectionId(null)}
                className="px-4 py-2 text-sm border border-[#3a465c] rounded-xl bg-[#263042] text-slate-200 hover:bg-[#334155] cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-[#f59e0b] text-[#0f172a] rounded-xl font-extrabold cursor-pointer"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal เพิ่มสมาชิก */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#151c2c] border border-[#2a3447] rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-extrabold text-lg text-[#f59e0b] mb-3">
              เพิ่มนักศึกษาเข้ารายวิชา
            </h3>
            <div className="max-h-60 overflow-y-auto divide-y divide-[#2a3447] border border-[#3a465c] rounded-2xl bg-[#1e2638] mb-4">
              {allStudents.length === 0 ? (
                <p className="p-4 text-sm text-slate-400 text-center">
                  ไม่มีนักศึกษาเพิ่มเติมให้เลือกแล้ว
                </p>
              ) : (
                allStudents.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#263042]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedNewIds.includes(s.id)}
                      onChange={() =>
                        setSelectedNewIds((prev) =>
                          prev.includes(s.id) ? prev.filter((i) => i !== s.id) : [...prev, s.id]
                        )
                      }
                      className="accent-[#f59e0b]"
                    />
                    <span className="text-sm text-white">
                      <span className="font-bold text-[#f59e0b]">{s.studentId}</span> - {s.name}
                    </span>
                  </label>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="px-4 py-2 text-sm border border-[#3a465c] bg-[#263042] text-slate-200 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddMembers}
                className="px-4 py-2 text-sm bg-[#f59e0b] text-[#0f172a] rounded-xl font-extrabold cursor-pointer"
              >
                เพิ่มสมาชิก ({selectedNewIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}