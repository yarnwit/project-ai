import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/app/lib/supabase';

// 2. ตั้งค่าการเชื่อมต่อ Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    // รับข้อมูลจากหน้า Frontend
    const body = await request.json();
    const { user_issue } = body;

    if (!user_issue) {
      return NextResponse.json({ error: 'กรุณาระบุปัญหาที่ต้องการแจ้ง' }, { status: 400 });
    }

    // 3. กำหนด Guardrail ให้ AI (บังคับรูปแบบและหมวดหมู่)
    const prompt = `
      คุณคือผู้ช่วย AI สำหรับคัดกรอง Ticket แจ้งปัญหาของระบบ
      จงอ่านข้อความปัญหาด้านล่างนี้ และวิเคราะห์ว่าควรจัดอยู่ในหมวดหมู่ใด
      
      กฎข้อบังคับ (Guardrails):
      1. คุณต้องตอบกลับมาเป็นรูปแบบ JSON เท่านั้น ห้ามพิมพ์ข้อความอธิบายใดๆ ทั้งสิ้น
      2. Key ใน JSON ต้องมีแค่ 2 ตัวคือ "ai_category" และ "confidence_score"
      3. ค่าของ "ai_category" บังคับให้เลือกจาก 3 คำนี้เท่านั้น: "Bug", "Billing", "General" ห้ามสร้างหมวดหมู่ใหม่เด็ดขาด
      4. ค่าของ "confidence_score" ต้องเป็นตัวเลขจำนวนเต็มตั้งแต่ 0 ถึง 100
      
      ข้อความปัญหา: "${user_issue}"
    `;

    // 4. เรียกใช้งาน Gemini AI (ใช้โมเดล flash เพราะทำงานได้รวดเร็ว)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 5. ทำความสะอาดข้อความและแปลงเป็น JSON Object
    // (ลบ ```json และ ``` ที่ AI อาจจะติดมาด้วยออกไป)
    const cleanJsonText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(cleanJsonText);

    // 6. บันทึกข้อมูลลงฐานข้อมูล (Relational Data) ใน Supabase
    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          user_issue: user_issue,
          ai_category: aiData.ai_category,
          confidence_score: aiData.confidence_score,
          status: 'pending' // สถานะเริ่มต้น รอแอดมินมา Approve (HITL)
        }
      ])
      .select();

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw new Error('ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้');
    }

    // 7. ส่งผลลัพธ์กลับไปให้ Frontend
    return NextResponse.json({ 
      success: true, 
      message: 'บันทึก Ticket และวิเคราะห์ AI สำเร็จ',
      data: data 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการประมวลผล' }, { status: 500 });
  }
}