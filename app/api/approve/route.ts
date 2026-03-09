import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function PATCH(request: Request) {
  try {
    // รับข้อมูลจากหน้า Dashboard (Frontend)
    const body = await request.json();
    const { ticket_id, final_category } = body;

    // ตรวจสอบว่าส่งข้อมูลมาครบหรือไม่
    if (!ticket_id || !final_category) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน (ต้องการ ticket_id และ final_category)' }, 
        { status: 400 }
      );
    }

    // อัปเดตข้อมูลลงฐานข้อมูล พร้อมเก็บเวลา routed_at
    const { data, error } = await supabase
      .from("tickets")
      .update({
        status: "routed",
        final_category: final_category,
        routed_at: new Date().toISOString(),
      })
      .eq("id", ticket_id)
      .select();

    if (error) {
      console.error('Supabase Update Error:', error);
      throw new Error('ไม่สามารถอัปเดตข้อมูลได้');
    }

    // ส่งผลลัพธ์กลับไปให้ Frontend
    return NextResponse.json({ 
      success: true, 
      message: 'อัปเดตสถานะและหมวดหมู่สำเร็จ',
      data: data 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการประมวลผล' }, 
      { status: 500 }
    );
  }
}