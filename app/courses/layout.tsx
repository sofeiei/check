import { requireUser } from "@/lib/session";

export default async function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return <>{children}</>;
}