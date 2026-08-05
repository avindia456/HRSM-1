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

interface WFHRequest {
  id: string;
  employee_id: string;
  work_date: string;
  reason: string | null;
  status: string;
  created_at?: string;
}

export default function EmployeeDashboard() {
  const supabase = createClient();

  const [attendance, setAttendance] =
    useState<Attendance | null>(null);

  const [history, setHistory] =
    useState<Attendance[]>([]);

  const [wfhRequests, setWfhRequests] =
    useState<WFHRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadAttendance();
  }, []);

  // =========================================================
  // CURRENT TIME
  // =========================================================

  function getCurrentTime() {
    return new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  // =========================================================
  // TODAY DATE
  // =========================================================

  function getToday() {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // =========================================================
  // GET LOGGED IN EMPLOYEE
  // =========================================================

  async function getEmployeeId() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("Logged in user:", user);

      if (authError) {
        console.error(
          "Auth Error:",
          authError
        );

        return null;
      }

      if (!user) {
        console.error(
          "No logged in user found."
        );

        return null;
      }

      // =====================================================
      // FIRST TRY: FIND EMPLOYEE USING auth_id
      // =====================================================

      const {
        data: employeeByAuth,
        error: employeeAuthError,
      } = await supabase
        .from("employees")
        .select("id, email, auth_id")
        .eq("auth_id", user.id)
        .maybeSingle();

      console.log(
        "Employee By Auth:",
        employeeByAuth
      );

      if (employeeByAuth) {
        return employeeByAuth.id;
      }

      if (employeeAuthError) {
        console.error(
          "Employee Auth Lookup Error:",
          employeeAuthError
        );
      }

      // =====================================================
      // FALLBACK: FIND EMPLOYEE USING EMAIL
      // =====================================================

      if (!user.email) {
        console.error(
          "Logged in user does not have email."
        );

        return null;
      }

      const {
        data: employeeByEmail,
        error: employeeEmailError,
      } = await supabase
        .from("employees")
        .select("id, email, auth_id")
        .eq("email", user.email)
        .maybeSingle();

      console.log(
        "Employee By Email:",
        employeeByEmail
      );

      if (employeeEmailError) {
        console.error(
          "Employee Email Lookup Error:",
          employeeEmailError
        );

        return null;
      }

      if (!employeeByEmail) {
        console.error(
          "Employee not found for email:",
          user.email
        );

        return null;
      }

      // =====================================================
      // AUTOMATICALLY LINK auth_id
      // =====================================================

      if (!employeeByEmail.auth_id) {
        const {
          error: updateAuthError,
        } = await supabase
          .from("employees")
          .update({
            auth_id: user.id,
          })
          .eq(
            "id",
            employeeByEmail.id
          );

        if (updateAuthError) {
          console.error(
            "Unable to link auth_id:",
            updateAuthError
          );
        } else {
          console.log(
            "Employee auth_id linked successfully."
          );
        }
      }

      return employeeByEmail.id;
    } catch (error) {
      console.error(
        "getEmployeeId Error:",
        error
      );

      return null;
    }
  }

  // =========================================================
  // LOAD ATTENDANCE + HISTORY + WFH
  // =========================================================

  async function loadAttendance() {
    setLoading(true);

    try {
      const employeeId =
        await getEmployeeId();

      console.log(
        "Employee ID:",
        employeeId
      );

      if (!employeeId) {
        setAttendance(null);
        setHistory([]);
        setWfhRequests([]);
        setLoading(false);

        return;
      }

      // =====================================================
      // TODAY ATTENDANCE
      // =====================================================

      const {
        data: todayAttendance,
        error: todayError,
      } = await supabase
        .from("attendance")
        .select("*")
        .eq(
          "employee_id",
          employeeId
        )
        .eq(
          "attendance_date",
          getToday()
        )
        .maybeSingle();

      if (todayError) {
        console.error(
          "Today Attendance Error:",
          todayError
        );
      }

      setAttendance(
        todayAttendance || null
      );

      // =====================================================
      // ATTENDANCE HISTORY
      // =====================================================

      const {
        data: historyData,
        error: historyError,
      } = await supabase
        .from("attendance")
        .select("*")
        .eq(
          "employee_id",
          employeeId
        )
        .order(
          "attendance_date",
          {
            ascending: false,
          }
        );

      if (historyError) {
        console.error(
          "Attendance History Error:",
          historyError
        );
      }

      setHistory(
        historyData || []
      );

      // =====================================================
      // WFH HISTORY
      // =====================================================

      const {
        data: wfhData,
        error: wfhError,
      } = await supabase
        .from("work_from_home")
        .select("*")
        .eq(
          "employee_id",
          employeeId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      console.log(
        "WFH Data:",
        wfhData
      );

      if (wfhError) {
        console.error(
          "WFH Error:",
          wfhError
        );
      }

      setWfhRequests(
        wfhData || []
      );
    } catch (error) {
      console.error(
        "Load Dashboard Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // CHECK IN
  // =========================================================

  async function checkIn() {
    try {
      const employeeId =
        await getEmployeeId();

      if (!employeeId) {
        alert(
          "Employee record not found. Please contact admin."
        );

        return;
      }

      if (attendance) {
        alert(
          "You have already checked in today."
        );

        return;
      }

      const now = new Date();

      const officeTime =
        new Date();

      officeTime.setHours(
        9,
        30,
        0,
        0
      );

      const lateMark =
        now > officeTime;

      const {
        error,
      } = await supabase
        .from("attendance")
        .insert({
          employee_id:
            employeeId,

          attendance_date:
            getToday(),

          check_in:
            getCurrentTime(),

          late_mark:
            lateMark,

          status:
            "Working",
        });

      if (error) {
        console.error(
          "Check In Error:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      alert(
        "Check-in successful!"
      );

      await loadAttendance();
    } catch (error: any) {
      console.error(
        "Check In Error:",
        error
      );

      alert(
        error?.message ||
          "Unable to check in."
      );
    }
  }

  // =========================================================
  // CHECK OUT
  // =========================================================

  async function checkOut() {
    try {
      if (!attendance) {
        alert(
          "Attendance record not found."
        );

        return;
      }

      if (attendance.check_out) {
        alert(
          "You have already checked out today."
        );

        return;
      }

      const {
        error,
      } = await supabase
        .from("attendance")
        .update({
          check_out:
            getCurrentTime(),

          status:
            "Present",
        })
        .eq(
          "id",
          attendance.id
        );

      if (error) {
        console.error(
          "Check Out Error:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      alert(
        "Check-out successful!"
      );

      await loadAttendance();
    } catch (error: any) {
      console.error(
        "Check Out Error:",
        error
      );

      alert(
        error?.message ||
          "Unable to check out."
      );
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="p-10 text-xl">
        Loading...
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="max-w-6xl mx-auto p-10">

      {/* ================================================= */}
      {/* HEADING */}
      {/* ================================================= */}

      <h1 className="text-4xl font-bold mb-8">
        Employee Dashboard
      </h1>

      {/* ================================================= */}
      {/* TODAY ATTENDANCE */}
      {/* ================================================= */}

      <div className="bg-white rounded-xl shadow-lg p-8">

        <h2 className="text-2xl font-semibold mb-6">
          Today&apos;s Attendance
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          {/* CHECK IN */}

          <div>
            <p className="text-gray-500">
              Check In
            </p>

            <p className="font-semibold text-lg">
              {attendance?.check_in ||
                "--"}
            </p>
          </div>

          {/* CHECK OUT */}

          <div>
            <p className="text-gray-500">
              Check Out
            </p>

            <p className="font-semibold text-lg">
              {attendance?.check_out ||
                "--"}
            </p>
          </div>

          {/* LATE MARK */}

          <div>
            <p className="text-gray-500 mb-2">
              Late Mark
            </p>

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

          {/* STATUS */}

          <div>
            <p className="text-gray-500 mb-2">
              Status
            </p>

            <span
              className={`px-3 py-1 rounded-full text-white text-sm ${
                attendance?.status ===
                "Present"
                  ? "bg-green-600"
                  : attendance?.status ===
                    "Working"
                  ? "bg-blue-600"
                  : "bg-gray-500"
              }`}
            >
              {attendance?.status ||
                "--"}
            </span>
          </div>

        </div>

        {/* ================================================= */}
        {/* BUTTONS */}
        {/* ================================================= */}

        <div className="mt-8 flex gap-4 flex-wrap">

          {!attendance && (
            <button
              type="button"
              onClick={checkIn}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
            >
              Check In
            </button>
          )}

          {attendance?.check_in &&
            !attendance?.check_out && (
              <button
                type="button"
                onClick={checkOut}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
              >
                Check Out
              </button>
            )}

          {attendance?.check_out && (
            <div className="text-green-600 font-semibold text-lg">
              ✅ Today&apos;s attendance completed
            </div>
          )}

        </div>

      </div>

      {/* ================================================= */}
      {/* ATTENDANCE HISTORY */}
      {/* ================================================= */}

      <div className="bg-white rounded-xl shadow-lg p-8 mt-8">

        <h2 className="text-2xl font-semibold mb-6">
          Attendance History
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full border-collapse">

            <thead>

              <tr className="bg-gray-100">

                <th className="p-3 text-left">
                  Date
                </th>

                <th className="p-3 text-left">
                  Check In
                </th>

                <th className="p-3 text-left">
                  Check Out
                </th>

                <th className="p-3 text-left">
                  Late
                </th>

                <th className="p-3 text-left">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {history.length > 0 ? (
                history.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="border-b hover:bg-gray-50"
                    >

                      <td className="p-3">
                        {new Date(
                          `${item.attendance_date}T00:00:00`
                        ).toLocaleDateString(
                          "en-GB"
                        )}
                      </td>

                      <td className="p-3">
                        {item.check_in ||
                          "--"}
                      </td>

                      <td className="p-3">
                        {item.check_out ||
                          "--"}
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
                            item.status ===
                            "Present"
                              ? "bg-green-600"
                              : item.status ===
                                "Working"
                              ? "bg-blue-600"
                              : "bg-gray-500"
                          }`}
                        >
                          {item.status}
                        </span>

                      </td>

                    </tr>
                  )
                )
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

      {/* ================================================= */}
      {/* WFH REQUESTS */}
      {/* ================================================= */}

      <div className="bg-white rounded-xl shadow-lg p-8 mt-8">

        <h2 className="text-2xl font-semibold mb-6">
          My Work From Home Requests
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="bg-gray-100">

                <th className="p-3 text-left">
                  Date
                </th>

                <th className="p-3 text-left">
                  Reason
                </th>

                <th className="p-3 text-center">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {wfhRequests.length > 0 ? (
                wfhRequests.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="border-b hover:bg-gray-50"
                    >

                      <td className="p-3">
                        {new Date(
                          `${item.work_date}T00:00:00`
                        ).toLocaleDateString(
                          "en-GB"
                        )}
                      </td>

                      <td className="p-3">
                        {item.reason ||
                          "--"}
                      </td>

                      <td className="p-3 text-center">

                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            item.status ===
                            "Approved"
                              ? "bg-green-100 text-green-700"
                              : item.status ===
                                "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {item.status ||
                            "Pending"}
                        </span>

                      </td>

                    </tr>
                  )
                )
              ) : (
                <tr>

                  <td
                    colSpan={3}
                    className="p-6 text-center text-gray-500"
                  >
                    No WFH Requests
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