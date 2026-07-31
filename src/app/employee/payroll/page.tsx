"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Payroll = {
  id: string;
  month: string;
  year: number;
  status: string;
  payslip_url: string | null;
};

export default function EmployeePayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayroll();
  }, []);

async function fetchPayroll() {
  setLoading(true);

  const {
    data: { user },
  } = await supabase.auth.getUser();
console.log("USER:", user);
  if (!user) {
    setLoading(false);
    return;
  }

  // Auth user se employee record nikalo
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id")
    .eq("auth_id", user.id)
    .single();
    console.log("EMPLOYEE:", employee);
console.log("EMPLOYEE ERROR:", empError);

  if (empError || !employee) {
    console.error("Employee not found", empError);
    setLoading(false);
    return;
  }

  // Employee ke payroll fetch karo
  const { data, error } = await supabase
    .from("payroll")
    .select("*")
    .eq("employee_id", employee.id)
    .order("year", { ascending: false });
console.log("PAYROLL:", data);
console.log("PAYROLL ERROR:", error);
  if (!error && data) {
    setPayrolls(data);
  }

  setLoading(false);
}
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        My Payroll
      </h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">Month</th>
              <th className="text-left p-4">Year</th>
              <th className="text-left p-4">Status</th>
              <th className="text-center p-4">Payslip</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center">
                  No payroll found
                </td>
              </tr>
            ) : (
              payrolls.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-4">{item.month}</td>
                  <td className="p-4">{item.year}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        item.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="text-center p-4">
                    {item.payslip_url ? (
                      <a
                        href={item.payslip_url}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        View PDF
                      </a>
                    ) : (
                      <span className="text-red-500">
                        No PDF
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}