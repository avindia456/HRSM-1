"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function EmployeeWorkFromHomePage() {
  const supabase = createClient();
  const router = useRouter();

  const [workDate, setWorkDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first.");
      setLoading(false);
      return;
    }

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (employeeError || !employee) {
      alert("Employee record not found.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("work_from_home").insert({
      employee_id: employee.id,
      work_date: workDate,
      reason: reason,
      status: "Pending",
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("WFH request submitted successfully!");

    setWorkDate("");
    setReason("");

    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-3xl font-bold text-violet-700">
        Apply Work From Home
      </h1>

      <div className="rounded-xl bg-white p-8 shadow">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="mb-2 block font-medium">
              WFH Date
            </label>

            <input
              type="date"
              required
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Reason
            </label>

            <textarea
              required
              rows={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full rounded-lg border p-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-violet-600 px-8 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>

        </form>
      </div>
    </div>
  );
}