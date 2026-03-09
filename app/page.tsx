"use client";

import { useState } from "react";

export default function Home() {
  const [issue, setIssue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // เรียกใช้งาน API ที่เราสร้างไว้ในขั้นตอนก่อนหน้า
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

      // แสดงข้อความสำเร็จและล้างฟอร์ม
      setMessage({ text: "ส่งข้อมูลแจ้งปัญหาเรียบร้อยแล้ว! ระบบกำลังดำเนินการ", type: "success" });
      setIssue("");
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ", type: "error" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">SmartRoute</h1>
          <p className="text-sm text-gray-500 mt-2">ระบบแจ้งปัญหาและคัดกรองด้วย AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-1">
              รายละเอียดปัญหาที่คุณพบ
            </label>
            <textarea
              id="issue"
              rows={5}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
              placeholder="เช่น เข้าสู่ระบบไม่ได้, จ่ายเงินแล้วยอดไม่ขึ้น..."
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !issue.trim()}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
              isLoading || !issue.trim()
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {isLoading ? "กำลังประมวลผลด้วย AI..." : "ส่งข้อมูลแจ้งปัญหา"}
          </button>
        </form>

        {/* แสดงข้อความแจ้งเตือนเมื่อส่งสำเร็จหรือเกิดข้อผิดพลาด */}
        {message && (
          <div
            className={`mt-4 p-4 rounded-lg text-sm ${
              message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </main>
  );
}