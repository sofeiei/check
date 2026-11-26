"use client";

import { useState, useRef, useEffect } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type TimelineSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  buttonClassName?: string;
};

export default function TimelineSelect({
  value,
  onChange,
  options,
  buttonClassName = "bg-[#700d2b] text-white",
}: TimelineSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* ปุ่มกดเลือก (คงสีปุ่มเดิมไว้) */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold shadow-sm transition cursor-pointer ${buttonClassName}`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <svg
          className={`w-4 h-4 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* กล่องรายการตัวเลือกธีมเข้ม bg-[#1f2937] + ไฮไลต์สีส้มทอง */}
      {open && (
        <div className="absolute left-0 mt-2 min-w-full w-60 rounded-2xl border border-slate-600/80 bg-[#1f2937] shadow-2xl overflow-hidden z-50 text-sm">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left font-bold transition cursor-pointer ${
                  active
                    ? "bg-slate-700/80 text-white"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <span
                  className={`w-4 flex items-center justify-center shrink-0 ${
                    active ? "text-[#f59e0b]" : "opacity-0"
                  }`}
                >
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
                </span>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}