import { requireUser } from "@/lib/session";

// ต้อง login ก่อนถึงจะดูแดชบอร์ดได้ (นักเรียนและอาจารย์ดูได้)
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
