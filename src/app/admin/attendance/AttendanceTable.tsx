"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  late_mark: boolean;
  status: string;
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
}

export default function AttendanceTable() {
  const [loading, setLoading] = useState(true);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Record<string, Employee>>({});

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  function calculateWorkingHours(
    checkIn: string | null,
    checkOut: string | null
  ) {
    if (!checkIn || !checkOut) return "--";

    const [inH, inM, inS] = checkIn.split(":").map(Number);
    const [outH, outM, outS] = checkOut.split(":").map(Number);

    const inTime = new Date();
    inTime.setHours(inH, inM, inS);

    const outTime = new Date();
    outTime.setHours(outH, outM, outS);

    const diff = outTime.getTime() - inTime.getTime();

    if (diff <= 0) return "--";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(
      (diff % (1000 * 60 * 60)) / (1000 * 60)
    );

    return `${hours}h ${minutes}m`;
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Employees
    const { data: employeeData } = await supabase
      .from("employees")
      .select("id, full_name, email");

    const employeeMap: Record<string, Employee> = {};

    employeeData?.forEach((emp: Employee) => {
      employeeMap[emp.id] = emp;
    });

    setEmployees(employeeMap);

    // Attendance
    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("*")
      .order("attendance_date", {
        ascending: false,
      });

    setRecords(attendanceData || []);

    setLoading(false);
  }

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const employee = employees[record.employee_id];

      const matchesSearch =
        !search ||
        employee?.full_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        employee?.email
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesDate =
        !selectedDate ||
        record.attendance_date === selectedDate;

      return matchesSearch && matchesDate;
    });
  }, [records, employees, search, selectedDate]);

  // Summary cards ke liye sirf aaj ka attendance
  const today = new Date().toISOString().split("T")[0];

  const todayRecords = records.filter(
    (record) => record.attendance_date === today
  );

  const presentCount = todayRecords.filter(
    (r) => r.status === "Present"
  ).length;

  const workingCount = todayRecords.filter(
    (r) => r.status === "Working"
  ).length;

  const lateCount = todayRecords.filter(
    (r) => r.late_mark
  ).length;

  const totalCount = todayRecords.length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        Loading attendance...
      </div>
    );
  }
    return (

    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-green-100 rounded-xl p-5">
          <p className="text-gray-600">Present</p>
          <h2 className="text-3xl font-bold text-green-700">
            {presentCount}
          </h2>
        </div>

        <div className="bg-blue-100 rounded-xl p-5">
          <p className="text-gray-600">Working</p>
          <h2 className="text-3xl font-bold text-blue-700">
            {workingCount}
          </h2>
        </div>

        <div className="bg-red-100 rounded-xl p-5">
          <p className="text-gray-600">Late</p>
          <h2 className="text-3xl font-bold text-red-700">
            {lateCount}
          </h2>
        </div>

        <div className="bg-gray-100 rounded-xl p-5">
          <p className="text-gray-600">Total</p>
          <h2 className="text-3xl font-bold text-gray-700">
            {totalCount}
          </h2>
        </div>

      </div>

      {/* Filters */}

      <div className="bg-white rounded-xl shadow-lg p-5 flex flex-col md:flex-row gap-4">

        <input
          type="text"
          placeholder="Search Employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2 flex-1"
        />

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded-lg px-4 py-2"
        />

      </div>

      {/* Attendance Table */}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">

        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">
            Attendance Records
          </h2>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>
                <th className="text-left p-4">Employee</th>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Check In</th>
                <th className="text-left p-4">Check Out</th>
                <th className="text-left p-4">Late</th>
                <th className="text-left p-4">Status</th>
              </tr>

            </thead>

            <tbody>

              {filteredRecords.length === 0 ? (

                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-gray-500"
                  >
                    No attendance found.
                  </td>
                </tr>

              ) : (

                filteredRecords.map((record) => {

                  const employee =
                    employees[record.employee_id];

                  return (

                    <tr
                      key={record.id}
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="p-4">

                        <div className="font-semibold">
                          {employee?.full_name}
                        </div>

                        <div className="text-sm text-gray-500">
                          {employee?.email}
                        </div>

                      </td>

                      <td className="p-4">
                        {new Date(
                          record.attendance_date
                        ).toLocaleDateString("en-GB")}
                      </td>

                      <td className="p-4">
                        {record.check_in || "--"}
                      </td>

                      <td className="p-4">
                        {record.check_out || "--"}
                      </td>

                      <td className="p-4">

                        <span
                          className={`px-3 py-1 rounded-full text-white text-xs ${
                            record.late_mark
                              ? "bg-red-600"
                              : "bg-green-600"
                          }`}
                        >
                          {record.late_mark
                            ? "Late"
                            : "On Time"}
                        </span>

                      </td>

                      <td className="p-4">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium
                          ${
                            record.status === "Present"
                              ? "bg-green-100 text-green-700"
                              : record.status === "Working"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {record.status}
                        </span>

                      </td>

                    </tr>

                  );
                })

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}