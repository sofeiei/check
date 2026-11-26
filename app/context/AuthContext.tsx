"use client";
import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/auth";

// ค่า user มาจาก server (root layout) ทุกครั้งที่ render จึงไม่เก็บเป็น state เอง
const AuthContext = createContext<SessionUser | null>(null);

export function AuthProvider({ user, children }: { user: SessionUser | null; children: React.ReactNode }) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const user = useContext(AuthContext);
  return { user, isTeacher: user?.role === "TEACHER" };
}
