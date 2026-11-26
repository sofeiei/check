"use client";

import { useState } from "react";
import Link from "next/link";

const SLIDES = [
  {
    badge: "ประกาศ | ระบบจัดการรายวิชาและนักศึกษา",
    title: "จัดการรายวิชา หัวข้อการเรียน และคำสั่งงานอย่างเป็นระบบ",
    subtitle: "อาจารย์สามารถสร้างรายวิชา เพิ่มนักศึกษาเข้าเรียน และสั่งงานแยกตามสัปดาห์ได้ทันที",
    bgGradient: "from-[#3b076b] via-[#581c87] to-[#7c3aed]",
    ctaText: "ไปยังหน้ารายวิชา",
    ctaHref: "/courses",
  },
  {
    badge: "แดชบอร์ด | วิเคราะห์ผลการเรียนแบบเรียลไทม์",
    title: "ติดตามภาพรวม GPA และสถิติของนักศึกษาในรายวิชา",
    subtitle: "ดูกราฟการกระจายเกรดและข้อมูลสรุปสำคัญได้ทันทีหลังเข้าสู่ระบบ",
    bgGradient: "from-[#700d2b] via-[#881337] to-[#be123c]",
    ctaText: "ดูแดชบอร์ด",
    ctaHref: "/dashboard",
  },
  {
    badge: "ความปลอดภัย | ระบบตรวจสอบสิทธิ์ระดับฐานข้อมูล",
    title: "ข้อมูลนักศึกษาปลอดภัย เห็นได้เฉพาะผู้ที่เรียนในรายวิชาเดียวกัน",
    subtitle: "ป้องกันการเข้าถึงข้อมูลข้ามรายวิชา ทั้งสำหรับนักศึกษาและอาจารย์ท่านอื่น",
    bgGradient: "from-[#4c1d95] via-[#6d28d9] to-[#700d2b]",
    ctaText: "ดูรายชื่อนักศึกษา",
    ctaHref: "/students",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  const prevSlide = () => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  const nextSlide = () => setCurrent((prev) => (prev + 1) % SLIDES.length);

  return (
    <div className="w-full">
      {/* กล่องการ์ดสไลด์ */}
      <div className="relative w-full overflow-hidden rounded-2xl shadow-sm border border-[#d8b4fe]">
        <div
          className="flex transition-transform duration-700 ease-in-out will-change-transform"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`w-full shrink-0 bg-gradient-to-r ${slide.bgGradient} text-white px-12 py-10 md:px-16 md:py-12 min-h-[220px] flex flex-col justify-center`}
            >
              <span className="inline-block w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide mb-3 backdrop-blur-sm">
                {slide.badge}
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2 leading-snug">
                {slide.title}
              </h2>
              <p className="text-sm md:text-base text-white/90 max-w-2xl mb-5">
                {slide.subtitle}
              </p>
              <div>
                <Link
                  href={slide.ctaHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f5f0ff] px-4 py-2 text-sm font-bold text-[#700d2b] shadow hover:bg-white transition"
                >
                  {slide.ctaText}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ปุ่มเลื่อนซ้าย-ขวา (ไม่มีพื้นหลัง) */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="สไลด์ก่อนหน้า"
          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-transparent text-white/80 text-2xl hover:text-white transition cursor-pointer"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="สไลด์ถัดไป"
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-transparent text-white/80 text-2xl hover:text-white transition cursor-pointer"
        >
          ›
        </button>
      </div>

      {/* จุดบอกตำแหน่งสไลด์ด้านล่างนอกการ์ด (โปร่งใส ไม่มีพื้นหลังเลย) */}
      <div className="flex justify-center gap-2 pt-3 bg-transparent">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrent(idx)}
            aria-label={`ไปยังสไลด์ที่ ${idx + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              current === idx
                ? "w-7 bg-[#f59e0b]"
                : "w-2.5 bg-slate-400/60 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}