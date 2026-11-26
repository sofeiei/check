"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProfileData = {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
  role: "STUDENT" | "TEACHER";
};

function resizeImage(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nameWarning, setNameWarning] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setProfile(data);
          setName((data.name || "").toUpperCase());
          setAvatar(data.avatar);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImage(file, 256);
      setAvatar(base64);
    } catch {
      setMessage({ type: "err", text: "ไม่สามารถอ่านไฟล์รูปภาพได้" });
    }
  };

  // พิมพ์ตัวเล็ก -> เปลี่ยนเป็นตัวพิมพ์ใหญ่ทันที และตัดตัวอักษรที่ไม่ใช่ภาษาอังกฤษออก
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const onlyEnglish = raw.replace(/[^A-Za-z\s]/g, "");
    setNameWarning(raw !== onlyEnglish);
    setName(onlyEnglish.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const trimmedName = name.trim().toUpperCase();
    if (!/^[A-Z\s]+$/.test(trimmedName)) {
      setMessage({ type: "err", text: "กรุณากรอกชื่อภาษาอังกฤษ" });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          avatar,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "บันทึกไม่สำเร็จ" });
      } else {
        setProfile(data);
        setName(data.name.toUpperCase());
        setNewPassword("");
        setNameWarning(false);
        setMessage({ type: "ok", text: "บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว" });
        window.dispatchEvent(new Event("profile-updated"));
      }
    } catch {
      setMessage({ type: "err", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-sm text-zinc-500">
        กำลังโหลดข้อมูลโปรไฟล์...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-3">
        <p className="text-zinc-600">กรุณาเข้าสู่ระบบก่อนแก้ไขข้อมูลส่วนตัว</p>
        <Link href="/login" className="inline-block px-4 py-2 rounded-xl bg-[#700d2b] text-white text-sm font-bold">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  const initial = name.trim() ? name.trim().charAt(0).toUpperCase() : "U";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#3b076b]">
          แก้ไขข้อมูลส่วนตัว (Edit Profile)
        </h1>
        <p className="text-sm text-zinc-600 mt-0.5">
          เปลี่ยนรูปโปรไฟล์ ชื่อที่แสดงในระบบ และรหัสผ่านของคุณ
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#f3e8ff] rounded-2xl border border-[#d8b4fe] p-6 md:p-8 shadow-sm space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-5 bg-white p-5 rounded-2xl border border-[#e9d5ff]">
          {avatar ? (
            <img
              src={avatar}
              alt="Profile Avatar"
              className="h-24 w-24 rounded-full object-cover border-4 border-[#d8b4fe] shadow-sm shrink-0"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-[#700d2b] text-white flex items-center justify-center text-3xl font-extrabold leading-none border-4 border-[#d8b4fe] shadow-sm shrink-0">
              {initial}
            </div>
          )}

          <div className="space-y-2 text-center sm:text-left">
            <p className="text-sm font-bold text-[#3b076b]">รูปโปรไฟล์ (Profile Picture)</p>
            <p className="text-xs text-zinc-500">
              รูปภาพจะแสดงอยู่ด้านหลังชื่อของคุณตรงแถบเมนูด้านบน
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
              <label className="px-3.5 py-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold cursor-pointer transition">
                เลือกรูปภาพใหม่
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {avatar && (
                <button
                  type="button"
                  onClick={() => setAvatar(null)}
                  className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold transition cursor-pointer"
                >
                  ลบรูปภาพ
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#e9d5ff]">
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1">
              ชื่อผู้ใช้ / รหัสนักศึกษา (ไม่สามารถแก้ไขได้)
            </label>
            <input
              type="text"
              value={profile.username}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3b076b] mb-1">
              ชื่อ - นามสกุล (ภาษาอังกฤษเท่านั้น)
            </label>
            <input
              type="text"
              required
              pattern="^[A-Z\s]+$"
              title="กรุณากรอกชื่อ-นามสกุลเป็นภาษาอังกฤษเท่านั้น (A-Z)"
              placeholder="เช่น MUHAMMADSOFRON YAMA"
              value={name}
              onChange={handleNameChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c4b5fd] text-sm text-zinc-800 uppercase focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
            {nameWarning && (
              <p className="text-xs font-semibold text-amber-600 mt-1">
                * ระบบอนุญาตให้กรอกได้เฉพาะตัวอักษรภาษาอังกฤษเท่านั้น
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3b076b] mb-1">
              เปลี่ยนรหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
            </label>
            <input
              type="password"
              placeholder="กรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c4b5fd] text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
          </div>
        </div>

        {message && (
          <div
            className={`px-4 py-3 rounded-xl text-xs font-bold ${
              message.type === "ok"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl border border-[#c4b5fd] bg-white text-xs font-bold text-[#3b076b] hover:bg-[#f5f0ff] transition"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#700d2b] hover:bg-[#881337] text-white text-xs sm:text-sm font-bold shadow transition cursor-pointer disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </form>
    </div>
  );
}