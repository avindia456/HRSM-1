"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Employee = {
  id: string;
};

export default function AddSalesPage() {
  const supabase = createClient();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEmployee();
  }, []);

  async function loadEmployee() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("employees")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (data) {
      setEmployee(data);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!employee) return;

    if (!amount || Number(amount) <= 0) {
      alert("Enter valid amount");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("sales_entries")
      .insert({
        employee_id: employee.id,
        sale_amount: Number(amount),
        sale_date: new Date().toISOString().split("T")[0],
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Sales Added Successfully");

    setAmount("");
  }

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold text-violet-700">
        Add Sales
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow p-6 max-w-lg"
      >

        <label className="block mb-2 font-semibold">
          Completed Amount
        </label>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter Amount"
          className="w-full border rounded-lg p-3 mb-5"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-violet-700 text-white px-6 py-3 rounded-lg hover:bg-violet-800"
        >
          {loading ? "Saving..." : "Submit"}
        </button>

      </form>

    </div>
  );
}