"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerSchema } from "@/lib/authSchema";

type Role = "STUDENT" | "TEACHER";
const YEAR_LIST = Array.from({ length: 6 }, (_, i) => `ชั้นปีที่ ${i + 1}`);

function inferYearFromId(studentId: string): string | null {
  if (/^\d{2}/.test(studentId)) {
    const enrollYear = Number(studentId.slice(0, 2));
    const currentThaiYear = 69; // พ.ศ. 2569
    const yearNum = currentThaiYear - enrollYear + 1;
    if (yearNum >= 1 && yearNum <= 6) {
      return `ชั้นปีที่ ${yearNum}`;
    }
  }
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "STUDENT" as Role,
    year: "ชั้นปีที่ 1",
    faculty: "",
    major: "",
    teacherCode: "",
  });
  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const inputCls =
    "w-full p-4 bg-[#263042] text-white placeholder-[#7f8999] rounded-2xl mt-1.5 outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-[#f59e0b] transition-all border border-[#3a465c]";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(e.target as Node)
      ) {
        setIsYearOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{3,15}$/.test(form.username)) {
      setError(
        form.role === "STUDENT"
          ? "กรุณากรอกรหัสนักศึกษาเป็นตัวเลขเท่านั้น"
          : "กรุณากรอกรหัสประจำตัวอาจารย์เป็นตัวเลขเท่านั้น"
      );
      return;
    }

    const cleanedName = form.name.trim().replace(/\s+/g, " ").toUpperCase();
    if (!/^[A-Z]+( [A-Z]+)*$/.test(cleanedName)) {
      setError("กรุณากรอกชื่อ-นามสกุลเป็นภาษาอังกฤษเท่านั้น");
      return;
    }

    const result = registerSchema.safeParse({ ...form, name: cleanedName });
    if (!result.success) {
      setError(result.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
      return;
    }

    if (form.role === "TEACHER" && form.teacherCode.trim().length < 4) {
      setError("กรุณาตั้งรหัสสำหรับอาจารย์อย่างน้อย 4 ตัวอักษร");
      return;
    }

    const combinedFacultyMajor = [form.faculty.trim(), form.major.trim()]
      .filter(Boolean)
      .join(" - ");

    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...result.data,
          year: form.role === "STUDENT" ? form.year : undefined,
          facultyMajor:
            form.role === "STUDENT" && combinedFacultyMajor
              ? combinedFacultyMajor
              : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-[#151c2c] p-8 rounded-3xl shadow-xl border border-[#2a3447] mt-10 animate-fade-in">
      <h2 className="text-3xl font-extrabold text-white mb-6 text-center">สมัครสมาชิก</h2>

      {error && (
        <div className="bg-red-500/15 text-red-300 p-4 rounded-2xl mb-6 text-sm font-bold text-center border border-red-500/30">
          * {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <div className="grid grid-cols-2 gap-3 mt-1">
            {(["STUDENT", "TEACHER"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setForm({ ...form, role: r });
                  setError("");
                }}
                className={`py-3 rounded-2xl font-bold border transition-all cursor-pointer ${
                  form.role === r
                    ? "bg-[#f59e0b] text-[#0f172a] border-[#f59e0b]"
                    : "bg-[#263042] text-slate-300 border-[#3a465c] hover:bg-[#2f3b52]"
                }`}
              >
                {r === "STUDENT" ? "นักเรียน" : "อาจารย์"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-white ml-1">
            {form.role === "STUDENT" ? "รหัสนักศึกษา" : "รหัสประจำตัวอาจารย์"}
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="username"
            placeholder={
              form.role === "STUDENT" ? "รหัสนักศึกษา" : "รหัสประจำตัวอาจารย์"
            }
            className={inputCls}
            value={form.username}
            onChange={(e) => {
              const onlyNumbers = e.target.value.replace(/\D/g, "");
              const inferred =
                form.role === "STUDENT" ? inferYearFromId(onlyNumbers) : null;
              setForm({
                ...form,
                username: onlyNumbers,
                year: inferred ?? form.year,
              });
            }}
          />
        </div>

        <div>
          <label className="text-sm font-bold text-white ml-1">
            ชื่อ-นามสกุล (ภาษาอังกฤษ)
          </label>
          <input
            type="text"
            placeholder="ชื่อ-นามสกุล"
            className={`${inputCls} uppercase`}
            value={form.name}
            onChange={(e) => {
              const englishUpper = e.target.value.replace(/[^a-zA-Z\s]/g, "").toUpperCase();
              setForm({ ...form, name: englishUpper });
            }}
          />
        </div>

        {form.role === "STUDENT" && (
          <>
            <div ref={yearDropdownRef} className="relative">
              <label className="text-sm font-bold text-white ml-1">ชั้นปี</label>
              <button
                type="button"
                onClick={() => setIsYearOpen((prev) => !prev)}
                className={`w-full p-4 bg-[#263042] text-white rounded-2xl mt-1.5 border transition-all flex items-center justify-between cursor-pointer ${
                  isYearOpen
                    ? "border-[#f59e0b] ring-2 ring-[#f59e0b]"
                    : "border-[#3a465c] hover:border-slate-500"
                }`}
              >
                <span className="font-bold text-[#f59e0b]">{form.year}</span>
                <svg
                  className={`w-5 h-5 text-slate-300 transition-transform duration-200 ${
                    isYearOpen ? "rotate-180 text-[#f59e0b]" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isYearOpen && (
                <div className="absolute left-0 right-0 mt-2 max-h-56 overflow-y-auto bg-[#1e2638] border border-[#3a465c] rounded-2xl shadow-2xl divide-y divide-[#2a3447] z-30">
                  {YEAR_LIST.map((yr) => {
                    const isSelected = form.year === yr;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, year: yr });
                          setIsYearOpen(false);
                        }}
                        className={`w-full px-4 py-3.5 text-left text-sm font-bold flex items-center gap-3 transition cursor-pointer ${
                          isSelected
                            ? "bg-[#2a3447] text-white"
                            : "text-slate-200 hover:bg-[#263042]"
                        }`}
                      >
                        <span className="w-4 flex items-center justify-center text-[#f59e0b]">
                          {isSelected && (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </span>
                        <span>{yr}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-bold text-white ml-1">คณะ</label>
              <input
                type="text"
                placeholder="Ex. CoC"
                className={inputCls}
                value={form.faculty}
                onChange={(e) => setForm({ ...form, faculty: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-white ml-1">สาขา</label>
              <input
                type="text"
                placeholder="Ex. AISE"
                className={inputCls}
                value={form.major}
                onChange={(e) => setForm({ ...form, major: e.target.value })}
              />
            </div>
          </>
        )}

        <div>
          <label className="text-sm font-bold text-white ml-1">รหัสผ่าน</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="อย่างน้อย 8 ตัวอักษร"
            className={inputCls}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        {form.role === "TEACHER" && (
          <div>
            <label className="text-sm font-bold text-white ml-1">ตั้งรหัสสำหรับอาจารย์</label>
            <input
              type="text"
              placeholder="สร้างรหัสประจำตัว 4 ตัว"
              className={inputCls}
              value={form.teacherCode}
              onChange={(e) => setForm({ ...form, teacherCode: e.target.value })}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#f59e0b] text-[#0f172a] font-extrabold py-4 rounded-2xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 mt-2 cursor-pointer"
        >
          {isLoading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-bold text-[#f59e0b] hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}