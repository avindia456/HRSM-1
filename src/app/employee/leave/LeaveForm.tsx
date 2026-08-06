"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface LeaveRecord {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  created_at?: string;
}

interface LeaveSummary {
  total: number;
  used: number;
  remaining: number;
  pending: number;
}

const MONTHLY_LEAVE_LIMIT = 1;

export default function LeaveForm() {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [employeeId, setEmployeeId] = useState<string | null>(null);

  const [leaveType, setLeaveType] = useState("Personal Reason");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  const [leaveSummary, setLeaveSummary] =
    useState<LeaveSummary>({
      total: MONTHLY_LEAVE_LIMIT,
      used: 0,
      remaining: MONTHLY_LEAVE_LIMIT,
      pending: 0,
    });

  const [history, setHistory] = useState<LeaveRecord[]>([]);

  useEffect(() => {
    initializePage();
  }, []);

  // =========================================================
  // GET LOGGED IN EMPLOYEE
  // =========================================================

  async function getLoggedInEmployee() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Auth Error:", userError);
      return null;
    }

    if (!user) {
      return null;
    }

    // First try auth_id
    const { data: employeeByAuth } = await supabase
      .from("employees")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (employeeByAuth) {
      return employeeByAuth;
    }

    // Fallback using email
    if (user.email) {
      const { data: employeeByEmail } = await supabase
        .from("employees")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (employeeByEmail) {
        return employeeByEmail;
      }
    }

    return null;
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  async function initializePage() {
    setPageLoading(true);

    const employee = await getLoggedInEmployee();

    if (!employee) {
      setPageLoading(false);
      return;
    }

    setEmployeeId(employee.id);

    await Promise.all([
      loadLeaveSummary(employee.id),
      loadLeaveHistory(employee.id),
    ]);

    setPageLoading(false);
  }

  // =========================================================
  // MONTH START / END
  // =========================================================

  function getCurrentMonthRange() {
    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1);

    const lastDay = new Date(
      year,
      month + 1,
      0
    );

    const formatDate = (date: Date) => {
      const y = date.getFullYear();

      const m = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const d = String(
        date.getDate()
      ).padStart(2, "0");

      return `${y}-${m}-${d}`;
    };

    return {
      firstDay: formatDate(firstDay),
      lastDay: formatDate(lastDay),
    };
  }

  // =========================================================
  // LOAD LEAVE SUMMARY
  // =========================================================

  async function loadLeaveSummary(
    currentEmployeeId: string
  ) {
    const { firstDay, lastDay } =
      getCurrentMonthRange();

    const { data, error } = await supabase
      .from("leaves")
    .select("*")
      .eq("employee_id", currentEmployeeId)
      .gte("start_date", firstDay)
.lte("start_date", lastDay)

    if (error) {
      console.error(
        "Leave Summary Error:",
        error
      );
      return;
    }

    const leaves = data || [];

    const approvedLeaves = leaves.filter(
      (leave: LeaveRecord) =>
        leave.status?.toLowerCase() ===
        "approved"
    );

    const pendingLeaves = leaves.filter(
      (leave: LeaveRecord) =>
        leave.status?.toLowerCase() ===
        "pending"
    );

    const used = Math.min(
      approvedLeaves.length,
      MONTHLY_LEAVE_LIMIT
    );

    const remaining = Math.max(
      MONTHLY_LEAVE_LIMIT - used,
      0
    );

    setLeaveSummary({
      total: MONTHLY_LEAVE_LIMIT,
      used,
      remaining,
      pending: pendingLeaves.length,
    });
  }

  // =========================================================
  // LOAD LEAVE HISTORY
  // =========================================================

