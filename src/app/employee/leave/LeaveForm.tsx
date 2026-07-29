"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function LeaveForm() {
  const [loading, setLoading] = useState(false);

  const [leaveType, setLeaveType] = useState("Casual");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login.");
      setLoading(false);
      return;
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!employee) {
      alert("Employee not found.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("leaves").insert({
      employee_id: employee.id,
      leave_type: leaveType,
      from_date: fromDate,
      to_date: toDate,
      reason,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Leave applied successfully.");

    setLeaveType("Casual");
    setFromDate("");
    setToDate("");
    setReason("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-lg p-8 space-y-5"
    >
      <div>
        <label className="block mb-2 font-medium">
          Leave Type
        </label>

        <select
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value)}
          className="w-full border rounded-lg p-3"
        >
          <option>Casual</option>
          <option>Sick</option>
          <option>Earned</option>
        </select>
      </div>

      <div>
        <label className="block mb-2 font-medium">
          From Date
        </label>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-full border rounded-lg p-3"
          required
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">
          To Date
        </label>

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-full border rounded-lg p-3"
          required
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">
          Reason
        </label>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full border rounded-lg p-3"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-violet-600 py-3 text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Apply Leave"}
      </button>
    </form>
  );
}