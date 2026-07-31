"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface Employee {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  designation: string | null;
}

interface Leave {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

interface LeaveRow extends Leave {
  employee: Employee | null;
}

export default function AdminLeavePage() {
  const [loading, setLoading] = useState(true);

  const [requests, setRequests] = useState<LeaveRow[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadLeaves();
  }, []);

  async function loadLeaves() {
    setLoading(true);

    const { data: leaveData, error } =
      await supabase
        .from("leaves")
        .select("*")
        .order("start_date", {
          ascending: false,
        });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const employeeIds = [
      ...new Set(
        leaveData.map(
          (leave: any) => leave.employee_id
        )
      ),
    ];

    const { data: employees } =
      await supabase
        .from("employees")
        .select(
          "id, full_name, email, department, designation"
        )
        .in("id", employeeIds);

    const rows: LeaveRow[] =
      leaveData.map((leave: any) => ({
        ...leave,
        employee:
          employees?.find(
            (emp: any) =>
              emp.id === leave.employee_id
          ) || null,
      }));

    setRequests(rows);

    setSummary({
      total: rows.length,

      pending: rows.filter(
        (r) => r.status === "Pending"
      ).length,

      approved: rows.filter(
        (r) => r.status === "Approved"
      ).length,

      rejected: rows.filter(
        (r) => r.status === "Rejected"
      ).length,
    });

    setLoading(false);
  }

  async function updateStatus(
    id: string,
    status: "Approved" | "Rejected"
  ) {
    const { error } = await supabase
      .from("leaves")
      .update({
        status,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadLeaves();
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((leave) => {
      const matchesSearch =
        leave.employee?.full_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        leave.employee?.email
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All"
          ? true
          : leave.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  if (loading) {
    return (
      <div className="p-8">
        Loading Leave Requests...
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">

      <div>
        <h1 className="text-3xl font-bold">
          Leave Management
        </h1>

        <p className="text-gray-500">
          Manage employee leave requests
        </p>
      </div>

      {/* Summary */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        <Card
          title="Total Requests"
          value={summary.total}
          color="text-violet-600"
        />

        <Card
          title="Pending"
          value={summary.pending}
          color="text-orange-500"
        />

        <Card
          title="Approved"
          value={summary.approved}
          color="text-green-600"
        />

        <Card
          title="Rejected"
          value={summary.rejected}
          color="text-red-600"
        />

      </div>

      {/* Filters */}

      <div className="bg-white rounded-xl shadow p-5 flex flex-col md:flex-row gap-4">

        <input
          type="text"
          placeholder="Search Employee..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="border rounded-lg p-3 flex-1"
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          className="border rounded-lg p-3"
        >
          <option>All</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>

      </div>
            {/* Leave Requests Table */}

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>
                <th className="p-4 text-left">Employee</th>
                <th className="p-4 text-left">Department</th>
                <th className="p-4 text-left">Leave Type</th>
                <th className="p-4 text-left">Start</th>
                <th className="p-4 text-left">End</th>
                <th className="p-4 text-left">Status</th>
                
              </tr>

            </thead>

            <tbody>

              {filteredRequests.length === 0 ? (

                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-gray-500"
                  >
                    No leave requests found.
                  </td>
                </tr>

              ) : (

                filteredRequests.map((leave) => (

                  <tr
                    key={leave.id}
                    className="border-t hover:bg-gray-50"
                  >

                    <td className="p-4">

                      <div className="font-semibold">
                        {leave.employee?.full_name}
                      </div>

                      <div className="text-sm text-gray-500">
                        {leave.employee?.email}
                      </div>

                    </td>

                    <td className="p-4">
                      {leave.employee?.department || "-"}
                    </td>

                    <td className="p-4">
                      {leave.leave_type}
                    </td>

                    <td className="p-4">
                      {leave.start_date}
                    </td>

                    <td className="p-4">
                      {leave.end_date}
                    </td>

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          leave.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : leave.status === "Rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {leave.status}
                      </span>

                    </td>

                    <td className="p-4">

                      <div className="flex gap-2 justify-center">

                     

                        {leave.status === "Pending" && (

                          <>
                            <button
                              onClick={() =>
                                updateStatus(
                                  leave.id,
                                  "Approved"
                                )
                              }
                              className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                            >
                              Approve
                            </button>

                            <button
                              onClick={() =>
                                updateStatus(
                                  leave.id,
                                  "Rejected"
                                )
                              }
                              className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </>

                        )}

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <p className="text-gray-500">{title}</p>

      <h2 className={`text-3xl font-bold mt-2 ${color}`}>
        {value}
      </h2>
    </div>
  );
}