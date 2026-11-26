"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

function getYearLevel(studentId: string, savedYear?: string | number | null) {
  if (savedYear) return String(savedYear).trim();
  if (/^\d{2}/.test(studentId)) {
    const enrollYear = Number(studentId.slice(0, 2));
    const currentThaiYear = 69; // พ.ศ. 2569
    const year = currentThaiYear - enrollYear + 1;
    if (year >= 1 && year <= 10) return `ชั้นปีที่ ${year}`;
  }
  return "-";
}

const SORT_OPTIONS = [
  { value: "STUDENT_ID", label: "เรียงตามรหัส" },
  { value: "NAME", label: "เรียงตามชื่อ" },
];

export default function StudentList() {
  const { isTeacher } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("STUDENT_ID");

  const [openDropdown, setOpenDropdown] = useState<"YEAR" | "SORT" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        setStudents(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const enrichedStudents = students.map((std) => ({
    ...std,
    resolvedYear: getYearLevel(std.studentId, std.year || std.classYear),
    resolvedFacultyMajor:
      [std.faculty, std.major || std.department].filter(Boolean).join(" - ") ||
      std.facultyMajor ||
      "",
  }));

  // สร้างรายการชั้นปีใน Dropdown อัตโนมัติตามข้อมูลจริงของนักศึกษา (อย่างน้อยมี ปี 1-4 และเพิ่มตามปีสูงสุดที่มีจริง)
  const yearFilterOptions = (() => {
    const yearSet = new Set<string>(["ชั้นปีที่ 1", "ชั้นปีที่ 2", "ชั้นปีที่ 3", "ชั้นปีที่ 4"]);
    let hasUnknown = false;

    for (const std of enrichedStudents) {
      if (std.resolvedYear && std.resolvedYear !== "-") {
        yearSet.add(std.resolvedYear);
      } else {
        hasUnknown = true;
      }
    }

    const sortedYears = Array.from(yearSet).sort((a, b) => {
      const numA = Number(a.replace(/\D/g, "")) || 999;
      const numB = Number(b.replace(/\D/g, "")) || 999;
      return numA - numB;
    });

    const options = [
      { value: "ALL", label: "ทั้งหมด" },
      ...sortedYears.map((yr) => ({ value: yr, label: yr })),
    ];

    if (hasUnknown) {
      options.push({ value: "-", label: "ไม่ระบุชั้นปี" });
    }

    return options;
  })();

  const filteredStudents = enrichedStudents
    .filter((std) => {
      const matchesYear = yearFilter === "ALL" || std.resolvedYear === yearFilter;
      const keyword = searchTerm.toLowerCase();
      const matchesSearch =
        std.name.toLowerCase().includes(keyword) ||
        std.studentId.includes(searchTerm) ||
        std.resolvedYear.toLowerCase().includes(keyword) ||
        std.resolvedFacultyMajor.toLowerCase().includes(keyword);
      return matchesYear && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "NAME") {
        return a.name.localeCompare(b.name);
      }
      return a.studentId.localeCompare(b.studentId);
    });

  const currentYearLabel =
    yearFilterOptions.find((opt) => opt.value === yearFilter)?.label || "ทั้งหมด";
  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || "เรียงตามรหัส";

  if (isLoading) {
    return (
      <div className="text-center mt-20 text-[#f59e0b] font-bold animate-pulse">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#f59e0b]">Students</h1>
        <p className="text-slate-300 text-sm mt-1">
          รวมรายชื่อนักศึกษาทั้งหมด
        </p>

      </div>

      <div className="bg-[#151c2c] rounded-3xl border border-[#2a3447] shadow-xl">
        <div className="p-5 sm:p-6 border-b border-[#2a3447] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#f59e0b]">รายชื่อนักศึกษา</h2>
              <span className="px-4 py-1.5 rounded-full text-xs font-extrabold text-[#f59e0b]">
                ทั้งหมด {enrichedStudents.length} คน
              </span>
          </div>

          <div ref={dropdownRef} className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === "YEAR" ? null : "YEAR")
                }
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#f59e0b] text-white font-extrabold text-sm shadow-md hover:opacity-95 transition cursor-pointer"
              >
                <span>{currentYearLabel}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${openDropdown === "YEAR" ? "rotate-180" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openDropdown === "YEAR" && (
                <div className="absolute left-0 mt-2 w-52 bg-[#1e2638] border border-[#3a465c] rounded-2xl shadow-2xl overflow-hidden z-30">
                  {yearFilterOptions.map((opt) => {
                    const isSelected = yearFilter === opt.value;
                    const count =
                      opt.value === "ALL"
                        ? enrichedStudents.length
                        : enrichedStudents.filter((s) => s.resolvedYear === opt.value).length;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setYearFilter(opt.value);
                          setOpenDropdown(null);
                        }}
                        className={`w-full px-4 py-3.5 text-left text-sm font-bold flex items-center justify-between transition cursor-pointer ${isSelected
                            ? "bg-[#2a3447] text-white"
                            : "text-slate-200 hover:bg-[#263042]"
                          }`}
                      >
                        <div className="flex items-center gap-3">
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
                          <span>{opt.label}</span>
                        </div>
                        <span className="text-xs text-slate-400">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === "SORT" ? null : "SORT")
                }
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#7c3aed] text-white font-extrabold text-sm shadow-md hover:opacity-95 transition cursor-pointer"
              >
                <span>{currentSortLabel}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${openDropdown === "SORT" ? "rotate-180" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openDropdown === "SORT" && (
                <div className="absolute left-0 mt-2 w-48 bg-[#1e2638] border border-[#3a465c] rounded-2xl shadow-2xl overflow-hidden z-30">
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = sortBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.value);
                          setOpenDropdown(null);
                        }}
                        className={`w-full px-4 py-3.5 text-left text-sm font-bold flex items-center gap-3 transition cursor-pointer ${isSelected
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
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <input
            type="text"
            placeholder="ค้นหานักศึกษา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3.5 bg-[#263042] text-white placeholder-[#7f8999] rounded-2xl outline-none focus:ring-2 focus:ring-[#f59e0b] transition-all border border-[#3a465c] text-sm"
          />
        </div>

        {filteredStudents.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <p className="text-slate-400 text-sm font-medium">
              ไม่พบรายชื่อนักศึกษาที่ตรงกับเงื่อนไข
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#2a3447]">
            {filteredStudents.map((std, index) => (
              <div
                key={std.id}
                className="p-4 sm:px-6 sm:py-4 flex items-center justify-between gap-3 hover:bg-[#1e293b]/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className="hidden sm:inline-block w-6 text-xs font-bold text-slate-500">
                    {index + 1}.
                  </span>

                  {std.image ? (
                    <img
                      src={std.image}
                      alt={std.name}
                      className="w-10 h-10 object-cover rounded-full border border-[#f59e0b] shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-[#263042] border border-[#3a465c] rounded-full flex items-center justify-center text-[#f59e0b] font-extrabold shrink-0">
                      {std.name.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-extrabold text-white text-sm sm:text-base truncate">
                      {std.name}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <p className="text-xs font-bold text-[#f59e0b]">
                        {std.studentId}
                      </p>
                      {std.resolvedFacultyMajor && (
                        <span className="text-xs font-medium text-slate-400 truncate">
                          • {std.resolvedFacultyMajor}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#263042] text-slate-200 border border-[#3a465c] whitespace-nowrap">
                    {std.resolvedYear}
                  </span>

                  {isTeacher && (
                    <Link
                      href={`/edit/${std.id}`}
                      className="px-3 py-1 rounded-xl bg-[#263042] hover:bg-[#f59e0b] hover:text-[#0f172a] text-slate-200 font-bold text-xs border border-[#3a465c] transition whitespace-nowrap"
                    >
                      แก้ไข
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}