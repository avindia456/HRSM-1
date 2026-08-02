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
  month: number;
  year: number;
  target: number;
  completed: number;
  pending_target: number;
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

  const [selectedRecord, setSelectedRecord] =
    useState<PerformanceRow | null>(null);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadPerformance();
  }, []);

  async function loadPerformance() {
    setLoading(true);

    try {
      const {
        data: performanceData,
        error: performanceError,
      } = await supabase
        .from("sales_performance")
        .select("*")
        .order("year", {
          ascending: false,
        })
        .order("month", {
          ascending: false,
        });

      if (performanceError) {
        console.error(
          "Sales Performance Error:",
          performanceError
        );

        setLoading(false);
        return;
      }

      const performances =
        (performanceData || []) as SalesPerformance[];

      if (performances.length === 0) {
        setRecords([]);
        setLoading(false);
        return;
      }

      const employeeIds = [
        ...new Set(
          performances
            .map((record) => record.employee_id)
            .filter(Boolean)
        ),
      ];

      let employees: Employee[] = [];

      if (employeeIds.length > 0) {
        const {
          data: employeeData,
          error: employeeError,
        } = await supabase
          .from("employees")
          .select(
            "id, full_name, email, department, designation"
          )
          .in("id", employeeIds);

        if (employeeError) {
          console.error(
            "Employee Load Error:",
            employeeError
          );
        } else {
          employees = (employeeData || []) as Employee[];
        }
      }

      const rows: PerformanceRow[] =
        performances.map((record) => ({
          ...record,

          employee:
            employees.find(
              (employee) =>
                employee.id === record.employee_id
            ) || null,
        }));

      setRecords(rows);
    } catch (error) {
      console.error(
        "Admin Sales Performance Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

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

      alert(error.message);
      return;
    }

    if (!data?.signedUrl) {
      alert("Unable to open file.");
      return;
    }

    window.open(
      data.signedUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

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

  const availableYears = useMemo(() => {
    return [
      ...new Set(
        records.map((record) => record.year)
      ),
    ].sort((a, b) => b - a);
  }, [records]);

  const filteredRecords = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return records.filter((record) => {
      const employeeName =
        record.employee?.full_name
          ?.toLowerCase() || "";

      const employeeEmail =
        record.employee?.email
          ?.toLowerCase() || "";

      const department =
        record.employee?.department
          ?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        employeeName.includes(searchValue) ||
        employeeEmail.includes(searchValue) ||
        department.includes(searchValue);

      const matchesMonth =
        monthFilter === "All" ||
        record.month === Number(monthFilter);

      const matchesYear =
        yearFilter === "All" ||
        record.year === Number(yearFilter);

      return (
        matchesSearch &&
        matchesMonth &&
        matchesYear
      );
    });
  }, [
    records,
    search,
    monthFilter,
    yearFilter,
  ]);

  const summary = useMemo(() => {
    const totalTarget =
      filteredRecords.reduce(
        (sum, record) =>
          sum + Number(record.target || 0),
        0
      );

    const totalCompleted =
      filteredRecords.reduce(
        (sum, record) =>
          sum + Number(record.completed || 0),
        0
      );

    const totalPending = Math.max(
      totalTarget - totalCompleted,
      0
    );

    const achievement =
      totalTarget > 0
        ? Math.round(
            (totalCompleted / totalTarget) * 100
          )
        : 0;

    return {
      totalTarget,
      totalCompleted,
      totalPending,
      achievement,
    };
  }, [filteredRecords]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <p className="text-lg font-semibold">
            Loading Sales Performance...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 p-8">

        {/* HEADER */}

        <div>
          <h1 className="text-3xl font-bold">
            Sales Performance
          </h1>

          <p className="text-gray-500 mt-1">
            View employee monthly sales performance
            and uploaded reports.
          </p>
        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

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

        <div className="bg-white rounded-xl shadow p-5">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search employee..."
              className="border rounded-lg p-3 w-full"
            />

            <select
              value={monthFilter}
              onChange={(e) =>
                setMonthFilter(e.target.value)
              }
              className="border rounded-lg p-3 w-full"
            >
              <option value="All">
                All Months
              </option>

              {MONTHS.map((month, index) => (
                <option
                  key={month}
                  value={index + 1}
                >
                  {month}
                </option>
              ))}
            </select>

            <select
              value={yearFilter}
              onChange={(e) =>
                setYearFilter(e.target.value)
              }
              className="border rounded-lg p-3 w-full"
            >
              <option value="All">
                All Years
              </option>

              {availableYears.map((year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}
            </select>

          </div>

        </div>

        {/* TABLE */}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">

          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">
              Employee Performance
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {filteredRecords.length} record(s)
              found
            </p>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>
                  <th className="p-4 text-left">
                    Employee
                  </th>

                  <th className="p-4 text-left">
                    Month
                  </th>

                  <th className="p-4 text-left">
                    Target
                  </th>

                  <th className="p-4 text-left">
                    Completed
                  </th>

                  <th className="p-4 text-left">
                    Pending
                  </th>

                  <th className="p-4 text-left">
                    Achievement
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

                {filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-12 text-gray-500"
                    >
                      No sales performance records
                      found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(
                    (record) => {
                      const target =
                        Number(record.target) || 0;

                      const completed =
                        Number(record.completed) || 0;

                      const pending = Math.max(
                        target - completed,
                        0
                      );

                      const achievement =
                        target > 0
                          ? Math.round(
                              (completed /
                                target) *
                                100
                            )
                          : 0;

                      return (
                        <tr
                          key={record.id}
                          className="border-t hover:bg-gray-50"
                        >

                          <td className="p-4">

                            <div className="font-semibold">
                              {record.employee
                                ?.full_name ||
                                "Unknown Employee"}
                            </div>

                            <div className="text-sm text-gray-500">
                              {record.employee
                                ?.email || "-"}
                            </div>

                            {record.employee
                              ?.department && (
                              <div className="text-xs text-gray-400 mt-1">
                                {
                                  record.employee
                                    .department
                                }
                              </div>
                            )}

                          </td>

                          <td className="p-4 font-medium">
                            {MONTHS[
                              record.month - 1
                            ] || "-"}{" "}
                            {record.year}
                          </td>

                          <td className="p-4 font-semibold">
                            {target}
                          </td>

                          <td className="p-4">
                            <span className="font-semibold text-green-600">
                              {completed}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="font-semibold text-orange-600">
                              {pending}
                            </span>
                          </td>

                          <td className="p-4">

                            <div className="min-w-[110px]">

                              <div className="font-semibold text-blue-600 mb-2">
                                {achievement}%
                              </div>

                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">

                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      achievement,
                                      100
                                    )}%`,
                                  }}
                                />

                              </div>

                            </div>

                          </td>

                          <td className="p-4">

                            {record.file_path ? (
                              <button
                                type="button"
                                onClick={() =>
                                  viewFile(
                                    record.file_path
                                  )
                                }
                                className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                              >
                                View Excel
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">
                                No File
                              </span>
                            )}

                          </td>

                          <td className="p-4">

                            <div className="flex justify-center">

                              <button
                                type="button"
                                onClick={() =>
                                  openDetails(record)
                                }
                                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700"
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
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={closeDetails}
        >

          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between p-6 border-b">

              <div>
                <h2 className="text-2xl font-bold">
                  Performance Details
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  {MONTHS[
                    selectedRecord.month - 1
                  ]}{" "}
                  {selectedRecord.year}
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

            {/* EMPLOYEE */}

            <div className="p-6">

              <div className="bg-gray-50 rounded-xl p-5 mb-6">

                <h3 className="font-bold text-lg mb-4">
                  Employee
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <Detail
                    label="Name"
                    value={
                      selectedRecord.employee
                        ?.full_name || "-"
                    }
                  />

                  <Detail
                    label="Email"
                    value={
                      selectedRecord.employee
                        ?.email || "-"
                    }
                  />

                  <Detail
                    label="Department"
                    value={
                      selectedRecord.employee
                        ?.department || "-"
                    }
                  />

                  <Detail
                    label="Designation"
                    value={
                      selectedRecord.employee
                        ?.designation || "-"
                    }
                  />

                </div>

              </div>

              {/* PERFORMANCE */}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

                <MiniCard
                  title="Target"
                  value={Number(
                    selectedRecord.target
                  )}
                  color="text-violet-600"
                />

                <MiniCard
                  title="Completed"
                  value={Number(
                    selectedRecord.completed
                  )}
                  color="text-green-600"
                />

                <MiniCard
                  title="Pending"
                  value={Math.max(
                    Number(
                      selectedRecord.target
                    ) -
                      Number(
                        selectedRecord.completed
                      ),
                    0
                  )}
                  color="text-orange-600"
                />

              </div>

              <div className="bg-blue-50 rounded-xl p-5 mb-6">

                <p className="text-sm text-gray-500">
                  Achievement
                </p>

                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {Number(
                    selectedRecord.target
                  ) > 0
                    ? Math.round(
                        (Number(
                          selectedRecord.completed
                        ) /
                          Number(
                            selectedRecord.target
                          )) *
                          100
                      )
                    : 0}
                  %
                </p>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

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

              </div>

              {selectedRecord.file_path && (
                <button
                  type="button"
                  onClick={() =>
                    viewFile(
                      selectedRecord.file_path
                    )
                  }
                  className="w-full bg-green-600 text-white rounded-lg py-3 font-semibold hover:bg-green-700"
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
    <div className="bg-white rounded-xl shadow-lg p-6">
      <p className="text-gray-500 text-sm">
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
    <div className="border rounded-xl p-5">
      <p className="text-gray-500 text-sm">
        {title}
      </p>

      <p
        className={`text-2xl font-bold mt-1 ${color}`}
      >
        {value}
      </p>
    </div>
  );
}

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

      <p className="font-semibold mt-1 break-words">
        {value}
      </p>
    </div>
  );
}