async function loadLeaveHistory(currentEmployeeId: string) {
  const { data, error } = await supabase
    .from("leaves")
    .select("*")
    .eq("employee_id", currentEmployeeId);

  console.log("History Data:", data);
  console.log("History Error:", error);

  if (error) {
    console.error(error);
    return;
  }

  setHistory(data || []);
}

  // =========================================================
  // CALCULATE DAYS
  // =========================================================

  function calculateDays(
    startDate: string,
    endDate: string
  ) {
    if (!startDate || !endDate) {
      return 0;
    }

    const start = new Date(
      `${startDate}T00:00:00`
    );

    const end = new Date(
      `${endDate}T00:00:00`
    );

    const difference =
      end.getTime() -
      start.getTime();

    if (difference < 0) {
      return 0;
    }

    return (
      Math.floor(
        difference /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
  }

  // =========================================================
  // APPLY LEAVE
  // =========================================================

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!employeeId) {
      alert("Employee not found.");
      return;
    }

    if (!fromDate || !toDate) {
      alert(
        "Please select From Date and To Date."
      );
      return;
    }

    if (!reason.trim()) {
      alert(
        "Please enter leave reason."
      );
      return;
    }

    const startDate = new Date(
      `${fromDate}T00:00:00`
    );

    const endDate = new Date(
      `${toDate}T00:00:00`
    );

    if (startDate > endDate) {
      alert(
        "From Date cannot be after To Date."
      );
      return;
    }

    // This HRMS currently allows 1 leave day per month.
    if (calculateDays(fromDate, toDate) > 1) {
      alert(
        "Only 1 leave day is allowed per month."
      );
      return;
    }

    const { firstDay, lastDay } =
      getCurrentMonthRange();

    // Check approved leave for current month
    const {
      data: approvedLeaves,
      error: approvedError,
    } = await supabase
      .from("leaves")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("status", "Approved")
      .gte("start_date", firstDay)
.lte("start_date", lastDay)

    if (approvedError) {
      console.error(
        approvedError
      );

      alert(
        "Unable to check leave balance."
      );

      return;
    }

    if (
      (approvedLeaves?.length || 0) >=
      MONTHLY_LEAVE_LIMIT
    ) {
      alert(
        "You have already used your 1 leave for this month."
      );

      return;
    }

    // Check duplicate/pending request for same date
    const {
      data: existingLeave,
      error: existingError,
    } = await supabase
      .from("leaves")
      .select("id, status")
      .eq("employee_id", employeeId)
      .eq("start_date", fromDate)
      .maybeSingle();

    if (existingError) {
      console.error(
        existingError
      );
    }

    if (existingLeave) {
      alert(
        `Leave request already exists for this date (${existingLeave.status}).`
      );

      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("leaves")
  .insert({
employee_id: employeeId,
leave_type: leaveType,
start_date: fromDate,
end_date: toDate,
reason: reason.trim(),
status: "Pending",
})
    setLoading(false);

    if (error) {
      console.error(
        "Leave Insert Error:",
        error
      );

      alert(error.message);

      return;
    }

    alert(
      "Leave applied successfully."
    );

    // Reset form
    setLeaveType(
      "Personal Reason"
    );

    setFromDate("");
    setToDate("");
    setReason("");

    // Refresh LIVE data
    await Promise.all([
      loadLeaveSummary(employeeId),
      loadLeaveHistory(employeeId),
    ]);
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (pageLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <p className="text-lg font-semibold">
          Loading Leave Management...
        </p>
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <p className="text-red-600 font-semibold">
          Employee profile not found.
        </p>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-8">

      {/* ========================================= */}
      {/* LEAVE SUMMARY */}
      {/* ========================================= */}

      <div>
        <h2 className="text-2xl font-bold mb-5">
          Leave Balance
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Total */}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-500 text-sm">
              Monthly Leave
            </p>

            <h3 className="text-3xl font-bold text-violet-700 mt-2">
              {leaveSummary.total}
            </h3>
          </div>

          {/* Used */}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-500 text-sm">
              Used Leave
            </p>

            <h3 className="text-3xl font-bold text-green-700 mt-2">
              {leaveSummary.used} /{" "}
              {leaveSummary.total}
            </h3>
          </div>

          {/* Remaining */}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-500 text-sm">
              Remaining
            </p>

            <h3 className="text-3xl font-bold text-blue-700 mt-2">
              {leaveSummary.remaining}
            </h3>
          </div>

          {/* Pending */}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-500 text-sm">
              Pending Requests
            </p>

            <h3 className="text-3xl font-bold text-orange-600 mt-2">
              {leaveSummary.pending}
            </h3>
          </div>

        </div>
      </div>

      {/* ========================================= */}
      {/* APPLY LEAVE FORM */}
      {/* ========================================= */}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg p-8 space-y-5"
      >

        <div>
          <h2 className="text-2xl font-bold">
            Apply Leave
          </h2>

          <p className="text-gray-500 mt-1">
            Submit your leave request for approval.
          </p>
        </div>

        {/* Leave Type */}

        <div>
          <label className="block mb-2 font-medium">
            Leave Type
          </label>

          <select
            value={leaveType}
            onChange={(e) =>
              setLeaveType(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          >
            <option value="Personal Reason">
              Personal Reason
            </option>

            <option value="Sick Leave">
              Sick Leave
            </option>

            <option value="Emergency Leave">
              Emergency Leave
            </option>
          </select>
        </div>

        {/* Dates */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>
            <label className="block mb-2 font-medium">
              From Date
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(
                  e.target.value
                )
              }
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
              onChange={(e) =>
                setToDate(
                  e.target.value
                )
              }
              min={
                fromDate ||
                undefined
              }
              className="w-full border rounded-lg p-3"
              required
            />
          </div>

        </div>

        {/* Selected Days */}

        {fromDate && toDate && (
          <div className="rounded-lg bg-violet-50 p-4">
            <p className="text-sm text-gray-600">
              Selected Leave Days
            </p>

            <p className="font-bold text-violet-700 text-xl">
              {calculateDays(
                fromDate,
                toDate
              )}
            </p>
          </div>
        )}

        {/* Reason */}

        <div>
          <label className="block mb-2 font-medium">
            Reason
          </label>

          <textarea
            value={reason}
            onChange={(e) =>
              setReason(
                e.target.value
              )
            }
            rows={4}
            placeholder="Enter reason for leave..."
            className="w-full border rounded-lg p-3 resize-none"
            required
          />
        </div>

        {/* Button */}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-violet-600 py-3 text-white font-semibold hover:bg-violet-700 disabled:opacity-50"
        >
          {loading
            ? "Submitting..."
            : "Apply Leave"}
        </button>

      </form>

      {/* ========================================= */}
      {/* LEAVE HISTORY */}
      {/* ========================================= */}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">

        <div className="p-8 border-b">
          <h2 className="text-2xl font-bold">
            Leave History
          </h2>

          <p className="text-gray-500 mt-1">
            Your previous leave requests.
          </p>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>
                <th className="text-left p-4">
                  Leave Type
                </th>

                <th className="text-left p-4">
                  From
                </th>

                <th className="text-left p-4">
                  To
                </th>

                <th className="text-left p-4">
                  Days
                </th>

                <th className="text-left p-4">
                  Reason
                </th>

                <th className="text-left p-4">
                  Status
                </th>
              </tr>

            </thead>

            <tbody>

              {history.length === 0 ? (

                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-gray-500"
                  >
                    No leave history found.
                  </td>
                </tr>

              ) : (

                history.map(
                  (leave) => {

                    const status =
                      leave.status ||
                      "Pending";

                    return (
                      <tr
                        key={leave.id}
                        className="border-t hover:bg-gray-50"
                      >

                        <td className="p-4 font-medium">
                          {leave.leave_type}
                        </td>

                        <td className="p-4">
                          {new Date(
                            `${leave.start_date}T00:00:00`
                          ).toLocaleDateString(
                            "en-GB"
                          )}
                        </td>

                        <td className="p-4">
                          {new Date(
                            `${leave.end_date}T00:00:00`
                          ).toLocaleDateString(
                            "en-GB"
                          )}
                        </td>

                        <td className="p-4">
  {calculateDays(
    leave.start_date,
    leave.end_date
  )}
</td>

                        <td className="p-4 max-w-xs">
                          {leave.reason ||
                            "--"}
                        </td>

                        <td className="p-4">

                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                              status.toLowerCase() ===
                              "approved"
                                ? "text-green-700"
                                : status.toLowerCase() ===
                                  "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {status}
                          </span>

                        </td>

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}