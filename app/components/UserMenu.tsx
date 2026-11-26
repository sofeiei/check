"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const btn =
  "cursor-pointer font-semibold px-5 py-2 rounded-full transition-all border border-[#c4b5fd] hover:scale-105 transform shadow-sm text-center text-sm";

const MENU_ITEMS = [
  {
    href: "/profile",
    label: "View Profile",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    href: "/courses",
    label: "Courses",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
      </svg>
    ),
  },
  {
    href: "/students",
    label: "Students",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
        <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
      </svg>
    ),
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
      </svg>
    ),
  }
];

export default function UserMenu() {
  const { user, isTeacher } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);

  const loadProfile = useCallback(() => {
    if (!user) return;
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setAvatar(data.avatar || null);
          setDisplayName(data.name || user.name);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.name);
      loadProfile();
    }
  }, [user, loadProfile]);

  useEffect(() => {
    window.addEventListener("profile-updated", loadProfile);
    return () => window.removeEventListener("profile-updated", loadProfile);
  }, [loadProfile]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = async () => {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className={`${btn} bg-white text-[#700d2b]`}>
          Login
        </Link>
        {/* <Link
          href="/register"
          className={`${btn} bg-[#700d2b] text-white hover:text-yellow-300`}
        >
          สมัครสมาชิก
        </Link> */}
      </div>
    );
  }

  const currentName = displayName || user.name;
  const initial = currentName ? currentName.charAt(0).toUpperCase() : "U";

  return (
    <div className="relative" ref={menuRef}>
      {/* ปุ่มชื่อ + รูปโปรไฟล์วงกลมด้านหลังชื่อ */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 px-2.5 py-1 rounded-xl transition cursor-pointer"
      >
        <span className="text-sm font-bold text-[#3b076b]">
          {currentName}
        </span>

        {avatar ? (
          <img
            src={avatar}
            alt={currentName}
            className="h-8 w-8 rounded-full object-cover border-2 border-[#700d2b] shadow-xs"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#700d2b] text-white text-xs font-extrabold leading-none shadow-xs">
            {initial}
          </span>
        )}
      </button>

      {/* กล่องเมนู Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-slate-600/80 bg-[#1f2937] shadow-2xl z-50 text-sm overflow-hidden">
          {/* <div className="px-4 py-3 border-b border-white/80 flex items-center gap-3">
            {avatar ? (
              <img
                src={avatar}
                alt={currentName}
                className="h-10 w-10 rounded-full object-cover border border-[#f59e0b] shrink-0"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f59e0b] text-white text-sm font-extrabold leading-none shrink-0">
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="font-extrabold text-[#f59e0b] truncate">
                {currentName}
              </p>
              <p className="text-xs font-semibold text-[#f59e0b] mt-0.5">
                {isTeacher ? "อาจารย์ (Teacher)" : "นักศึกษา (Student)"}
              </p>
            </div>
          </div> */}

          <div>
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 font-bold text-slate-300 hover:bg-slate-700/50 hover:text-white transition"
              >
                <span className="text-[#f59e0b]">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="border-t border-white/80">
            <button
              type="button"
              onClick={logout}
              className="w-full px-4 py-3 text-left font-extrabold text-[#f59e0b] hover:bg-slate-700/50 transition cursor-pointer"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}