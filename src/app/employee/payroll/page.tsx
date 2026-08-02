"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Employee = {
  id: string;
  full_name: string;
  email: string;
};

type Payroll = {
  id: string;
  employee_id: string;
  month: string;
  year: number;
  status: string;
  payslip_url: string | null;
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

export default function EmployeePayrollPage() {
  const [loading, setLoading] = useState(true);

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [payrolls, setPayrolls] =
    useState<Payroll[]>([]);

  const [yearFilter, setYearFilter] =
    useState("All");

  useEffect(() => {
    loadPayroll();
  }, []);

  async function loadPayroll() {
    setLoading(true);

    try {
      // 1. GET LOGGED-IN USER
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Auth Error:",
          userError
        );

        setLoading(false);
        return;
      }

      if (!user) {
        console.error(
          "No logged-in user found."
        );

        setLoading(false);
        return;
      }

      if (!user.email) {
        console.error(
          "Logged-in user has no email."
        );

        setLoading(false);
        return;
      }

      // 2. FIND EMPLOYEE USING LOGIN EMAIL
      const {
        data: employeeData,
        error: employeeError,
      } = await supabase
        .from("employees")
        .select(
          "id, full_name, email"
        )
        .eq("email", user.email)
        .maybeSingle();

      if (employeeError) {
        console.error(
          "Employee Error:",
          employeeError
        );

        setLoading(false);
        return;
      }

      if (!employeeData) {
        console.error(
          "Employee profile not found for:",
          user.email
        );

        setLoading(false);
        return;
      }

      setEmployee(employeeData);

      // 3. LOAD ONLY THIS EMPLOYEE'S PAYROLL
      const {
        data: payrollData,
        error: payrollError,
      } = await supabase
        .from("payroll")
        .select(
          "id, employee_id, month, year, status, payslip_url"
        )
        .eq(
          "employee_id",
          employeeData.id
        )
        .order("year", {
          ascending: false,
        });

      if (payrollError) {
        console.error(
          "Payroll Error:",
          payrollError
        );

        setLoading(false);
        return;
      }

      const sortedPayrolls = (
        (payrollData || []) as Payroll[]
      ).sort((a, b) => {
        if (b.year !== a.year) {
          return b.year - a.year;
        }

        return (
          months.indexOf(b.month) -
          months.indexOf(a.month)
        );
      });

      setPayrolls(sortedPayrolls);
    } catch (error) {
      console.error(
        "Payroll Load Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  const availableYears = useMemo(() => {
    return [
      ...new Set(
        payrolls.map(
          (payroll) => payroll.year
        )
      ),
    ].sort((a, b) => b - a);
  }, [payrolls]);

  const filteredPayrolls =
    useMemo(() => {
      if (yearFilter === "All") {
        return payrolls;
      }

      return payrolls.filter(
        (payroll) =>
          payroll.year ===
          Number(yearFilter)
      );
    }, [payrolls, yearFilter]);

  const paidCount = useMemo(() => {
    return payrolls.filter(
      (payroll) =>
        payroll.status === "Paid"
    ).length;
  }, [payrolls]);

  const pendingCount = useMemo(() => {
    return payrolls.filter(
      (payroll) =>
        payroll.status === "Pending"
    ).length;
  }, [payrolls]);

  function viewPayslip(
    url: string | null
  ) {
    if (!url) {
      alert(
        "Payslip is not available."
      );
      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function downloadPayslip(
    url: string | null
  ) {
    if (!url) {
      alert(
        "Payslip is not available."
      );
      return;
    }

    const link =
      document.createElement("a");

    link.href = url;

    link.target = "_blank";

    link.rel = "noopener noreferrer";

    link.click();
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl shadow p-8">
          <p className="font-semibold">
            Loading Payslips...
          </p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl shadow p-8">

          <h1 className="text-2xl font-bold mb-2">
            My Payslips
          </h1>

          <p className="text-red-600">
            Employee profile not found.
          </p>

          <p className="text-gray-500 mt-2">
            Your login email must match
            your employee email.
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">

      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold">
          My Payslips
        </h1>

        <p className="text-gray-500 mt-1">
          View your monthly payroll
          and payslip history.
        </p>
      </div>

      {/* EMPLOYEE CARD */}

      <div className="bg-white rounded-xl shadow p-6">

        <p className="text-sm text-gray-500">
          Employee
        </p>

        <h2 className="text-xl font-bold mt-1">
          {employee.full_name}
        </h2>

        <p className="text-gray-500 mt-1">
          {employee.email}
        </p>

      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <SummaryCard
          title="Total Payslips"
          value={payrolls.length}
          color="text-violet-600"
        />

        <SummaryCard
          title="Paid"
          value={paidCount}
          color="text-green-600"
        />

        <SummaryCard
          title="Pending"
          value={pendingCount}
          color="text-orange-500"
        />

      </div>

      {/* FILTER */}

      <div className="bg-white rounded-xl shadow p-5">

        <div className="max-w-xs">

          <label className="block text-sm font-medium mb-2">
            Filter by Year
          </label>

          <select
            value={yearFilter}
            onChange={(e) =>
              setYearFilter(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          >

            <option value="All">
              All Years
            </option>

            {availableYears.map(
              (year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              )
            )}

          </select>

        </div>

      </div>

      {/* PAYSLIP TABLE */}

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <div className="p-6 border-b">

          <h2 className="text-xl font-bold">
            Payslip History
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Your uploaded monthly
            payslips
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="p-4 text-left">
                  Month
                </th>

                <th className="p-4 text-left">
                  Year
                </th>

                <th className="p-4 text-left">
                  Status
                </th>

                <th className="p-4 text-center">
                  Payslip
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredPayrolls.length ===
              0 ? (

                <tr>

                  <td
                    colSpan={4}
                    className="text-center py-12 text-gray-500"
                  >
                    No payslips found.
                  </td>

                </tr>

              ) : (

                filteredPayrolls.map(
                  (payroll) => (

                    <tr
                      key={payroll.id}
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="p-4 font-semibold">
                        {payroll.month}
                      </td>

                      <td className="p-4">
                        {payroll.year}
                      </td>

                      <td className="p-4">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            payroll.status ===
                            "Paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {payroll.status}
                        </span>

                      </td>

                      <td className="p-4">

                        {payroll.payslip_url ? (

                          <div className="flex justify-center gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                viewPayslip(
                                  payroll.payslip_url
                                )
                              }
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                downloadPayslip(
                                  payroll.payslip_url
                                )
                              }
                              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                            >
                              Download
                            </button>

                          </div>

                        ) : (

                          <div className="text-center text-gray-400">
                            Not Available
                          </div>

                        )}

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6">

      <p className="text-gray-500">
        {title}
      </p>

      <h2
        className={`text-3xl font-bold mt-2 ${color}`}
      >
        {value}
      </h2>

    </div>
  );
}