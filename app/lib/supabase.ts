import { createClient } from '@supabase/supabase-js';

// ดึงค่ามาจากไฟล์ .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// สร้างและส่งออก (export) ตัวแปร supabase ไปให้ไฟล์อื่นใช้งาน
export const supabase = createClient(supabaseUrl, supabaseKey);