"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerSchema } from "@/lib/authSchema";

type Role = "STUDENT" | "TEACHER";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "STUDENT" as Role,
    teacherCode: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const inputCls =
    "w-full p-4 bg-white rounded-2xl mt-1 outline-none focus:ring-2 focus:ring-[#8b5cf6] transition-all border border-[#d8b4fe]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{3,15}$/.test(form.username)) {
      setError(
        form.role === "STUDENT"
          ? "กรุณากรอกรหัสนักศึกษา"
          : "กรุณากรอกรหัสประจำตัวอาจารย์"
      );
      return;
    }

    const cleanedName = form.name.trim().replace(/\s+/g, " ").toUpperCase();
    if (!/^[A-Z]+( [A-Z]+)*$/.test(cleanedName)) {
      setError("กรุณากรอกชื่อ-นามสกุลเป็นภาษาอังกฤษ");
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

    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
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
    <div className="max-w-md mx-auto bg-[#f3e8ff] p-8 rounded-3xl shadow-xl border border-[#e9d5ff] mt-10 animate-fade-in">
      <h2 className="text-3xl font-extrabold text-[#000000] mb-2 text-center">สมัครสมาชิก</h2>

      {error && (
        <div className="bg-[#f8d5ff] text-[#6d28d9] p-4 rounded-2xl mb-6 text-sm font-bold text-center border border-[#d8b4fe]">
          - {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <div className="grid grid-cols-2 gap-3 mt-1">
            {(["STUDENT", "TEACHER"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm({ ...form, role: r })}
                className={`py-3 rounded-2xl font-bold border transition-all ce ${
                  form.role === r
                    ? "bg-[#700d2b] text-white border-[#700d2b]"
                    : "bg-white text-[#5b21b6] border-[#d8b4fe] hover:bg-[#ede9fe]"
                }`}
              >
                {r === "STUDENT" ? "นักเรียน" : "อาจารย์"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-[#000000] ml-2">
            {form.role === "STUDENT" ? "รหัสนักศึกษา" : "รหัสประจำตัวอาจารย์"}
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="username"
            placeholder={
              form.role === "STUDENT"
                ? "รหัสนักศึกษา"
                : "รหัสประจำตัวอาจารย์"
            }
            className={inputCls}
            value={form.username}
            onChange={(e) => {
              const onlyNumbers = e.target.value.replace(/\D/g, "");
              setForm({ ...form, username: onlyNumbers });
            }}
          />
        </div>

        <div>
          <label className="text-sm font-bold text-[#000000] ml-2">
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

        <div>
          <label className="text-sm font-bold text-[#000000] ml-2">รหัสผ่าน</label>
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
            <label className="text-sm font-bold text-[#000000] ml-2">ตั้งรหัสสำหรับอาจารย์</label>
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
          className="bg-[#700d2b] text-white font-bold py-4 rounded-2xl shadow-lg hover:text-yellow-300 active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
        >
          {isLoading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600 mt-6">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-bold text-[#700d2b] hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}