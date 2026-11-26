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
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <Link href="/courses" className="text-[#700d2b] hover:underline font-semibold">
          ← กลับหน้ารายวิชาทั้งหมด
        </Link>
      </div>
    );
  }

  if (!course) return <div className="p-6 text-center text-zinc-500">กำลังโหลดข้อมูลรายวิชา...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f3e8ff] px-4 py-2.5 rounded-xl border border-[#d8b4fe] text-sm">
        <div className="flex items-center gap-2 text-zinc-700">
          <Link href="/courses" className="hover:text-[#700d2b] font-semibold">
            🏠 Courses
          </Link>
          <span>›</span>
          <span className="font-bold text-[#3b076b]">{course.name}</span>
        </div>

        {isOwner && (
          <button
            onClick={handleDeleteCourse}
            className="text-xs px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            ลบรายวิชา
          </button>
        )}
      </div>

      {/* กล่องหลักของรายวิชา */}
      <div className="bg-[#f3e8ff] rounded-2xl border border-[#d8b4fe] shadow-sm overflow-hidden">
        <div className="p-6 pb-0">
          <h1 className="text-2xl font-extrabold text-[#3b076b]">{course.name}</h1>
          {course.description && <p className="text-sm text-zinc-600 mt-1">{course.description}</p>}
          <p className="text-xs text-zinc-500 mt-2">อาจารย์ผู้สอน: {course.creator.name}</p>

          <div className="flex items-center gap-6 mt-5 border-b border-[#d8b4fe] text-sm font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("course")}
              className={`pb-3 border-b-2 transition ${
                activeTab === "course"
                  ? "border-[#700d2b] text-[#700d2b]"
                  : "border-transparent text-zinc-600 hover:text-[#3b076b]"
              }`}
            >
              Course ({course.sections?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("participants")}
              className={`pb-3 border-b-2 transition ${
                activeTab === "participants"
                  ? "border-[#700d2b] text-[#700d2b]"
                  : "border-transparent text-zinc-600 hover:text-[#3b076b]"
              }`}
            >
              Participants ({course.members.length})
            </button>
          </div>
        </div>

        {/* แท็บ 1: Course */}
        {activeTab === "course" && (
          <div className="p-6 space-y-4">
            {isOwner && (
              <div className="flex justify-end">
                {!showNewSection ? (
                  <button
                    type="button"
                    onClick={() => setShowNewSection(true)}
                    className="px-4 py-2 rounded-xl bg-[#700d2b] hover:opacity-90 text-white text-sm font-semibold shadow-xs"
                  >
                    + เพิ่มหัวข้อ (Add Section / List)
                  </button>
                ) : (
                  <form
                    onSubmit={handleCreateSection}
                    className="w-full flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-[#c4b5fd]"
                  >
                    <input
                      type="text"
                      required
                      placeholder="เช่น Week 1: Course Overview, Intro to Academic Research"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      className="flex-1 min-w-[220px] px-3 py-1.5 text-sm border border-[#c4b5fd] rounded-lg text-zinc-800"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#700d2b] text-white text-sm font-semibold"
                    >
                      บันทึกหัวข้อ
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewSection(false)}
                      className="px-3 py-1.5 rounded-lg border border-[#c4b5fd] text-sm text-zinc-600"
                    >
                      ยกเลิก
                    </button>
                  </form>
                )}
              </div>
            )}

            {!course.sections || course.sections.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-[#c4b5fd] p-10 text-center text-sm text-zinc-500">
                ยังไม่มีหัวข้อหรือคำสั่งงานในรายวิชานี้
              </div>
            ) : (
              <div className="divide-y divide-[#e9d5ff] border border-[#d8b4fe] rounded-xl bg-white overflow-hidden">
                {course.sections.map((section) => {
                  const isExpanded = !!expandedSections[section.id];
                  return (
                    <div key={section.id} className="transition-colors">
                      <div className="flex items-center justify-between px-5 py-4 hover:bg-[#f5f0ff]/60">
                        <button
                          type="button"
                          onClick={() => toggleSection(section.id)}
                          className="flex items-center gap-3.5 text-left flex-1"
                        >
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e9d5ff] text-[#700d2b] font-bold text-sm transition-transform">
                            {isExpanded ? "⌄" : "›"}
                          </span>
                          <span className="text-base md:text-lg font-extrabold text-[#3b076b]">
                            {section.title}
                          </span>
                        </button>

                        {isOwner && (
                          <div className="flex items-center gap-2 ml-3">
                            <button
                              type="button"
                              onClick={() => setTargetSectionId(section.id)}
                              className="px-3 py-1 rounded-lg bg-[#7c3aed] hover:opacity-90 text-white text-xs font-semibold"
                            >
                              + สั่งงาน / เพิ่มรายการ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(section.id)}
                              className="px-2 py-1 text-xs text-red-500 hover:underline"
                            >
                              ลบ
                            </button>
                          </div>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="px-6 pb-5 pt-1 pl-14 space-y-3 border-t border-[#f3e8ff]">
                          {section.items.length === 0 ? (
                            <p className="text-xs text-zinc-400 italic py-2">
                              ยังไม่มีรายการในหัวข้อนี้
                            </p>
                          ) : (
                            section.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-start justify-between gap-4 py-3 border-b last:border-b-0 border-[#f3e8ff]"
                              >
                                <div className="flex items-start gap-3.5">
                                  {item.type === "MATERIAL" ? (
                                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 font-bold text-xs border border-sky-200">
                                      PDF
                                    </span>
                                  ) : (
                                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-600 text-white font-bold text-sm">
                                      ✎
                                    </span>
                                  )}

                                  <div>
                                    <p className="text-sm md:text-base font-bold text-[#7c3aed]">
                                      {item.title}
                                    </p>

                                    {item.description && (
                                      <p className="text-sm text-zinc-700 mt-1 whitespace-pre-line">
                                        {item.description}
                                      </p>
                                    )}

                                    {(item.openedAt || item.dueDate) && (
                                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-600 mt-1.5">
                                        {item.openedAt && (
                                          <span>
                                            <strong className="text-zinc-800">Opened:</strong>{" "}
                                            {formatDateTime(item.openedAt)}
                                          </span>
                                        )}
                                        {item.dueDate && (
                                          <span>
                                            <strong className="text-zinc-800">Due:</strong>{" "}
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
                                    className="text-xs text-red-500 hover:underline shrink-0"
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
              <h2 className="text-base font-bold text-[#3b076b]">
                รายชื่อนักศึกษาในรายวิชา ({course.members.length} คน)
              </h2>
              {isOwner && (
                <button
                  onClick={openAddMembers}
                  className="px-3.5 py-1.5 bg-[#700d2b] hover:opacity-90 text-white text-sm rounded-xl font-semibold"
                >
                  + เพิ่มสมาชิก
                </button>
              )}
            </div>

            {course.members.length === 0 ? (
              <p className="text-zinc-500 text-sm bg-white p-6 rounded-xl text-center">
                ยังไม่มีนักศึกษาในรายวิชานี้
              </p>
            ) : (
              <div className="border border-[#d8b4fe] rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f5f0ff] border-b border-[#d8b4fe] text-[#3b076b]">
                    <tr>
                      <th className="p-3">รหัสนักศึกษา</th>
                      <th className="p-3">ชื่อ-นามสกุล</th>
                      <th className="p-3">GPA</th>
                      {isOwner && <th className="p-3 text-right">จัดการ</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3e8ff]">
                    {course.members.map(({ student }) => (
                      <tr key={student.id}>
                        <td className="p-3 font-mono">{student.studentId}</td>
                        <td className="p-3 font-medium">{student.name}</td>
                        <td className="p-3">{student.gpa.toFixed(2)}</td>
                        {isOwner && (
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleRemoveMember(student.id)}
                              className="text-red-500 hover:underline text-xs font-semibold"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateItem}
            className="bg-[#f5f0ff] border border-[#d8b4fe] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <h3 className="font-extrabold text-lg text-[#3b076b]">
              เพิ่มรายการ / สั่งงานในหัวข้อ
            </h3>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">ประเภท</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as "ASSIGNMENT" | "MATERIAL")}
                className="w-full px-3 py-2 text-sm border border-[#c4b5fd] rounded-xl bg-white text-zinc-800"
              >
                <option value="ASSIGNMENT">✎ สั่งงาน (Assignment)</option>
                <option value="MATERIAL">📄 เอกสาร / สไลด์ (Material)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                ชื่องาน / หัวข้อเอกสาร *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น Assignment 1: Submit 1 research article + short note"
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#c4b5fd] rounded-xl bg-white text-zinc-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                รายละเอียดคำสั่งงาน หรือลิงก์เพิ่มเติม
              </label>
              <textarea
                rows={3}
                placeholder="พิมพ์คำสั่งงาน รายละเอียดการส่ง หรือแปะลิงก์ไฟล์ที่นี่..."
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#c4b5fd] rounded-xl bg-white text-zinc-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  วันเปิด (Opened - ไม่บังคับ)
                </label>
                <input
                  type="datetime-local"
                  value={itemOpenedAt}
                  onChange={(e) => setItemOpenedAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#c4b5fd] rounded-xl bg-white text-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  กำหนดส่ง (Due - ไม่บังคับ)
                </label>
                <input
                  type="datetime-local"
                  value={itemDueDate}
                  onChange={(e) => setItemDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#c4b5fd] rounded-xl bg-white text-zinc-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTargetSectionId(null)}
                className="px-4 py-2 text-sm border border-[#c4b5fd] rounded-xl bg-white text-zinc-700"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-[#700d2b] text-white rounded-xl font-semibold"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal เพิ่มสมาชิก */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#f5f0ff] border border-[#d8b4fe] rounded-2xl max-w-md w-full p-5 shadow-xl">
            <h3 className="font-bold text-lg text-[#3b076b] mb-3">เพิ่มนักศึกษาเข้ารายวิชา</h3>
            <div className="max-h-60 overflow-y-auto divide-y divide-[#e9d5ff] border border-[#c4b5fd] rounded-xl bg-white mb-4">
              {allStudents.length === 0 ? (
                <p className="p-4 text-sm text-zinc-500 text-center">
                  ไม่มีนักศึกษาเพิ่มเติมให้เลือกแล้ว
                </p>
              ) : (
                allStudents.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-[#f5f0ff]">
                    <input
                      type="checkbox"
                      checked={selectedNewIds.includes(s.id)}
                      onChange={() =>
                        setSelectedNewIds((prev) =>
                          prev.includes(s.id) ? prev.filter((i) => i !== s.id) : [...prev, s.id]
                        )
                      }
                    />
                    <span className="text-sm text-zinc-800">
                      {s.studentId} - {s.name}
                    </span>
                  </label>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="px-3 py-1.5 text-sm border border-[#c4b5fd] bg-white rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddMembers}
                className="px-3 py-1.5 text-sm bg-[#700d2b] text-white rounded-xl font-semibold"
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