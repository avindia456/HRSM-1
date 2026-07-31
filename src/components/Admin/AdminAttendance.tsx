"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface Attendance {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  late_mark: boolean;
  status: string;
}

export default function AdminAttendance() {
  const [attendance, setAttendance] =
    useState<Attendance | null>(null);

  const [history, setHistory] = useState<Attendance[]>([]);

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

  const getToday = () =>
    new Date().toISOString().split("T")[0];

  async function getAdminEmployeeId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

  const { data: admin } = await supabase
  .from("employees")
  .select("id")
  .eq("email", user.email)
  .single();
    if (!admin) return null;

    return admin.id;
  }

  async function loadAttendance() {
    setLoading(true);

    const employeeId = await getAdminEmployeeId();

    if (!employeeId) {
      setAttendance(null);
      setHistory([]);
      setLoading(false);
      return;
    }

    const { data: todayAttendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("attendance_date", getToday())
      .maybeSingle();

    setAttendance(todayAttendance);

    const { data: historyData } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employeeId)
      .order("attendance_date", {
        ascending: false,
      });

    setHistory(historyData || []);
        setLoading(false);
  }

  async function checkIn() {
    const employeeId = await getAdminEmployeeId();

    if (!employeeId) {
      alert("Admin not found.");
      return;
    }

    if (attendance) {
      alert("You have already checked in today.");
      return;
    }

const now = new Date();

const lateTime = new Date();
lateTime.setHours(10, 15, 0, 0);

const halfDayTime = new Date();
halfDayTime.setHours(13, 15, 0, 0);

let lateMark = false;
let status = "Working";

if (now >= halfDayTime) {
  lateMark = true;
  status = "Half Day";
} else if (now >= lateTime) {
  lateMark = true;
  status = "Working";
}

const { error } = await supabase
  .from("attendance")
  .insert({
    employee_id: employeeId,
    attendance_date: getToday(),
    check_in: getCurrentTime(),
    late_mark: lateMark,
    status,
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
  status:
    attendance.status === "Half Day"
      ? "Half Day"
      : "Present",
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
      <div className="bg-white rounded-xl shadow p-6">
        Loading...
      </div>
    );
  }
    return (
    <div className="mt-8 space-y-6">

      {/* Today's Attendance */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">
          Admin Attendance
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

        <div className="mt-8 flex gap-4">

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

      <div className="bg-white rounded-xl shadow-lg p-6">

        <h2 className="text-2xl font-bold mb-6">
          Attendance History
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>
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

    </div>
  );
}