import { requireTeacher } from "@/lib/session";

// เฉพาะอาจารย์เท่านั้น
export default async function EditLayout({ children }: { children: React.ReactNode }) {
  await requireTeacher();
  return <>{children}</>;
}
