import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, verifySessionToken, type SessionUser } from "./auth";

// อ่านผู้ใช้ปัจจุบันจาก cookie (ใน Next 15+ cookies() เป็น async)
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

// ใช้ในหน้า (server component / layout): ยังไม่ login -> ไปหน้า login
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

// ใช้ในหน้าที่เฉพาะอาจารย์: นักเรียนจะถูกส่งกลับไปหน้ารายชื่อ
export async function requireTeacher(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "TEACHER") redirect("/students");
  return user;
}

// ใช้ใน API route: คืน response 401/403 ถ้าไม่ผ่าน ไม่งั้นคืน user
export async function authorizeApi(
  required: "ANY" | "TEACHER"
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getSession();
  if (!user) return { response: NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 }) };
  if (required === "TEACHER" && user.role !== "TEACHER") {
    return { response: NextResponse.json({ error: "เฉพาะอาจารย์เท่านั้นที่ทำรายการนี้ได้" }, { status: 403 }) };
  }
  return { user };
}

export async function setSessionCookie(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
