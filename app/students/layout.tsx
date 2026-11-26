import { requireUser } from "@/lib/session";

// ต้อง login ก่อนถึงจะดูรายชื่อได้ (นักเรียนและอาจารย์ดูได้)
export default async function StudentsLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
