"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginSchema } from "@/lib/authSchema";

type Role = "STUDENT" | "TEACHER";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("STUDENT");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{3,15}$/.test(form.username)) {
      setError(
        role === "STUDENT"
          ? "กรุณากรอกรหัสนักศึกษาเป็นตัวเลขเท่านั้น"
          : "กรุณากรอกรหัสประจำตัวอาจารย์เป็นตัวเลขเท่านั้น"
      );
      return;
    }

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, role }),
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
      <h2 className="text-3xl font-extrabold text-[#000000] mb-8 text-center">เข้าสู่ระบบ</h2>

      {error && (
        <div className="bg-[#f8d5ff] text-[#6d28d9] p-4 rounded-2xl mb-6 text-sm font-bold text-center border border-[#d8b4fe]">
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
                  setRole(r);
                  setError("");
                }}
                className={`py-3 rounded-2xl font-bold border transition-all ${
                  role === r
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
            {role === "STUDENT" ? "รหัสนักศึกษา" : "รหัสประจำตัวอาจารย์"}
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="username"
            placeholder={
              role === "STUDENT"
                ? "รหัสนักศึกษา"
                : "รหัสประจำตัวอาจารย์"
            }
            className="w-full p-4 bg-white rounded-2xl mt-1 outline-none focus:ring-2 focus:ring-[#8b5cf6] transition-all border border-[#d8b4fe]"
            value={form.username}
            onChange={(e) => {
              const onlyNumbers = e.target.value.replace(/\D/g, "");
              setForm({ ...form, username: onlyNumbers });
            }}
          />
        </div>

        <div>
          <label className="text-sm font-bold text-[#000000] ml-2">รหัสผ่าน</label>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="รหัสผ่าน"
            className="w-full p-4 bg-white rounded-2xl mt-1 outline-none focus:ring-2 focus:ring-[#8b5cf6] transition-all border border-[#d8b4fe]"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#700d2b] text-white font-bold py-4 rounded-2xl shadow-lg hover:text-yellow-300 active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
        >
          {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600 mt-6">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="font-bold text-[#700d2b] hover:underline">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  );
}