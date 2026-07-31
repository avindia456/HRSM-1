"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Employee = {
  id: string;
  full_name: string;
};

type Payroll = {
  id: string;
  employee_id: string;
  month: string;
  year: number;
  status: string;
  payslip_url: string | null;
  employees?: {
    full_name: string;
  };
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function PayrollPage() {
  const [loading, setLoading] = useState(true);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);

  const [showModal, setShowModal] = useState(false);

  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState("Paid");

  const [pdfFile, setPdfFile] = useState<File | null>(null);

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
  }, []);

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from("employees")
      .select("id, full_name")
      .order("full_name");

    if (!error && data) {
      setEmployees(data);
    }
  }

  async function fetchPayrolls() {
    setLoading(true);

    const { data, error } = await supabase
      .from("payroll")
      .select(`
        *,
        employees (
          full_name
        )
      `)
      .order("year", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setPayrolls(data as Payroll[]);
    }

    setLoading(false);
  }

 async function uploadPDF() {
  if (!pdfFile) return null;

  const fileName = `${Date.now()}-${pdfFile.name}`;

  const { error } = await supabase.storage
    .from("payroll")
    .upload(fileName, pdfFile);

  console.log("UPLOAD ERROR:", error);

  if (error) {
    console.error(error);
    alert(JSON.stringify(error, null, 2));
    return null;
  }

  const { data } = supabase.storage
    .from("payroll")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

  async function savePayroll() {
    if (!employeeId) {
      alert("Please select an employee.");
      return;
    }

    let pdfUrl: string | null = null;

    if (pdfFile) {
      pdfUrl = await uploadPDF();

      if (!pdfUrl) return;
    }

    const { error } = await supabase
      .from("payroll")
      .insert({
        employee_id: employeeId,
        month,
        year,
        status,
        payslip_url: pdfUrl,
      });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("Payroll added successfully.");

    setEmployeeId("");
    setMonth(months[new Date().getMonth()]);
    setYear(new Date().getFullYear());
    setStatus("Paid");
    setPdfFile(null);
    setShowModal(false);

    fetchPayrolls();
  }

  function viewPDF(url: string) {
    window.open(url, "_blank");
  }

  async function deletePayroll(id: string) {
    const ok = confirm("Delete this payroll?");

    if (!ok) return;

    const { error } = await supabase
      .from("payroll")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchPayrolls();
  }

  return (
        <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Payroll
        </h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
        >
          + Add Payroll
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">
                Employee
              </th>

              <th className="text-left p-4">
                Month
              </th>

              <th className="text-left p-4">
                Year
              </th>

              <th className="text-left p-4">
                Status
              </th>

              <th className="text-center p-4">
                PDF
              </th>

              <th className="text-center p-4">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center p-8"
                >
                  Loading...
                </td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center p-8 text-gray-500"
                >
                  No payroll found
                </td>
              </tr>
            ) : (
              payrolls.map((item) => (
                <tr
                  key={item.id}
                  className="border-t"
                >
                  <td className="p-4">
                    {item.employees?.full_name}
                  </td>

                  <td className="p-4">
                    {item.month}
                  </td>

                  <td className="p-4">
                    {item.year}
                  </td>

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
                      <button
                        onClick={() =>
                          viewPDF(item.payslip_url!)
                        }
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-red-500">
                        No PDF
                      </span>
                    )}
                  </td>

                  <td className="text-center p-4">
                    <button
                      onClick={() =>
                        deletePayroll(item.id)
                      }
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h2 className="text-2xl font-semibold mb-5">
              Add Payroll
            </h2>

            <div className="space-y-4">
                              <div>
                <label className="block mb-1 font-medium">
                  Employee
                </label>

                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">
                    Select Employee
                  </option>

                  {employees.map((emp) => (
                    <option
                      key={emp.id}
                      value={emp.id}
                    >
                      {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Month
                </label>

                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {months.map((m) => (
                    <option
                      key={m}
                      value={m}
                    >
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Year
                </label>

                <input
                  type="number"
                  value={year}
                  onChange={(e) =>
                    setYear(Number(e.target.value))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="Paid">
                    Paid
                  </option>

                  <option value="Pending">
                    Pending
                  </option>
                </select>
              </div>

              <div>
  <label className="block mb-2 font-medium">
    Upload PDF
  </label>

  <input
    type="file"
    accept=".pdf"
    onChange={(e) => {
      console.log(e.target.files);
      setPdfFile(e.target.files?.[0] ?? null);
    }}
    style={{
      display: "block",
      width: "100%",
      border: "1px solid #ccc",
      padding: "10px",
      cursor: "pointer",
    }}
  />
</div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="border px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={savePayroll}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}