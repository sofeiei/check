"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Student = {
  id: number;
  studentId: string;
  name: string;
  gpa: number;
};

export default function CreateCoursePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/students?all=true")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setStudents(data);
      });
  }, []);

  const toggleStudent = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, studentIds: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "สร้างรายวิชาไม่สำเร็จ");
        setSubmitting(false);
        return;
      }

      router.push(`/courses/${data.id}`);
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/courses" className="text-sm text-[#700d2b] font-semibold hover:underline">
          กลับหน้ารายวิชาทั้งหมด
        </Link>
        <h1 className="text-2xl font-extrabold text-[#3b076b] mt-2">สร้างรายวิชาใหม่</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#f3e8ff] p-6 rounded-2xl border border-[#d8b4fe]">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-zinc-800 mb-1">ชื่อรายวิชา / ห้องเรียน *</label>
          <input
            type="text"
            required
            placeholder="เช่น COM-101 RES TEC 1/2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 text-sm py-2 border border-[#c4b5fd] rounded-xl bg-white text-zinc-800"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-zinc-800 mb-1">รายละเอียดรายวิชา (ไม่บังคับ)</label>
          <textarea
            rows={2}
            placeholder="คำอธิบายรายวิชาหรือกลุ่มเรียน"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 text-sm py-2 border border-[#c4b5fd] rounded-xl bg-white text-zinc-800"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-zinc-800">
              เลือกนักศึกษาเข้าเรียน (เลือกแล้ว {selectedIds.length} คน)
            </label>
          </div>

          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสนักศึกษา หรือชื่อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 mb-3 border border-[#c4b5fd] rounded-xl text-sm bg-white text-zinc-800"
          />

          <div className="max-h-72 overflow-y-auto border border-[#c4b5fd] rounded-xl divide-y divide-[#e9d5ff] bg-white">
            {filteredStudents.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500 text-center">ไม่พบรายชื่อนักศึกษา</p>
            ) : (
              filteredStudents.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center justify-between p-3 hover:bg-[#f5f0ff] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <p className="font-semibold text-sm text-zinc-800">{student.name}</p>
                      <p className="text-xs text-zinc-500">รหัสนักศึกษา : {student.studentId}</p>
                    </div>
                  </div>
                  {/* <span className="text-xs text-zinc-500">GPA: {student.gpa.toFixed(2)}</span> */}
                </label>
              ))
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-[#700d2b] hover:opacity-90 text-white rounded-xl font-bold disabled:opacity-50"
        >
          {submitting ? "กำลังสร้างรายวิชา..." : "บันทึกและสร้างรายวิชา"}
        </button>
      </form>
    </div>
  );
}