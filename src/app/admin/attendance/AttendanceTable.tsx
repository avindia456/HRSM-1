"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapPin } from "lucide-react";

const supabase = createClient();

// =========================================================
// TYPES
// =========================================================

interface AttendanceRecord {
  id: string;
  employee_id: string;
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

interface Employee {
  id: string;
  full_name: string;
  email: string;
}

// =========================================================
// COMPONENT
// =========================================================

export default function AttendanceTable() {
  const [loading, setLoading] =
    useState(true);

  const [records, setRecords] =
    useState<AttendanceRecord[]>([]);

  const [employees, setEmployees] =
    useState<Record<string, Employee>>({});

  const [search, setSearch] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState("");

  // =========================================================
  // CALCULATE WORKING HOURS
  // =========================================================

  function calculateWorkingHours(
    checkIn: string | null,
    checkOut: string | null
  ) {
    if (!checkIn || !checkOut) {
      return "--";
    }

    const [inH, inM, inS] =
      checkIn
        .split(":")
        .map(Number);

    const [outH, outM, outS] =
      checkOut
        .split(":")
        .map(Number);

    const inTime =
      new Date();

    inTime.setHours(
      inH,
      inM,
      inS,
      0
    );

    const outTime =
      new Date();

    outTime.setHours(
      outH,
      outM,
      outS,
      0
    );

    const diff =
      outTime.getTime() -
      inTime.getTime();

    if (diff <= 0) {
      return "--";
    }

    const hours =
      Math.floor(
        diff /
          (1000 * 60 * 60)
      );

    const minutes =
      Math.floor(
        (diff %
          (1000 * 60 * 60)) /
          (1000 * 60)
      );

    return `${hours}h ${minutes}m`;
  }

  // =========================================================
  // OPEN LOCATION
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

    window.open(
      `https://www.google.com/maps?q=${latitude},${longitude}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // LOAD DATA
  // =========================================================

  async function loadData() {
    setLoading(true);

    try {
      // =====================================================
      // EMPLOYEES
      // =====================================================

      const {
        data: employeeData,
        error: employeeError,
      } = await supabase
        .from("employees")
        .select(
          "id, full_name, email"
        );

      if (employeeError) {
        console.error(
          "Employee Load Error:",
          employeeError
        );
      }

      const employeeMap:
        Record<string, Employee> = {};

      employeeData?.forEach(
        (emp: Employee) => {
          employeeMap[emp.id] =
            emp;
        }
      );

      setEmployees(
        employeeMap
      );

      // =====================================================
      // ATTENDANCE
      // =====================================================

      const {
        data: attendanceData,
        error: attendanceError,
      } = await supabase
        .from("attendance")
        .select("*")
        .order(
          "attendance_date",
          {
            ascending: false,
          }
        );

      if (attendanceError) {
        console.error(
          "Attendance Load Error:",
          attendanceError
        );
      }

      setRecords(
        attendanceData || []
      );
    } catch (error) {
      console.error(
        "Load Data Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // FILTER
  // =========================================================

  const filteredRecords =
    useMemo(() => {
      return records.filter(
        (record) => {
          const employee =
            employees[
              record.employee_id
            ];

          const matchesSearch =
            !search ||
            employee?.full_name
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            employee?.email
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              );

          const matchesDate =
            !selectedDate ||
            record.attendance_date ===
              selectedDate;

          return (
            matchesSearch &&
            matchesDate
          );
        }
      );
    }, [
      records,
      employees,
      search,
      selectedDate,
    ]);

  // =========================================================
  // TODAY SUMMARY
  // =========================================================

  function getToday() {
    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        now.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const today =
    getToday();

  const todayRecords =
    records.filter(
      (record) =>
        record.attendance_date ===
        today
    );

  const presentCount =
    todayRecords.filter(
      (record) =>
        record.status ===
        "Present"
    ).length;

  const workingCount =
    todayRecords.filter(
      (record) =>
        record.status ===
        "Working"
    ).length;

  const lateCount =
    todayRecords.filter(
      (record) =>
        record.late_mark
    ).length;

  const totalCount =
    todayRecords.length;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        Loading attendance...
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-6">

      {/* ================================================= */}
      {/* SUMMARY CARDS */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* PRESENT */}

        <div className="rounded-xl p-5 text-green-700">
          <p className="text-gray-600">
            Present
          </p>

          <h2 className="text-3xl font-bold text-green-700">
            {presentCount}
          </h2>
        </div>

        {/* WORKING */}

        <div className="bg-blue-100 rounded-xl p-5">
          <p className="text-gray-600">
            Working
          </p>

          <h2 className="text-3xl font-bold text-blue-700">
            {workingCount}
          </h2>
        </div>

        {/* LATE */}

        <div className="bg-red-100 rounded-xl p-5">
          <p className="text-gray-600">
            Late
          </p>

          <h2 className="text-3xl font-bold text-red-700">
            {lateCount}
          </h2>
        </div>

        {/* TOTAL */}

        <div className="bg-gray-100 rounded-xl p-5">
          <p className="text-gray-600">
            Total Attendance
          </p>

          <h2 className="text-3xl font-bold text-gray-700">
            {totalCount}
          </h2>
        </div>

      </div>

      {/* ================================================= */}
      {/* FILTERS */}
      {/* ================================================= */}

      <div className="bg-white rounded-xl shadow-lg p-5 flex flex-col md:flex-row gap-4">

        <input
          type="text"
          placeholder="Search Employee..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="border rounded-lg px-4 py-2 flex-1"
        />

        <input
          type="date"
          value={
            selectedDate
          }
          onChange={(e) =>
            setSelectedDate(
              e.target.value
            )
          }
          className="border rounded-lg px-4 py-2"
        />

        {selectedDate && (
          <button
            type="button"
            onClick={() =>
              setSelectedDate("")
            }
            className="border rounded-lg px-4 py-2 hover:bg-gray-100"
          >
            Clear Date
          </button>
        )}

      </div>

      {/* ================================================= */}
      {/* ATTENDANCE TABLE */}
      {/* ================================================= */}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">

        <div className="p-6 border-b">

          <h2 className="text-2xl font-bold">
            Attendance Records
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            View employee check-in and check-out details with recorded locations.
          </p>

        </div>


            <div className="w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[900px]">

            {/* ============================================= */}
            {/* TABLE HEADER */}
            {/* ============================================= */}

            <thead className="bg-gray-100">

              <tr>

                <th className="text-left p-4">
                  Employee
                </th>

                <th className="text-left p-4">
                  Date
                </th>

                <th className="text-left p-4">
                  Check In
                </th>

                <th className="text-left p-4">
                  Check-In Location
                </th>

                <th className="text-left p-4">
                  Check Out
                </th>

                <th className="text-left p-4">
                  Check-Out Location
                </th>

                <th className="text-left p-4">
                  Working Hours
                </th>

                <th className="text-left p-4">
                  Late
                </th>

                <th className="text-left p-4">
                  Status
                </th>

              </tr>

            </thead>

            {/* ============================================= */}
            {/* TABLE BODY */}
            {/* ============================================= */}

            <tbody>

              {filteredRecords.length ===
              0 ? (

                <tr>

                  <td
                    colSpan={9}
                    className="text-center py-10 text-gray-500"
                  >
                    No attendance found.
                  </td>

                </tr>

              ) : (

                filteredRecords.map(
                  (record) => {

                    const employee =
                      employees[
                        record.employee_id
                      ];

                    return (

                      <tr
                        key={
                          record.id
                        }
                        className="border-t hover:bg-gray-50"
                      >

                        {/* EMPLOYEE */}

                        <td className="p-4">

                          <div className="font-semibold">
                            {employee?.full_name ||
                              "Unknown Employee"}
                          </div>

                          <div className="text-sm text-gray-500">
                            {employee?.email ||
                              "--"}
                          </div>

                        </td>

                        {/* DATE */}

                        <td className="p-4 whitespace-nowrap">

                          {new Date(
                            `${record.attendance_date}T00:00:00`
                          ).toLocaleDateString(
                            "en-GB"
                          )}

                        </td>

                        {/* CHECK IN */}

                        <td className="p-4 whitespace-nowrap">

                          <div className="font-medium">
                            {record.check_in ||
                              "--"}
                          </div>

                        </td>

                        {/* CHECK IN LOCATION */}

                        <td className="p-4">

                          {record.check_in_latitude !=
                            null &&
                          record.check_in_longitude !=
                            null ? (

                            <button
                              type="button"
                              onClick={() =>
                                openLocation(
                                  record.check_in_latitude,
                                  record.check_in_longitude
                                )
                              }
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                            >

                              <MapPin className="w-4 h-4" />

                              View Location

                            </button>

                          ) : (

                            <span className="text-gray-400">
                              --
                            </span>

                          )}

                        </td>

                        {/* CHECK OUT */}

                        <td className="p-4 whitespace-nowrap">

                          <div className="font-medium">
                            {record.check_out ||
                              "--"}
                          </div>

                        </td>

                        {/* CHECK OUT LOCATION */}

                        <td className="p-4">

                          {record.check_out_latitude !=
                            null &&
                          record.check_out_longitude !=
                            null ? (

                            <button
                              type="button"
                              onClick={() =>
                                openLocation(
                                  record.check_out_latitude,
                                  record.check_out_longitude
                                )
                              }
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                            >

                              <MapPin className="w-4 h-4" />

                              View Location

                            </button>

                          ) : (

                            <span className="text-gray-400">
                              --
                            </span>

                          )}

                        </td>

                        {/* WORKING HOURS */}

                        <td className="p-4 whitespace-nowrap">

                          <span className="font-medium text-gray-700">
                            {calculateWorkingHours(
                              record.check_in,
                              record.check_out
                            )}
                          </span>

                        </td>

                        {/* LATE */}

                        <td className="p-4">

                          <span
                            className={`px-3 py-1 rounded-full text-white text-xs whitespace-nowrap ${
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

                        {/* STATUS */}

                        <td className="p-4">

                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                              record.status ===
                              "Present"
                                ? "text-green-700"
                                : record.status ===
                                  "Working"
                                ? "bg-blue-100 text-blue-700"
                                : record.status ===
                                  "WFH"
                                ? "bg-orange-100 text-orange-700"
                                : record.status ===
                                  "Half Day"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >

                            {record.status}

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