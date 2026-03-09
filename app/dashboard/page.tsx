"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/app/lib/supabase';

// กำหนด Type ของข้อมูล Ticket
interface Ticket {
  id: number;
  user_issue: string;
  ai_category: string;
  confidence_score: number;
  final_category: string | null;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูลจาก Database
  const fetchTickets = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTickets(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchTickets();
    };
    
    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <button 
            onClick={fetchTickets}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            รีเฟรชข้อมูล
          </button>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายละเอียดปัญหา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมวดหมู่ (AI เสนอ)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ความมั่นใจ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การจัดการ (HITL)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">กำลังโหลดข้อมูล...</td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">ไม่มีรายการแจ้งปัญหา</td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <TicketRow key={ticket.id} ticket={ticket} onUpdate={fetchTickets} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

// 2. Component ย่อยสำหรับจัดการแต่ละแถว (ช่วยเรื่อง State ของ Dropdown)
function TicketRow({ ticket, onUpdate }: { ticket: Ticket; onUpdate: () => void }) {
  // ตั้งค่าเริ่มต้นให้ Dropdown เป็นค่าที่ AI เลือกมาให้
  const [selectedCategory, setSelectedCategory] = useState(ticket.ai_category);
  const [isUpdating, setIsUpdating] = useState(false);

  // เงื่อนไข Red-zone: ถ้าความมั่นใจต่ำกว่า 75% ให้ถือว่ามีความเสี่ยง 
  const isLowConfidence = ticket.confidence_score < 75;
  const isPending = ticket.status === "pending";

  const handleApprove = async () => {
    setIsUpdating(true);
    
    // อัปเดตข้อมูลลงฐานข้อมูล พร้อมเก็บเวลา routed_at สำหรับวัด KPI
    const { error } = await supabase
      .from("tickets")
      .update({
        status: "routed",
        final_category: selectedCategory,
        routed_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    if (!error) {
      onUpdate(); // รีเฟรชตารางหลังอัปเดตเสร็จ
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setIsUpdating(false);
    }
  };

  return (
    // ไฮไลท์พื้นหลังเป็นสีแดงอ่อน ถ้าเป็นเคสรอตรวจและ AI มั่นใจต่ำ 
    <tr className={isPending && isLowConfidence ? "bg-red-50" : "bg-white"}>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{ticket.id}</td>
      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={ticket.user_issue}>
        {ticket.user_issue}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          {ticket.ai_category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={`font-medium ${isLowConfidence ? "text-red-600" : "text-green-600"}`}>
          {ticket.confidence_score}%
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {isPending ? (
          <span className="text-yellow-600 font-medium">รอการตรวจสอบ</span>
        ) : (
          <span className="text-gray-500">ส่งต่อแล้ว ({ticket.final_category})</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {isPending ? (
          <div className="flex flex-col gap-2">
            {/* จุด HITL ที่ 1: แอดมินตรวจสอบและแก้ไขหมวดหมู่ได้ผ่าน Dropdown  */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-1"
            >
              <option value="Bug">Bug (บั๊ก/ระบบขัดข้อง)</option>
              <option value="Billing">Billing (การเงิน/ชำระเงิน)</option>
              <option value="General">General (สอบถามทั่วไป)</option>
            </select>
            
            {/* จุด HITL ที่ 2: แอดมินต้องเป็นคนกด Approve เสมอ  */}
            <button
              onClick={handleApprove}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors disabled:bg-blue-300"
            >
              {isUpdating ? "กำลังบันทึก..." : "ยืนยันและส่งต่อ"}
            </button>
          </div>
        ) : (
          <span className="text-green-600">✔ ดำเนินการแล้ว</span>
        )}
      </td>
    </tr>
  );
}