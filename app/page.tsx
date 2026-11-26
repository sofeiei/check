import HeroBanner from "./components/HeroBanner";

const CREDITS = {
  projectName: "ระบบจัดการนักศึกษาและรายวิชา",
  developers: [{ name: "MUHAMMADSOFRON YAMA", role: "ผู้พัฒนาระบบ" }],
  github: "https://github.com/sofeiei",
  year: 2026,
};

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <HeroBanner />

      {/* กรอบแนวปฏิบัติการใช้งานระบบ */}
      <section className="bg-[#f3e8ff] rounded-3xl border border-[#d8b4fe] shadow-sm p-6 md:p-8 space-y-6">
        {/* ส่วนหัวกรอบ */}
        <div className="flex items-center gap-3.5 pb-5 border-b border-[#e9d5ff]">
          <span
            role="img"
            aria-label="Target"
            className="w-9 h-9 shrink-0 bg-[#f59e0b] inline-block"
            style={{
              WebkitMask: "url(/img/target.png) no-repeat center / contain",
              mask: "url(/img/target.png) no-repeat center / contain",
            }}
          />
          <div>
            <h2 className="text-base md:text-lg font-extrabold text-[#3b076b]">
              แนวปฏิบัติการใช้งานระบบจัดการข้อมูลนักศึกษาและรายวิชา
            </h2>
            <p className="text-xs md:text-sm text-zinc-600 mt-0.5">
              กรุณาเข้าสู่ระบบก่อนใช้งาน เพื่อดูรายชื่อรายวิชาและข้อมูลนักศึกษาที่คุณได้รับสิทธิ์
            </p>
          </div>
        </div>

        {/* การ์ดคำแนะนำแยก 2 ฝั่ง */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* การ์ดสำหรับอาจารย์ */}
          <div className="rounded-2xl border border-[#d8b4fe] p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span
                role="img"
                aria-label="Teacher"
                className="w-6 h-6 shrink-0 bg-[#f59e0b] inline-block"
                style={{
                  WebkitMask: "url(/img/teacher.png) no-repeat center / contain",
                  mask: "url(/img/teacher.png) no-repeat center / contain",
                }}
              />
              <h3 className="font-extrabold text-sm md:text-base text-[#7c3aed]">
                สำหรับอาจารย์ (Teacher)
              </h3>
            </div>

            <ul className="space-y-2.5 text-sm text-white font-medium">
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-[#f59e0b] shrink-0" />
                <span className="text-white">วิธีการสร้างรายวิชาใหม่ และคัดเลือกนักศึกษาเข้าเรียน</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-[#f59e0b] shrink-0" />
                <span className="text-white">การเพิ่มหัวข้อการเรียน (Sections) สั่งงาน และจัดการสมาชิกในรายวิชา</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-[#f59e0b] shrink-0" />
                <span className="text-white">ขั้นตอนการเพิ่มข้อมูลนักศึกษาใหม่เข้าสู่ฐานข้อมูลกลาง</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-[#f59e0b] shrink-0" />
                <span className="text-white">การตรวจสอบแดชบอร์ดสถิติและการกระจายเกรดเฉลี่ย (GPA)</span>
              </li>
            </ul>
          </div>

          {/* การ์ดสำหรับนักศึกษา */}
          <div className="rounded-2xl border border-[#d8b4fe] p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span
                role="img"
                aria-label="Student"
                className="w-6 h-6 shrink-0 bg-[#f59e0b] inline-block"
                style={{
                  WebkitMask: "url(/img/students.png) no-repeat center / contain",
                  mask: "url(/img/students.png) no-repeat center / contain",
                }}
              />
              <h3 className="font-extrabold text-sm md:text-base text-[#7c3aed]">
                สำหรับนักศึกษา (Student)
              </h3>
            </div>

            <ul className="space-y-2.5 text-sm text-white font-medium">
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-[#f59e0b] shrink-0" />
                <span className="text-white">ไม่พบรายวิชาที่ต้องการในระบบ (กรุณาติดต่ออาจารย์ผู้สอนเพื่อเพิ่มชื่อเข้ารายวิชา)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-[#f59e0b] shrink-0" />
                <span className="text-white">วิธีดูรายชื่อเพื่อนร่วมชั้นเรียนและตรวจสอบข้อมูลผลการเรียนของตนเอง</span>
              </li>
            </ul>
          </div>
        </div>

        {/* แถบแจ้งเตือนสิทธิ์การเข้าถึง */}
        <div className="rounded-2xl border border-[#d8b4fe] px-4 py-3.5 flex items-center gap-3">
          <span
            role="img"
            aria-label="Lock"
            className="w-6 h-6 shrink-0 bg-[#f59e0b] inline-block"
            style={{
              WebkitMask: "url(/img/lock.png) no-repeat center / contain",
              mask: "url(/img/lock.png) no-repeat center / contain",
            }}
          />
          <p className="text-xs md:text-sm text-white font-semibold">
            ระบบสงวนสิทธิ์การเข้าถึงข้อมูลเฉพาะสมาชิกภายในรายวิชาเดียวกันเท่านั้น (Access is restricted to authorized course members only)
          </p>
        </div>
      </section>

      <footer className="bg-[#f3e8ff] rounded-2xl border border-[#d8b4fe] px-6 py-4 flex flex-col items-center justify-center text-center gap-1.5 text-xs text-zinc-600">
        <div>
          {/* <span className="font-semibold text-black">{CREDITS.projectName}</span> */}
        </div>
        <div>
          {CREDITS.developers.map((d) => (
            <span key={d.name} className="font-semibold text-[#3b076b]">
              {d.name}
            </span>
          ))} ผู้พัฒนาระบบ{" "}
        </div>
        <div>
          <a
            href={CREDITS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#700d2b] hover:underline font-semibold"
          >
            GitHub
          </a>{" "}
          © {CREDITS.year}
        </div>
      </footer>
    </div>
  );
}