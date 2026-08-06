"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface Employee {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  designation: string | null;
}

interface SalesPerformance {
  id: string;
  employee_id: string;

  performance_date: string | null;

  month: number;
  week_number: number;
  year: number;

  target: number;
  completed: number;

  remaining_time: string | null;

  file_name: string | null;
  file_path: string | null;

  created_at: string;
  updated_at: string;
}

interface PerformanceRow extends SalesPerformance {
  employee: Employee | null;
}

const MONTHS = [
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

export default function AdminSalesPerformancePage() {
  const [loading, setLoading] = useState(true);

  const [records, setRecords] = useState<PerformanceRow[]>([]);

  const [search, setSearch] = useState("");

  const [monthFilter, setMonthFilter] = useState("All");

  const [yearFilter, setYearFilter] = useState("All");

  const [weekFilter, setWeekFilter] = useState("All");

  const [selectedRecord, setSelectedRecord] =
    useState<PerformanceRow | null>(null);

  const [showModal, setShowModal] = useState(false);

  /*
   * ---------------------------------------------------------
   * LOAD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    void loadPerformance();
  }, []);

  async function loadPerformance() {
    setLoading(true);

    try {
      /*
       * Load weekly sales records
       */

      const {
        data: performanceData,
        error: performanceError,
      } = await supabase
        .from("sales_performance")
        .select(
          `
            id,
            employee_id,
            performance_date,
            month,
            week_number,
            year,
            target,
            completed,
            remaining_time,
            file_name,
            file_path,
            created_at,
            updated_at
          `
        )
        .order("year", {
          ascending: false,
        })
        .order("month", {
          ascending: false,
        })
        .order("week_number", {
          ascending: false,
        });

      if (performanceError) {
        console.error(
          "Sales Performance Error:",
          performanceError
        );

        alert(
          `Unable to load sales performance: ${performanceError.message}`
        );

        setRecords([]);
        return;
      }

      const performances =
        (performanceData ?? []) as SalesPerformance[];

      if (performances.length === 0) {
        setRecords([]);
        return;
      }

      /*
       * Get unique employee ids
       */

      const employeeIds = [
        ...new Set(
          performances
            .map((record) => record.employee_id)
            .filter(Boolean)
        ),
      ];

      let employees: Employee[] = [];

      /*
       * Load employees
       */

      if (employeeIds.length > 0) {
        const {
          data: employeeData,
          error: employeeError,
        } = await supabase
          .from("employees")
          .select(
            `
              id,
              full_name,
              email,
              department,
              designation
            `
          )
          .in("id", employeeIds);

        if (employeeError) {
          console.error(
            "Employee Load Error:",
            employeeError
          );
        } else {
          employees =
            (employeeData ?? []) as Employee[];
        }
      }

      /*
       * Create employee lookup map
       */

      const employeeMap = new Map<
        string,
        Employee
      >();

      employees.forEach((employee) => {
        employeeMap.set(employee.id, employee);
      });

      /*
       * Join employee with performance
       */

      const rows: PerformanceRow[] =
        performances.map((record) => ({
          ...record,

          employee:
            employeeMap.get(record.employee_id) ??
            null,
        }));

      setRecords(rows);
    } catch (error) {
      console.error(
        "Admin Sales Performance Error:",
        error
      );

      alert("Something went wrong while loading.");
    } finally {
      setLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * VIEW FILE
   * ---------------------------------------------------------
   */

  async function viewFile(
    filePath: string | null
  ) {
    if (!filePath) {
      alert("No file uploaded.");
      return;
    }

    const { data, error } =
      await supabase.storage
        .from("sales-performance-files")
        .createSignedUrl(filePath, 60);

    if (error) {
      console.error(
        "File View Error:",
        error
      );

      alert(
        `Unable to open file: ${error.message}`
      );

      return;
    }

    if (!data?.signedUrl) {
      alert("Unable to generate file URL.");
      return;
    }

    window.open(
      data.signedUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /*
   * ---------------------------------------------------------
   * MODAL
   * ---------------------------------------------------------
   */

  function openDetails(
    record: PerformanceRow
  ) {
    setSelectedRecord(record);
    setShowModal(true);
  }

  function closeDetails() {
    setShowModal(false);
    setSelectedRecord(null);
  }

  /*
   * ---------------------------------------------------------
   * YEARS
   * ---------------------------------------------------------
   */

  const availableYears = useMemo(() => {
    return [
      ...new Set(
        records.map((record) =>
          Number(record.year)
        )
      ),
    ].sort((a, b) => b - a);
  }, [records]);

  /*
   * ---------------------------------------------------------
   * FILTERED RECORDS
   * ---------------------------------------------------------
   */

  const filteredRecords = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return records.filter((record) => {
      const employeeName =
        record.employee?.full_name
          ?.toLowerCase() ?? "";

      const employeeEmail =
        record.employee?.email
          ?.toLowerCase() ?? "";

      const department =
        record.employee?.department
          ?.toLowerCase() ?? "";

      const designation =
        record.employee?.designation
          ?.toLowerCase() ?? "";

      /*
       * Search
       */

      const matchesSearch =
        !searchValue ||
        employeeName.includes(searchValue) ||
        employeeEmail.includes(searchValue) ||
        department.includes(searchValue) ||
        designation.includes(searchValue);

      /*
       * Month
       */

      const matchesMonth =
        monthFilter === "All" ||
        Number(record.month) ===
          Number(monthFilter);

      /*
       * Year
       */

      const matchesYear =
        yearFilter === "All" ||
        Number(record.year) ===
          Number(yearFilter);

      /*
       * Week
       */

      const matchesWeek =
        weekFilter === "All" ||
        Number(record.week_number) ===
          Number(weekFilter);

      return (
        matchesSearch &&
        matchesMonth &&
        matchesYear &&
        matchesWeek
      );
    });
  }, [
    records,
    search,
    monthFilter,
    yearFilter,
    weekFilter,
  ]);

  /*
   * ---------------------------------------------------------
   * SUMMARY
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   *
   * Target is MONTHLY.
   * Completed is WEEKLY.
   *
   * Example:
   *
   * August Target = 100000
   *
   * Week 1 = 10000
   * Week 2 = 20000
   * Week 3 = 15000
   *
   * Correct:
   *
   * Target = 100000
   * Completed = 45000
   * Pending = 55000
   *
   * NOT:
   *
   * Target = 300000
   */

  const summary = useMemo(() => {
    /*
     * One monthly target per:
     *
     * employee + month + year
     */

    const monthlyTargetMap =
      new Map<string, number>();

    let totalCompleted = 0;

    filteredRecords.forEach((record) => {
      const employeeId =
        record.employee_id;

      const month =
        Number(record.month);

      const year =
        Number(record.year);

      const target =
        Number(record.target) || 0;

      const completed =
        Number(record.completed) || 0;

      const monthlyKey =
        `${employeeId}-${year}-${month}`;

      /*
       * Add monthly target only once.
       */

      if (
        !monthlyTargetMap.has(monthlyKey)
      ) {
        monthlyTargetMap.set(
          monthlyKey,
          target
        );
      }

      /*
       * Weekly completed gets added.
       */

      totalCompleted += completed;
    });

    let totalTarget = 0;

    monthlyTargetMap.forEach((target) => {
      totalTarget += target;
    });

    const totalPending = Math.max(
      totalTarget - totalCompleted,
      0
    );

    const achievement =
      totalTarget > 0
        ? Math.round(
            (totalCompleted / totalTarget) *
              100
          )
        : 0;

    return {
      totalTarget,
      totalCompleted,
      totalPending,
      achievement,
    };
  }, [filteredRecords]);

  /*
   * ---------------------------------------------------------
   * SELECTED MONTH STATS
   * ---------------------------------------------------------
   *
   * Modal should show monthly total completed,
   * not only the selected week's completed.
   */

  const selectedMonthlyStats = useMemo(() => {
    if (!selectedRecord) {
      return {
        target: 0,
        completed: 0,
        pending: 0,
        achievement: 0,
      };
    }

    const sameMonthRecords =
      records.filter(
        (record) =>
          record.employee_id ===
            selectedRecord.employee_id &&
          Number(record.month) ===
            Number(selectedRecord.month) &&
          Number(record.year) ===
            Number(selectedRecord.year)
      );

    const target =
      Number(selectedRecord.target) || 0;

    const completed =
      sameMonthRecords.reduce(
        (sum, record) =>
          sum +
          (Number(record.completed) || 0),
        0
      );

    const pending = Math.max(
      target - completed,
      0
    );

    const achievement =
      target > 0
        ? Math.round(
            (completed / target) * 100
          )
        : 0;

    return {
      target,
      completed,
      pending,
      achievement,
    };
  }, [selectedRecord, records]);

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="p-8">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <p className="text-lg font-semibold">
            Loading Sales Performance...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <>
      <div className="space-y-8 p-8">
        {/* HEADER */}

        <div>
          <h1 className="text-3xl font-bold">
            Sales Performance
          </h1>

          <p className="mt-1 text-gray-500">
            View employee weekly sales
            performance and monthly progress.
          </p>
        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Target"
            value={summary.totalTarget}
            color="text-violet-600"
          />

          <SummaryCard
            title="Completed"
            value={summary.totalCompleted}
            color="text-green-600"
          />

          <SummaryCard
            title="Pending"
            value={summary.totalPending}
            color="text-orange-500"
          />

          <SummaryCard
            title="Achievement"
            value={`${summary.achievement}%`}
            color="text-blue-600"
          />
        </div>

        {/* FILTERS */}

        <div className="rounded-xl bg-white p-5 shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* SEARCH */}

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search employee..."
              className="w-full rounded-lg border p-3"
            />

            {/* MONTH */}

            <select
              value={monthFilter}
              onChange={(e) =>
                setMonthFilter(e.target.value)
              }
              className="w-full rounded-lg border p-3"
            >
              <option value="All">
                All Months
              </option>

              {MONTHS.map(
                (month, index) => (
                  <option
                    key={month}
                    value={index + 1}
                  >
                    {month}
                  </option>
                )
              )}
            </select>

            {/* WEEK */}

            <select
              value={weekFilter}
              onChange={(e) =>
                setWeekFilter(e.target.value)
              }
              className="w-full rounded-lg border p-3"
            >
              <option value="All">
                All Weeks
              </option>

              {[1, 2, 3, 4, 5].map(
                (week) => (
                  <option
                    key={week}
                    value={week}
                  >
                    Week {week}
                  </option>
                )
              )}
            </select>

            {/* YEAR */}

            <select
              value={yearFilter}
              onChange={(e) =>
                setYearFilter(e.target.value)
              }
              className="w-full rounded-lg border p-3"
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

        {/* TABLE */}

        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="border-b p-6">
            <h2 className="text-xl font-bold">
              Employee Performance
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredRecords.length}{" "}
              weekly report(s) found
            </p>
          </div>

          <div className="w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left">
                    Employee
                  </th>

                  <th className="p-4 text-left">
                    Month
                  </th>

                  <th className="p-4 text-center">
                    Week
                  </th>

                  <th className="p-4 text-center">
                    Year
                  </th>

                  <th className="p-4 text-right">
                    Monthly Target
                  </th>

                  <th className="p-4 text-right">
                    Completed
                  </th>

                  <th className="p-4 text-left">
                    Remaining Time
                  </th>

                  <th className="p-4 text-left">
                    File
                  </th>

                  <th className="p-4 text-center">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-gray-500"
                    >
                      No sales performance
                      records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(
                    (record) => {
                      const target =
                        Number(
                          record.target
                        ) || 0;

                      const completed =
                        Number(
                          record.completed
                        ) || 0;

                      return (
                        <tr
                          key={record.id}
                          className="border-t hover:bg-gray-50"
                        >
                          {/* EMPLOYEE */}

                          <td className="p-4">
                            <div className="font-semibold">
                              {record
                                .employee
                                ?.full_name ||
                                "Unknown Employee"}
                            </div>

                            <div className="text-sm text-gray-500">
                              {record
                                .employee
                                ?.email ||
                                "-"}
                            </div>

                            {record
                              .employee
                              ?.department && (
                              <div className="mt-1 text-xs text-gray-400">
                                {
                                  record
                                    .employee
                                    .department
                                }
                              </div>
                            )}
                          </td>

                          {/* MONTH */}

                          <td className="p-4 font-medium">
                            {MONTHS[
                              Number(
                                record.month
                              ) - 1
                            ] || "-"}
                          </td>

                          {/* WEEK */}

                          <td className="p-4 text-center font-semibold">
                            Week{" "}
                            {
                              record.week_number
                            }
                          </td>

                          {/* YEAR */}

                          <td className="p-4 text-center">
                            {record.year}
                          </td>

                          {/* TARGET */}

                          <td className="p-4 text-right font-semibold">
                            {target.toLocaleString()}
                          </td>

                          {/* COMPLETED */}

                          <td className="p-4 text-right">
                            <span className="font-semibold text-green-600">
                              {completed.toLocaleString()}
                            </span>
                          </td>

                          {/* REMAINING */}

                          <td className="p-4">
                            {record.remaining_time ||
                              "-"}
                          </td>

                          {/* FILE */}

                          <td className="p-4">
                            {record.file_path ? (
                              <button
                                type="button"
                                onClick={() =>
                                  viewFile(
                                    record.file_path
                                  )
                                }
                                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                              >
                                View Excel
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">
                                No File
                              </span>
                            )}
                          </td>

                          {/* ACTION */}

                          <td className="p-4">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  openDetails(
                                    record
                                  )
                                }
                                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                              >
                                View
                              </button>
                            </div>
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

      {/* DETAILS MODAL */}

      {showModal && selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeDetails}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Performance Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {MONTHS[
                    Number(
                      selectedRecord.month
                    ) - 1
                  ] || "-"}{" "}
                  {selectedRecord.year} • Week{" "}
                  {
                    selectedRecord.week_number
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="text-3xl leading-none text-gray-400 hover:text-black"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* EMPLOYEE */}

              <div className="mb-6 rounded-xl bg-gray-50 p-5">
                <h3 className="mb-4 text-lg font-bold">
                  Employee
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Detail
                    label="Name"
                    value={
                      selectedRecord
                        .employee
                        ?.full_name || "-"
                    }
                  />

                  <Detail
                    label="Email"
                    value={
                      selectedRecord
                        .employee?.email ||
                      "-"
                    }
                  />

                  <Detail
                    label="Department"
                    value={
                      selectedRecord
                        .employee
                        ?.department || "-"
                    }
                  />

                  <Detail
                    label="Designation"
                    value={
                      selectedRecord
                        .employee
                        ?.designation || "-"
                    }
                  />
                </div>
              </div>

              {/* REPORT INFO */}

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MiniCard
                  title="Month"
                  value={
                    MONTHS[
                      Number(
                        selectedRecord.month
                      ) - 1
                    ] || "-"
                  }
                  color="text-violet-600"
                />

                <MiniCard
                  title="Week"
                  value={`Week ${selectedRecord.week_number}`}
                  color="text-blue-600"
                />

                <MiniCard
                  title="Year"
                  value={
                    selectedRecord.year
                  }
                  color="text-gray-900"
                />
              </div>

              {/* SELECTED WEEK */}

              <h3 className="mb-3 text-lg font-bold">
                Weekly Report
              </h3>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MiniCard
                  title="Monthly Target"
                  value={Number(
                    selectedRecord.target
                  ).toLocaleString()}
                  color="text-violet-600"
                />

                <MiniCard
                  title={`Week ${selectedRecord.week_number} Completed`}
                  value={Number(
                    selectedRecord.completed
                  ).toLocaleString()}
                  color="text-green-600"
                />
              </div>

              {/* MONTHLY PROGRESS */}

              <h3 className="mb-3 text-lg font-bold">
                Monthly Progress
              </h3>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MiniCard
                  title="Target"
                  value={selectedMonthlyStats.target.toLocaleString()}
                  color="text-violet-600"
                />

                <MiniCard
                  title="Total Completed"
                  value={selectedMonthlyStats.completed.toLocaleString()}
                  color="text-green-600"
                />

                <MiniCard
                  title="Pending"
                  value={selectedMonthlyStats.pending.toLocaleString()}
                  color="text-orange-600"
                />
              </div>

              {/* ACHIEVEMENT */}

              <div className="mb-6 rounded-xl bg-blue-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Monthly Achievement
                    </p>

                    <p className="mt-1 text-3xl font-bold text-blue-600">
                      {
                        selectedMonthlyStats.achievement
                      }
                      %
                    </p>
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    {
                      selectedMonthlyStats.completed
                    .toLocaleString()}
                    {" / "}
                    {
                      selectedMonthlyStats.target
                    .toLocaleString()}
                  </div>
                </div>

                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-blue-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                      width: `${Math.min(
                        selectedMonthlyStats.achievement,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* EXTRA DETAILS */}

              <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Detail
                  label="Remaining Time"
                  value={
                    selectedRecord.remaining_time ||
                    "-"
                  }
                />

                <Detail
                  label="Uploaded File"
                  value={
                    selectedRecord.file_name ||
                    "No file"
                  }
                />

                <Detail
                  label="Performance Date"
                  value={
                    selectedRecord.performance_date ||
                    "-"
                  }
                />
              </div>

              {/* FILE */}

              {selectedRecord.file_path && (
                <button
                  type="button"
                  onClick={() =>
                    viewFile(
                      selectedRecord.file_path
                    )
                  }
                  className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700"
                >
                  View Uploaded Excel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/*
 * ---------------------------------------------------------
 * SUMMARY CARD
 * ---------------------------------------------------------
 */

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-lg">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2
        className={`mt-2 text-3xl font-bold ${color}`}
      >
        {typeof value === "number"
          ? value.toLocaleString()
          : value}
      </h2>
    </div>
  );
}

/*
 * ---------------------------------------------------------
 * MINI CARD
 * ---------------------------------------------------------
 */

function MiniCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-xl border p-5">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p
        className={`mt-1 text-2xl font-bold ${color}`}
      >
        {typeof value === "number"
          ? value.toLocaleString()
          : value}
      </p>
    </div>
  );
}

/*
 * ---------------------------------------------------------
 * DETAIL
 * ---------------------------------------------------------
 */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words font-semibold">
        {value}
      </p>
    </div>
  );
}