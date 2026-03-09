"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image"; // ใช้ Image Component ของ Next.js
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

// ข้อมูลจำลองของสินค้า (Mock Data)
const mockProduct = {
  name: "SoundPulse Pro หูฟังไร้สาย",
  price: "฿1,890.00",
  description: "หูฟัง TWS พร้อมระบบตัดเสียงรบกวน Active Noise Cancellation, แบตเตอรี่ใช้งานได้นาน 30 ชั่วโมง, กันน้ำระดับ IPX5 เสียงใสเบสหนัก สมบูรณ์แบบทุกจังหวะ",
  // ใช้รูปภาพตัวอย่างจาก Unsplash (หรือคุณจะเอารูปมาใส่ใน public folder ก็ได้)
  imageUrl: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?q=80&w=800&auto=format&fit=crop"
};

export default function Home() {
  // State สำหรับจัดการ Widget แชท
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [issue, setIssue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_issue: issue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการส่งข้อมูล");
      }

      // ✅ จุดที่ปรับแก้: แยกว่า AI ตอบเอง หรือ ส่งให้แอดมิน
      if (data.action === "reply") {
        setMessage({ text: `🤖 AI ตอบกลับ: ${data.reply_message}`, type: "success" });
      } else {
        setMessage({ text: `📨 ${data.reply_message || "รับเรื่องแล้ว ระบบกำลังส่งข้อมูลให้แอดมินตรวจสอบค่ะ"}`, type: "success" });
        
        // ถ้าเป็นการส่งให้แอดมิน ให้ปิดหน้าต่างแชทลงอัตโนมัติหลังผ่านไป 4 วินาที
        setTimeout(() => {
          setIsChatOpen(false);
          setMessage(null);
        }, 4000);
      }
      
      setIssue("");

    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "เกิดข้อผิดพลาด", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ใช้ Flex layout และพื้นหลังสีเทาอ่อนแบบ TrueMoney Wallet
    <main className="min-h-screen bg-gray-100 flex flex-col relative pb-20">
      
      {/* 1. ส่วนหัว (Header/Top Bar) */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* โลโก้สมมติ */}
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">S</div>
            <span className="text-xl font-bold text-gray-900">TechStore</span>
          </div>
          <Link 
            href="/dashboard" 
            className="text-sm text-gray-600 hover:text-blue-600 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-200 transition-colors"
          >
            ⚙️ แผงควบคุม Admin
          </Link>
        </nav>
      </header>

      {/* 2. ส่วนแสดงสินค้า (Main Content Area) */}
      <section className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 md:py-12">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 md:grid md:grid-cols-2 md:gap-8 p-6 md:p-8">
          
          {/* กรอบรูปสินค้า */}
          <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative border border-gray-100 mb-6 md:mb-0">
            <Image 
              src={mockProduct.imageUrl}
              alt={mockProduct.name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              priority
            />
          </div>

          {/* รายละเอียดสินค้า */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">หูฟัง TWS</span>
              <h1 className="text-3xl font-extrabold text-gray-950 leading-tight mb-2">{mockProduct.name}</h1>
              <p className="text-4xl font-bold text-red-600 mb-6">{mockProduct.price}</p>
              
              <div className="space-y-4 text-gray-700 border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900">รายละเอียดสินค้า:</h3>
                <p className="text-sm leading-relaxed">{mockProduct.description}</p>
              </div>
            </div>

            {/* ปุ่มซื้อสมมติ */}
            <div className="mt-10 pt-6 border-t border-gray-100">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-sm">
                หยิบใส่ตะกร้า
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ส่วน Floating Chat Widget (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50">
        
        {/* หน้าต่างแชท (Panel) - จะแสดงเมื่อ isChatOpen เป็น true */}
        {isChatOpen && (
          <div className="absolute bottom-16 right-0 w-[360px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 ease-out origin-bottom-right scale-100 opacity-100">
            
            {/* หัวหน้าต่างแชท (Header) */}
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold">ฝ่ายบริการลูกค้า (AI)</h3>
                <p className="text-xs text-blue-100">พร้อมช่วยตอบคำถามเกี่ยวกับสินค้าและการส่ง</p>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 hover:bg-blue-700 rounded-lg transition-colors"
                title="ปิดหน้าต่างแชท"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* ส่วนแสดงข้อความและฟอร์ม (Body) */}
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border text-sm">🤖</div>
                <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none text-sm text-gray-800 max-w-[80%]">
                  สวัสดีครับ! พบปัญหาเกี่ยวกับสินค้า สั่งซื้อ หรือการจัดส่ง สามารถแจ้งรายละเอียดทิ้งไว้ได้เลยครับ เจ้าหน้าที่จะรีบตรวจสอบให้
                </div>
              </div>

              {/* ✅ แสดงข้อความตอบกลับจากระบบตรงนี้ */}
              {message && (
                <div className={`p-3 rounded-lg text-sm leading-relaxed shadow-sm ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  className="flex-grow p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50"
                  placeholder="พิมพ์ปัญหาที่คุณพบที่นี่..."
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading || !issue.trim()}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:bg-blue-300 flex items-center justify-center shrink-0"
                  title="ส่งข้อมูล"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ปุ่มลอยเปิด/ปิดแชท (Floating Button) */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-out ${
            isChatOpen ? "bg-red-500 hover:bg-red-600 scale-90" : "bg-blue-600 hover:bg-blue-700 scale-100"
          }`}
          title={isChatOpen ? "ปิดหน้าต่างแชท" : "เปิดฝ่ายบริการลูกค้า"}
        >
          {isChatOpen ? (
            <XMarkIcon className="w-7 h-7 text-white" />
          ) : (
            <ChatBubbleLeftRightIcon className="w-7 h-7 text-white" />
          )}
        </button>
      </div>

    </main>
  );
}