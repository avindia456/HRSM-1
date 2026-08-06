"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// =========================================================
// TYPES
// =========================================================

interface Attendance {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  late_mark: boolean;
  status: string;

  check_in_latitude: number | null;
  check_in_longitude: number | null;

  check_out_latitude: number | null;
  check_out_longitude: number | null;
}

interface WFHRequest {
  id: string;
  employee_id: string;
  work_date: string;
  reason: string | null;
  status: string;
  created_at?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
}

interface LoggedInPerson {
  id: string;
  email: string | null;
  full_name?: string | null;
  auth_id?: string | null;
}

// =========================================================
// COMPONENT
// =========================================================

export default function EmployeeDashboard() {
  const supabase = createClient();

  const [attendance, setAttendance] =
    useState<Attendance | null>(null);

  const [history, setHistory] =
    useState<Attendance[]>([]);

  const [wfhRequests, setWfhRequests] =
    useState<WFHRequest[]>([]);

  const [loggedInPerson, setLoggedInPerson] =
    useState<LoggedInPerson | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [
    attendanceActionLoading,
    setAttendanceActionLoading,
  ] = useState(false);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  // =========================================================
  // CURRENT TIME
  // =========================================================

  function getCurrentTime() {
    return new Date().toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }
    );
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
  // CURRENT LOCATION
  // =========================================================

  function getCurrentLocation(): Promise<LocationData> {
    return new Promise(
      (resolve, reject) => {
        if (!navigator.geolocation) {
          reject(
            new Error(
              "Location is not supported by this browser."
            )
          );

          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log(
              "GPS accuracy:",
              position.coords.accuracy
            );

            resolve({
              latitude:
                position.coords.latitude,

              longitude:
                position.coords.longitude,
            });
          },

          (error) => {
            console.error(
              "Geolocation Error:",
              error
            );

            if (
              error.code ===
              error.PERMISSION_DENIED
            ) {
              reject(
                new Error(
                  "Location permission is required. Please allow location access and try again."
                )
              );

              return;
            }

            if (
              error.code ===
              error.POSITION_UNAVAILABLE
            ) {
              reject(
                new Error(
                  "Your current location could not be detected. Please enable GPS/location services."
                )
              );

              return;
            }

            if (
              error.code ===
              error.TIMEOUT
            ) {
              reject(
                new Error(
                  "Location request timed out. Please try again."
                )
              );

              return;
            }

            reject(
              new Error(
                "Unable to get your current location."
              )
            );
          },

          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          }
        );
      }
    );
  }

  // =========================================================
  // OPEN GOOGLE MAPS
  // =========================================================

  function openLocation(
    latitude: number | null,
    longitude: number | null
  ) {
    if (
      latitude == null ||
      longitude == null
    ) {
      alert(
        "Location not available."
      );

      return;
    }

    const url =
      `https://www.google.com/maps?q=${latitude},${longitude}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // =========================================================
  // GET LOGGED IN USER'S EMPLOYEE RECORD
  // WORKS FOR EMPLOYEE + ADMIN
  // =========================================================

  async function getLoggedInEmployee() {
    try {
      const {
        data: { user },
        error: authError,
      } =
        await supabase.auth.getUser();

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

      console.log(
        "Logged In Auth User:",
        user
      );

      // =====================================================
      // FIRST: SEARCH USING AUTH ID
      // =====================================================

      const {
        data: byAuth,
        error: authLookupError,
      } = await supabase
        .from("employees")
        .select(
          "id, email, full_name, auth_id"
        )
        .eq(
          "auth_id",
          user.id
        )
        .maybeSingle();

      if (authLookupError) {
        console.error(
          "Auth ID Lookup Error:",
          authLookupError
        );
      }

      if (byAuth) {
        setLoggedInPerson(byAuth);

        return byAuth;
      }

      // =====================================================
      // FALLBACK: SEARCH USING EMAIL
      // =====================================================

      if (!user.email) {
        console.error(
          "Logged in user has no email."
        );

        return null;
      }

      const {
        data: byEmail,
        error: emailLookupError,
      } = await supabase
        .from("employees")
        .select(
          "id, email, full_name, auth_id"
        )
        .ilike(
          "email",
          user.email
        )
        .maybeSingle();

      if (emailLookupError) {
        console.error(
          "Email Lookup Error:",
          emailLookupError
        );

        return null;
      }

      if (!byEmail) {
        console.error(
          "No employee record found for:",
          user.email
        );

        return null;
      }

      // =====================================================
      // AUTO LINK AUTH ID
      // =====================================================

      if (!byEmail.auth_id) {
        const {
          error: linkError,
        } = await supabase
          .from("employees")
          .update({
            auth_id: user.id,
          })
          .eq(
            "id",
            byEmail.id
          );

        if (linkError) {
          console.error(
            "Unable to link auth_id:",
            linkError
          );
        } else {
          console.log(
            "Auth ID linked successfully."
          );
        }
      }

      const person = {
        ...byEmail,
        auth_id:
          byEmail.auth_id ||
          user.id,
      };

      setLoggedInPerson(person);

      return person;
    } catch (error) {
      console.error(
        "getLoggedInEmployee Error:",
        error
      );

      return null;
    }
  }

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  async function loadDashboard() {
    setLoading(true);

    try {
      const person =
        await getLoggedInEmployee();

      if (!person) {
        setAttendance(null);
        setHistory([]);
        setWfhRequests([]);

        return;
      }

      const employeeId =
        person.id;

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
      // HISTORY
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
          "History Error:",
          historyError
        );
      }

      setHistory(
        historyData || []
      );

      // =====================================================
      // WFH
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
    if (attendanceActionLoading) {
      return;
    }

    setAttendanceActionLoading(true);

    try {
      const person =
        await getLoggedInEmployee();

      if (!person) {
        alert(
          "Your employee record was not found. Admin and employee accounts must also exist in the employees table."
        );

        return;
      }

      if (attendance) {
        alert(
          "You have already checked in today."
        );

        return;
      }

      // =====================================================
      // GET GPS LOCATION
      // =====================================================

      const location =
        await getCurrentLocation();

      console.log(
        "Check-In Location:",
        location
      );

      // =====================================================
      // LATE MARK
      // =====================================================

      const now =
        new Date();

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

      // =====================================================
      // SAVE
      // =====================================================

      const {
        error,
      } = await supabase
        .from("attendance")
        .insert({
          employee_id:
            person.id,

          attendance_date:
            getToday(),

          check_in:
            getCurrentTime(),

          check_in_latitude:
            location.latitude,

          check_in_longitude:
            location.longitude,

          late_mark:
            lateMark,

          status:
            "Working",
        });

      if (error) {
        console.error(
          "Check-In Database Error:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      alert(
        "Check-in successful! Location recorded."
      );

      await loadDashboard();
    } catch (error: any) {
      console.error(
        "Check-In Error:",
        error
      );

      alert(
        error?.message ||
          "Unable to check in."
      );
    } finally {
      setAttendanceActionLoading(false);
    }
  }

  // =========================================================
  // CHECK OUT
  // =========================================================

  async function checkOut() {
    if (attendanceActionLoading) {
      return;
    }

    setAttendanceActionLoading(true);

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

      // =====================================================
      // GET GPS LOCATION AGAIN
      // =====================================================

      const location =
        await getCurrentLocation();

      console.log(
        "Check-Out Location:",
        location
      );

      // =====================================================
      // UPDATE
      // =====================================================

      const {
        error,
      } = await supabase
        .from("attendance")
        .update({
          check_out:
            getCurrentTime(),

          check_out_latitude:
            location.latitude,

          check_out_longitude:
            location.longitude,

          status:
            "Present",
        })
        .eq(
          "id",
          attendance.id
        );

      if (error) {
        console.error(
          "Check-Out Database Error:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      alert(
        "Check-out successful! Location recorded."
      );

      await loadDashboard();
    } catch (error: any) {
      console.error(
        "Check-Out Error:",
        error
      );

      alert(
        error?.message ||
          "Unable to check out."
      );
    } finally {
      setAttendanceActionLoading(false);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="p-4 sm:p-6 text-xl">
        Loading...
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-5 sm:py-6 lg:p-10">

      {/* HEADING */}

      <h1 className="mb-5 text-2xl font-bold sm:mb-8 sm:text-3xl lg:text-4xl">
        Attendance Dashboard
      </h1>

      {loggedInPerson && (
        <p className="text-gray-500 mb-8">
          {loggedInPerson.full_name ||
            loggedInPerson.email}
        </p>
      )}

      {/* ================================================= */}
      {/* TODAY ATTENDANCE */}
      {/* ================================================= */}

      <div className="rounded-xl bg-white p-4 shadow-lg sm:p-6 lg:p-8">

        <h2 className="text-2xl font-semibold mb-6">
          Today&apos;s Attendance
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">

          {/* CHECK IN */}

          <div>
            <p className="text-gray-500">
              Check In
            </p>

            <p className="font-semibold text-lg">
              {attendance?.check_in ||
                "--"}
            </p>

            {attendance?.check_in_latitude != null &&
              attendance?.check_in_longitude != null && (
                <button
                  type="button"
                  onClick={() =>
                    openLocation(
                      attendance.check_in_latitude,
                      attendance.check_in_longitude
                    )
                  }
                  className="text-blue-600 hover:underline text-sm mt-2"
                >
                  📍 View Location
                </button>
              )}
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

            {attendance?.check_out_latitude != null &&
              attendance?.check_out_longitude != null && (
                <button
                  type="button"
                  onClick={() =>
                    openLocation(
                      attendance.check_out_latitude,
                      attendance.check_out_longitude
                    )
                  }
                  className="text-blue-600 hover:underline text-sm mt-2"
                >
                  📍 View Location
                </button>
              )}
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
        {/* CHECK IN / CHECK OUT */}
        {/* ================================================= */}

        <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">

          {!attendance && (
            <button
              type="button"
              onClick={checkIn}
              disabled={
                attendanceActionLoading
              }
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg w-full sm:w-auto"
            >
              {attendanceActionLoading
                ? "Getting Location..."
                : "📍 Check In"}
            </button>
          )}

          {attendance?.check_in &&
            !attendance?.check_out && (
              <button
                type="button"
                onClick={checkOut}
                disabled={
                  attendanceActionLoading
                }
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg w-full sm:w-auto"
              >
                {attendanceActionLoading
                  ? "Getting Location..."
                  : "📍 Check Out"}
              </button>
            )}

          {attendance?.check_out && (
            <div className="text-green-600 font-semibold text-lg">
              ✅ Today&apos;s attendance completed
            </div>
          )}

        </div>

        <p className="mt-4 text-sm text-gray-500">
          📍 Location permission is required for Check In and Check Out.
        </p>

      </div>

      {/* ================================================= */}
      {/* ATTENDANCE HISTORY */}
      {/* ================================================= */}

      <div className="mt-6 rounded-xl bg-white p-4 shadow-lg sm:mt-8 sm:p-6 lg:p-8">

        <h2 className="text-2xl font-semibold mb-6">
          Attendance History
        </h2>

        <div className="w-full overflow-x-auto overscroll-x-contain">

          <table className="w-full min-w-[750px] border-collapse">

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

                <th className="p-3 text-left">
                  Location
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

                      <td className="p-3">

                        <div className="flex flex-col gap-2">

                          {item.check_in_latitude != null &&
                          item.check_in_longitude != null ? (
                            <button
                              type="button"
                              onClick={() =>
                                openLocation(
                                  item.check_in_latitude,
                                  item.check_in_longitude
                                )
                              }
                              className="text-blue-600 hover:underline text-left text-sm"
                            >
                              📍 Check In Location
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              Check In: --
                            </span>
                          )}

                          {item.check_out_latitude != null &&
                          item.check_out_longitude != null ? (
                            <button
                              type="button"
                              onClick={() =>
                                openLocation(
                                  item.check_out_latitude,
                                  item.check_out_longitude
                                )
                              }
                              className="text-blue-600 hover:underline text-left text-sm"
                            >
                              📍 Check Out Location
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              Check Out: --
                            </span>
                          )}

                        </div>

                      </td>

                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={6}
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
      {/* WFH */}
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
                              ? "text-green-700"
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