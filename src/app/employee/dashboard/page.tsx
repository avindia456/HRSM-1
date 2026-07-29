"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Attendance {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  late_mark: boolean;
  status: string;
}

export default function EmployeeDashboard() {
  const supabase = createClient();

  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [wfhRequests, setWfhRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, []);

  const getCurrentTime = () =>
    new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const getToday = () => new Date().toISOString().split("T")[0];

  async function getEmployeeId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!employee) return null;

    return employee.id;
  }

  async function loadAttendance() {
    setLoading(true);

    const employeeId = await getEmployeeId();
    console.log("Employee ID:", employeeId);

    if (!employeeId) {
      setAttendance(null);
      setHistory([]);
      setLoading(false);
      return;
    }

    // Today's attendance
    const { data: todayAttendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("attendance_date", getToday())
      .maybeSingle();

    setAttendance(todayAttendance);

    // History
const { data: historyData } = await supabase
  .from("attendance")
  .select("*")
  .eq("employee_id", employeeId)
  .order("attendance_date", { ascending: false });

setHistory(historyData || []);

const { data: wfhData, error } = await supabase
  .from("work_from_home")
  .select("*")
  .eq("employee_id", employeeId)
  .order("created_at", { ascending: false });

console.log("WFH Data:", wfhData);
console.log("WFH Error:", error);

setWfhRequests(wfhData || []);

setLoading(false);
  }

  async function checkIn() {
    const employeeId = await getEmployeeId();

    if (!employeeId) {
      alert("Employee not found.");
      return;
    }

    if (attendance) {
      alert("You have already checked in today.");
      return;
    }

    const now = new Date();

    const officeTime = new Date();
    officeTime.setHours(9, 30, 0, 0);

    const lateMark = now > officeTime;

    const { error } = await supabase.from("attendance").insert({
      employee_id: employeeId,
      attendance_date: getToday(),
      check_in: getCurrentTime(),
      late_mark: lateMark,
      status: "Working",
    });

    if (error) {
      alert(error.message);
      return;
    }

    loadAttendance();
  }

  async function checkOut() {
    if (!attendance) return;

    const { error } = await supabase
      .from("attendance")
      .update({
        check_out: getCurrentTime(),
        status: "Present",
      })
      .eq("id", attendance.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadAttendance();
    
  }

  if (loading) {
    return (
      <div className="p-10 text-xl">
        Loading...
      </div>
    );
  }
    return (
    <div className="max-w-6xl mx-auto p-10">
      <h1 className="text-4xl font-bold mb-8">
        Employee Dashboard
      </h1>

      {/* Today's Attendance */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold mb-6">
          Today's Attendance
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-500">Check In</p>
            <p className="font-semibold text-lg">
              {attendance?.check_in || "--"}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Check Out</p>
            <p className="font-semibold text-lg">
              {attendance?.check_out || "--"}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Late Mark</p>
            <span
              className={`px-3 py-1 rounded-full text-white text-sm ${
                attendance?.late_mark
                  ? "bg-red-600"
                  : "bg-green-600"
              }`}
            >
              {attendance
                ? attendance.late_mark
                  ? "Late"
                  : "On Time"
                : "--"}
            </span>
          </div>

          <div>
            <p className="text-gray-500">Status</p>

            <span
              className={`px-3 py-1 rounded-full text-white text-sm ${
                attendance?.status === "Present"
                  ? "bg-green-600"
                  : attendance?.status === "Working"
                  ? "bg-blue-600"
                  : "bg-gray-500"
              }`}
            >
              {attendance?.status || "--"}
            </span>
          </div>
        </div>

        <div className="mt-8 flex gap-4 flex-wrap">
          {!attendance && (
            <button
              onClick={checkIn}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
            >
              Check In
            </button>
          )}

          {attendance?.check_in && !attendance?.check_out && (
            <button
              onClick={checkOut}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
            >
              Check Out
            </button>
          )}

          {attendance?.check_out && (
            <div className="text-green-600 font-semibold text-lg">
              ✅ Today's attendance completed
            </div>
          )}
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
        <h2 className="text-2xl font-semibold mb-6">
          Attendance History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Check In</th>
                <th className="p-3 text-left">Check Out</th>
                <th className="p-3 text-left">Late</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {history.length > 0 ? (
                history.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-3">
                      {new Date(
                        item.attendance_date
                      ).toLocaleDateString("en-GB")}
                    </td>

                    <td className="p-3">
                      {item.check_in || "--"}
                    </td>

                    <td className="p-3">
                      {item.check_out || "--"}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-white text-xs ${
                          item.late_mark
                            ? "bg-red-500"
                            : "bg-green-500"
                        }`}
                      >
                        {item.late_mark
                          ? "Late"
                          : "On Time"}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-white text-xs ${
                          item.status === "Present"
                            ? "bg-green-600"
                            : item.status === "Working"
                            ? "bg-blue-600"
                            : "bg-gray-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-6 text-gray-500"
                  >
                    No attendance history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
  <h2 className="text-2xl font-semibold mb-6">
    My Work From Home Requests
  </h2>

  <table className="w-full">
    <thead>
      <tr className="bg-gray-100">
        <th className="p-3 text-left">Date</th>
        <th className="p-3 text-left">Reason</th>
        <th className="p-3 text-center">Status</th>
      </tr>
    </thead>

    <tbody>
      {wfhRequests.length > 0 ? (
        wfhRequests.map((item) => (
          <tr key={item.id} className="border-b">
            <td className="p-3">
              {new Date(item.work_date).toLocaleDateString("en-GB")}
            </td>

            <td className="p-3">{item.reason}</td>

            <td className="p-3 text-center">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  item.status === "Approved"
                    ? "bg-green-100 text-green-700"
                    : item.status === "Rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {item.status}
              </span>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={3} className="p-4 text-center">
            No WFH Requests
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
    </div>
  );
}