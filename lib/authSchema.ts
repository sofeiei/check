import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(30, "ชื่อผู้ใช้ต้องไม่เกิน 30 ตัวอักษร")
    .regex(/^[a-zA-Z0-9_]+$/, "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9 และ _"),
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(100, "รหัสผ่านยาวเกินไป"),
  role: z.enum(["STUDENT", "TEACHER"]),
  teacherCode: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});
