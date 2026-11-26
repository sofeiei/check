import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import UserMenu from "./components/UserMenu";
import MobileNavigation from "./components/MobileNavigation";
import { getSession } from "@/lib/session";

const notoSansThai = Noto_Sans_Thai({ subsets: ["thai"] });

export const metadata: Metadata = { title: "CourseHub" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  return (
    <html lang="th">
      <body className={`${notoSansThai.className} bg-[#f5f0ff] text-black flex flex-col min-h-screen`}>
        <AuthProvider user={user}>
          <ThemeProvider>
            <div className="sticky top-0 z-50 shadow-sm">
              {/* Top Bar: แฮมเบอร์เกอร์ + โลโก้ CourseHub ฝั่งซ้าย ตรงข้ามปุ่มผู้ใช้ฝั่งขวา */}
              <div className="bg-[#0f172a] text-[#f59e0b] text-sm border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <MobileNavigation />
                    <Link
                      href="/"
                      className="text-xl lg:text-2xl font-extrabold tracking-tight text-[#f59e0b] hover:opacity-90"
                    >
                      CourseHub
                    </Link>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <UserMenu />
                  </div>
                </div>
              </div>
            </div>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
              {children}
            </main>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}