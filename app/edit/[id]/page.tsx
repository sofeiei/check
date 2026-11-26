"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

const YEAR_LIST = Array.from({ length: 12 }, (_, i) => `ชั้นปีที่ ${i + 1}`);

function resolveInitialYear(studentId: string, savedYear?: string | null): string {
  if (savedYear) {
    const parsed = Number(String(savedYear).replace(/\D/g, ""));
    if (parsed >= 1 && parsed <= 12) return `ชั้นปีที่ ${parsed}`;
  }
  if (/^\d{2}/.test(studentId)) {
    const enrollYear = Number(studentId.slice(0, 2));
    const currentThaiYear = 69; // พ.ศ. 2569
    const yearNum = currentThaiYear - enrollYear + 1;
    if (yearNum >= 1 && yearNum <= 12) {
      return `ชั้นปีที่ ${yearNum}`;
    }
  }
  return "ชั้นปีที่ 1";
}

export default function EditStudent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [formData, setFormData] = useState({
    studentId: "",
    name: "",
    year: "ชั้นปีที่ 1",
    faculty: "",
    major: "",
    image: "",
  });
  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData((prev) => ({ ...prev, image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/students/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          const parts = (data.facultyMajor || "").split(/\s*-\s*/);
          const facultyVal = parts[0] || "";
          const majorVal = parts.slice(1).join(" - ") || "";
          const initialYear = resolveInitialYear(data.studentId || "", data.year);

          setFormData({
            studentId: data.studentId || "",
            name: data.name || "",
            year: initialYear,
            faculty: facultyVal,
            major: majorVal,
            image: data.image || "",
          });
          setImagePreview(data.image || null);
        }
        setIsFetching(false);
      })
      .catch(() => setIsFetching(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนักศึกษาคนนี้?")) return;

    setError("");
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push("/students");
        router.refresh();
      } else {
        setError(data.error || "ลบข้อมูลไม่สำเร็จ");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{3,15}$/.test(formData.studentId)) {
      setError("กรุณากรอกรหัสนักศึกษาเป็นตัวเลขเท่านั้น");
      return;
    }

    const cleanedName = formData.name.trim().replace(/\s+/g, " ").toUpperCase();
    if (!/^[A-Z]+( [A-Z]+)*$/.test(cleanedName)) {
      setError("กรุณากรอกชื่อ-นามสกุลเป็นภาษาอังกฤษเท่านั้น");
      return;
    }

    const combinedFacultyMajor = [formData.faculty.trim(), formData.major.trim()]
      .filter(Boolean)
      .join(" - ");

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: formData.studentId,
          name: cleanedName,
          year: formData.year,
          facultyMajor: combinedFacultyMajor,
          image: formData.image || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/students");
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

  if (isFetching) {
    return (
      <div className="text-center mt-20 font-bold text-[#f59e0b] animate-pulse">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-[#151c2c] p-8 rounded-3xl shadow-xl border border-[#2a3447] mt-10 relative">
      <h2 className="text-3xl font-extrabold text-white mb-6 text-center">แก้ไขข้อมูล</h2>

      {error && (
        <div className="bg-red-500/15 text-red-300 p-4 rounded-2xl mb-6 text-sm font-bold text-center border border-red-500/30">
          - {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* รูปโปรไฟล์ด้านบนรหัสนักศึกษา */}
        <div className="flex flex-col items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="กดเพื่อเปลี่ยนรูปโปรไฟล์"
            className="group relative w-36 h-44 rounded-2xl overflow-hidden bg-[#263042] border border-[#3a465c]/80 hover:border-[#f59e0b] shadow-lg transition-all cursor-pointer flex items-center justify-center"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt={formData.name || "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#f59e0b] transition-colors px-3">
                <span className="text-5xl font-extrabold text-[#f59e0b] mb-1">
                  {formData.name ? formData.name.charAt(0) : "?"}
                </span>
                <span className="text-xs font-bold">เลือกรูปโปรไฟล์</span>
              </div>
            )}

            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs font-bold text-white bg-[#0f172a]/85 px-3 py-1 rounded-lg border border-[#f59e0b]/60">
                เปลี่ยนรูป
              </span>
            </div>

            <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#f59e0b] text-[#0f172a] flex items-center justify-center shadow-md">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </button>

          <span className="text-xs text-slate-400 mt-2">
            กดที่รูปเพื่ออัปโหลดรูปภาพ
          </span>
        </div>

        <div>
          <label className="text-sm font-bold text-white ml-1">รหัสนักศึกษา</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={15}
            className={inputCls}
            value={formData.studentId}
            onChange={(e) =>
              setFormData({ ...formData, studentId: e.target.value.replace(/\D/g, "") })
            }
          />
        </div>

        <div>
          <label className="text-sm font-bold text-white ml-1">ชื่อ-นามสกุล (ภาษาอังกฤษ)</label>
          <input
            type="text"
            className={`${inputCls} uppercase`}
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value.replace(/[^a-zA-Z\s]/g, "").toUpperCase(),
              })
            }
          />
        </div>

        {/* ชั้นปี, คณะ, สาขา เรียง 3 ช่องเท่ากันในแถวเดียว */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* ช่องที่ 1: ชั้นปี */}
          <div ref={yearDropdownRef} className="relative min-w-0">
            <label className="block text-sm font-bold text-white ml-1">ชั้นปี</label>
            <button
              type="button"
              onClick={() => setIsYearOpen((prev) => !prev)}
              className={`w-full h-[52px] px-3 bg-[#263042] text-white rounded-2xl mt-1.5 border transition-all flex items-center justify-between gap-1 cursor-pointer ${
                isYearOpen
                  ? "border-[#f59e0b] ring-2 ring-[#f59e0b]"
                  : "border-[#3a465c] hover:border-slate-500"
              }`}
            >
              <span className="font-bold text-[#f59e0b] text-xs sm:text-sm truncate">
                {formData.year}
              </span>
              <svg
                className={`w-4 h-4 text-slate-300 shrink-0 transition-transform duration-200 ${
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
              <div className="absolute left-0 w-44 mt-2 max-h-56 overflow-y-auto bg-[#1e2638] border border-[#3a465c] rounded-2xl shadow-2xl divide-y divide-[#2a3447] z-30">
                {YEAR_LIST.map((yr) => {
                  const isSelected = formData.year === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, year: yr });
                        setIsYearOpen(false);
                      }}
                      className={`w-full px-3.5 py-3 text-left text-sm font-bold flex items-center gap-2.5 transition cursor-pointer ${
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

          {/* ช่องที่ 2: คณะ */}
          <div className="min-w-0">
            <label className="block text-sm font-bold text-white ml-1">คณะ</label>
            <input
              type="text"
              placeholder="Ex. CoC"
              className="w-full h-[52px] px-3 bg-[#263042] text-white placeholder-[#7f8999] rounded-2xl mt-1.5 outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-[#f59e0b] transition-all border border-[#3a465c] text-xs sm:text-sm"
              value={formData.faculty}
              onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
            />
          </div>

          {/* ช่องที่ 3: สาขา */}
          <div className="min-w-0">
            <label className="block text-sm font-bold text-white ml-1">สาขา</label>
            <input
              type="text"
              placeholder="Ex. AISE"
              className="w-full h-[52px] px-3 bg-[#263042] text-white placeholder-[#7f8999] rounded-2xl mt-1.5 outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-[#f59e0b] transition-all border border-[#3a465c] text-xs sm:text-sm"
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <button
            type="button"
            onClick={() => router.push("/students")}
            disabled={isLoading || isDeleting}
            className="bg-[#263042] text-slate-200 font-bold py-4 rounded-2xl hover:bg-[#334155] transition-all border border-[#3a465c] disabled:opacity-60 cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading || isDeleting}
            className="bg-red-500/15 hover:bg-red-500 text-red-300 hover:text-white font-bold py-4 rounded-2xl border border-red-500/30 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isDeleting ? "กำลังลบ..." : "ลบ"}
          </button>

          <button
            type="submit"
            disabled={isLoading || isDeleting}
            className="bg-[#f59e0b] text-[#0f172a] font-extrabold py-4 rounded-2xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? "กำลังบันทึก..." : "อัปเดต"}
          </button>
        </div>
      </form>
    </div>
  );
}