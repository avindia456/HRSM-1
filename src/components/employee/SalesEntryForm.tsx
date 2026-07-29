"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  employeeId: string;
  onSaved: () => void;
};

export default function SalesEntryForm({
  employeeId,
  onSaved,
}: Props) {
  const supabase = createClient();

  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [saleAmount, setSaleAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!saleAmount) {
      alert("Enter today's sale.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("sales_entries").upsert({
      employee_id: employeeId,
      sale_date: saleDate,
      sale_amount: Number(saleAmount),
      remarks,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSaleAmount("");
    setRemarks("");

    alert("Sales entry saved successfully.");

    onSaved();
  };

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold text-violet-700">
        Today's Sales Entry
      </h2>

      <div className="grid gap-4 md:grid-cols-3">
        <input
          type="date"
          value={saleDate}
          onChange={(e) => setSaleDate(e.target.value)}
          className="rounded-lg border p-3"
        />

        <input
          type="number"
          step="0.01"
          placeholder="Today's Sale"
          value={saleAmount}
          onChange={(e) => setSaleAmount(e.target.value)}
          className="rounded-lg border p-3"
        />

        <input
          type="text"
          placeholder="Remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="rounded-lg border p-3"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-5 rounded-lg bg-violet-700 px-6 py-3 text-white hover:bg-violet-800"
      >
        {loading ? "Saving..." : "Save Entry"}
      </button>
    </div>
  );
}