import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/app/lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const storePolicy = `
[ข้อมูลและนโยบายร้านค้า TechStore]
- การจัดส่ง: ตัดรอบส่ง 14.00 น. จัดส่งผ่าน J&T และ Kerry ใช้เวลา 2-3 วันทำการ
- นโยบายคืนเงิน/เคลม: ลูกค้าสามารถเคลมสินค้าได้ภายใน 7 วันหลังจากได้รับสินค้า โดยต้องมี "วิดีโอขณะแกะกล่อง" ประกอบการเคลม และจะได้รับเงินคืนภายใน 3-5 วันทำการ
- การรับประกัน: สินค้าประเภทหูฟังและอุปกรณ์อิเล็กทรอนิกส์รับประกัน 1 ปี
- เวลาทำการแอดมิน: จันทร์-เสาร์ เวลา 09:00 - 18:00 น.
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_issue } = body;

    if (!user_issue) {
      return NextResponse.json({ error: 'กรุณาระบุปัญหาที่ต้องการแจ้ง' }, { status: 400 });
    }

    // ปรับ Prompt ให้สั้นและชัดเจนขึ้น แยกขาวดำชัดเจน
    const prompt = `
      จงวิเคราะห์ข้อความจากลูกค้า: "${user_issue}"
      
      ข้อมูลนโยบายร้านค้า:
      ${storePolicy}
      
      กฎการตัดสินใจ (สำคัญมาก):
      1. ถ้าลูกค้า "ถามข้อมูลทั่วไป" ที่มีคำตอบในนโยบายร้านค้า (เช่น ถามว่ากี่วันถึง, ตัดรอบกี่โมง, เคลมยังไง, ประกันกี่ปี) 
         -> ให้กำหนด "action": "reply" และ "reply_text": "สร้างคำตอบที่สุภาพสรุปจากนโยบาย"
      2. ถ้าลูกค้า "แจ้งปัญหาเฉพาะบุคคล" (เช่น ของพังขอเคลม, ตามพัสดุว่าถึงไหน, โอนเงินไม่เข้า) หรือเป็นเรื่องที่ไม่อยู่ในนโยบาย 
         -> ให้กำหนด "action": "route" และ "reply_text": "รับเรื่องแล้ว ระบบกำลังส่งข้อมูลให้แอดมินตรวจสอบค่ะ"
      
      โครงสร้าง JSON ที่ต้องการ:
      {
        "action": "ต้องเป็นคำว่า reply หรือ route เท่านั้น",
        "reply_text": "ข้อความที่จะตอบลูกค้า",
        "ai_category": "เลือก 1 คำจาก: Shipping, Refund, Payment, Product",
        "confidence_score": ตัวเลข 0-100
      }
    `;

    // 🌟 ไม้ตาย: บังคับให้ Gemini ตอบเป็น JSON โครงสร้างเป๊ะๆ
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(prompt);
    // ไม่ต้อง replace ตัด ```json ออกแล้ว เพราะ API จะคืนค่าเป็น JSON เพียวๆ
    const responseText = result.response.text();
    const aiData = JSON.parse(responseText);

    const ticketStatus = aiData.action === 'reply' ? 'auto_answered' : 'pending';

    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          user_issue: user_issue,
          ai_category: aiData.ai_category,
          confidence_score: aiData.confidence_score,
          status: ticketStatus, 
          final_category: aiData.action === 'reply' ? aiData.ai_category : null
        }
      ])
      .select();

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw new Error('ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้');
    }

    return NextResponse.json({ 
      success: true, 
      action: aiData.action,
      reply_message: aiData.reply_text,
      data: data 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการประมวลผล' }, { status: 500 });
  }
}