"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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

interface Employee {
  id: string;
  full_name?: string;
  email?: string;
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

export default function SalesPerformancePage() {
  const today = new Date();

  const [pageLoading, setPageLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [history, setHistory] =
    useState<SalesPerformance[]>([]);

  const [selectedMonth, setSelectedMonth] =
    useState(today.getMonth() + 1);

  const [selectedYear, setSelectedYear] =
    useState(today.getFullYear());

  const [target, setTarget] =
    useState("");

  const [completed, setCompleted] =
    useState("");

  const [remainingTime, setRemainingTime] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  useEffect(() => {
    initializePage();
  }, []);

  async function initializePage() {
    setPageLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "User Error:",
        userError
      );

      setPageLoading(false);
      return;
    }

    if (!user) {
      setPageLoading(false);
      return;
    }

    let employeeData: Employee | null =
      null;

    const {
      data: employeeByAuth,
      error: authEmployeeError,
    } = await supabase
      .from("employees")
      .select("id, full_name, email")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (
      !authEmployeeError &&
      employeeByAuth
    ) {
      employeeData = employeeByAuth;
    }

    if (
      !employeeData &&
      user.email
    ) {
      const {
        data: employeeByEmail,
        error: emailEmployeeError,
      } = await supabase
        .from("employees")
        .select("id, full_name, email")
        .eq("email", user.email)
        .maybeSingle();

      if (
        !emailEmployeeError &&
        employeeByEmail
      ) {
        employeeData =
          employeeByEmail;
      }
    }

    if (!employeeData) {
      console.error(
        "Employee profile not found."
      );

      setPageLoading(false);
      return;
    }

    setEmployee(employeeData);

    await loadHistory(
      employeeData.id
    );

    setPageLoading(false);
  }

  async function loadHistory(
    employeeId: string
  ) {
    const { data, error } =
      await supabase
        .from("sales_performance")
        .select("*")
        .eq(
          "employee_id",
          employeeId
        )
        .order("year", {
          ascending: false,
        })
        .order("month", {
          ascending: false,
        });

    if (error) {
      console.error(
        "Sales History Error:",
        error
      );

      return;
    }

    setHistory(
      (data || []) as SalesPerformance[]
    );
  }

  const targetNumber =
    Number(target) || 0;

  const completedNumber =
    Number(completed) || 0;

  const pendingTarget =
    Math.max(
      targetNumber - completedNumber,
      0
    );

  const achievement =
    targetNumber > 0
      ? Math.min(
          Math.round(
            (completedNumber /
              targetNumber) *
              100
          ),
          100
        )
      : 0;
        function resetForm() {
    setSelectedMonth(
      today.getMonth() + 1
    );

    setSelectedYear(
      today.getFullYear()
    );

    setTarget("");
    setCompleted("");
    setRemainingTime("");
    setSelectedFile(null);
    setEditingId(null);

    const fileInput =
      document.getElementById(
        "sales-file"
      ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  }

  function handleEdit(
    record: SalesPerformance
  ) {
    setEditingId(record.id);

    setSelectedMonth(
      record.month
    );

    setSelectedYear(
      record.year
    );

    setTarget(
      String(record.target)
    );

    setCompleted(
      String(record.completed)
    );

    setRemainingTime(
      record.remaining_time || ""
    );

    setSelectedFile(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!employee) {
      alert(
        "Employee profile not found."
      );
      return;
    }

    if (targetNumber <= 0) {
      alert(
        "Please enter a valid target."
      );
      return;
    }

    if (completedNumber < 0) {
      alert(
        "Completed value cannot be negative."
      );
      return;
    }

    if (
      completedNumber >
      targetNumber
    ) {
      alert(
        "Completed value cannot be greater than target."
      );
      return;
    }

    setSaving(true);

    try {
      let fileName: string | null =
        null;

      let filePath: string | null =
        null;

      if (editingId) {
        const existingRecord =
          history.find(
            (item) =>
              item.id === editingId
          );

        fileName =
          existingRecord?.file_name ||
          null;

        filePath =
          existingRecord?.file_path ||
          null;
      }

      if (selectedFile) {
        const extension =
          selectedFile.name
            .split(".")
            .pop();

        const safeFileName =
          `${employee.id}/${selectedYear}-${selectedMonth}-${Date.now()}.${extension}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from(
            "sales-performance-files"
          )
          .upload(
            safeFileName,
            selectedFile,
            {
              upsert: false,
            }
          );

        if (uploadError) {
          console.error(
            "File Upload Error:",
            uploadError
          );

          alert(
            uploadError.message
          );

          setSaving(false);
          return;
        }

        fileName =
          selectedFile.name;

        filePath =
          safeFileName;
      }

      const payload = {
        employee_id:
          employee.id,

        month:
          selectedMonth,

        year:
          selectedYear,

        target:
          targetNumber,

        completed:
          completedNumber,

        pending_target:
          pendingTarget,

        remaining_time:
          remainingTime.trim() ||
          null,

        file_name:
          fileName,

        file_path:
          filePath,
      };

      if (editingId) {
        const { error } =
          await supabase
            .from(
              "sales_performance"
            )
            .update(payload)
            .eq(
              "id",
              editingId
            )
            .eq(
              "employee_id",
              employee.id
            );

        if (error) {
          console.error(
            "Update Error:",
            error
          );

          alert(error.message);

          setSaving(false);
          return;
        }

        alert(
          "Sales performance updated successfully."
        );
      } else {
        const {
          data: existingRecord,
          error:
            existingRecordError,
        } = await supabase
          .from(
            "sales_performance"
          )
          .select("id")
          .eq(
            "employee_id",
            employee.id
          )
          .eq(
            "month",
            selectedMonth
          )
          .eq(
            "year",
            selectedYear
          )
          .maybeSingle();

        if (
          existingRecordError
        ) {
          console.error(
            "Existing Record Error:",
            existingRecordError
          );

          alert(
            existingRecordError.message
          );

          setSaving(false);
          return;
        }

        if (existingRecord) {
          alert(
            "Performance for this month already exists. Please edit the existing record."
          );

          setSaving(false);
          return;
        }

        const { error } =
          await supabase
            .from(
              "sales_performance"
            )
            .insert(payload);

        if (error) {
          console.error(
            "Insert Error:",
            error
          );

          alert(error.message);

          setSaving(false);
          return;
        }

        alert(
          "Sales performance uploaded successfully."
        );
      }

      await loadHistory(
        employee.id
      );

      resetForm();
    } catch (error) {
      console.error(
        "Sales Performance Error:",
        error
      );

      alert(
        "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function viewFile(
    filePath: string | null
  ) {
    if (!filePath) {
      alert(
        "No file uploaded for this record."
      );
      return;
    }

    const {
      data,
      error,
    } = await supabase.storage
      .from(
        "sales-performance-files"
      )
      .createSignedUrl(
        filePath,
        60
      );

    if (error) {
      console.error(
        "File View Error:",
        error
      );

      alert(error.message);
      return;
    }

    if (data?.signedUrl) {
      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }
    if (pageLoading) {
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

  if (!employee) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <p className="text-red-600 font-semibold">
            Employee profile not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">

      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold">
          Sales Performance
        </h1>

        <p className="text-gray-500 mt-1">
          Upload and manage your monthly sales performance.
        </p>
      </div>

      {/* PERFORMANCE SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-sm text-gray-500">
            Target
          </p>

          <h2 className="text-3xl font-bold text-violet-600 mt-2">
            {targetNumber}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-sm text-gray-500">
            Completed
          </p>

          <h2 className="text-3xl font-bold text-green-600 mt-2">
            {completedNumber}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-sm text-gray-500">
            Pending
          </p>

          <h2 className="text-3xl font-bold text-orange-500 mt-2">
            {pendingTarget}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-sm text-gray-500">
            Achievement
          </p>

          <h2 className="text-3xl font-bold text-blue-600 mt-2">
            {achievement}%
          </h2>
        </div>

      </div>

      {/* UPLOAD / EDIT FORM */}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg p-8 space-y-6"
      >

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

          <div>
            <h2 className="text-2xl font-bold">
              {editingId
                ? "Edit Monthly Performance"
                : "Upload Monthly Performance"}
            </h2>

            <p className="text-gray-500 mt-1">
              Enter your sales details and upload the Excel file.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel Edit
            </button>
          )}

        </div>

        {/* MONTH + YEAR */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>
            <label className="block font-medium mb-2">
              Month
            </label>

            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(
                  Number(e.target.value)
                )
              }
              className="w-full border rounded-lg p-3"
            >
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
          </div>

          <div>
            <label className="block font-medium mb-2">
              Year
            </label>

            <input
              type="number"
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(
                  Number(e.target.value)
                )
              }
              min="2020"
              max="2100"
              className="w-full border rounded-lg p-3"
              required
            />
          </div>

        </div>

        {/* TARGET + COMPLETED */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>
            <label className="block font-medium mb-2">
              Monthly Target
            </label>

            <input
              type="number"
              value={target}
              onChange={(e) =>
                setTarget(e.target.value)
              }
              min="1"
              placeholder="Enter monthly target"
              className="w-full border rounded-lg p-3"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-2">
              Completed
            </label>

            <input
              type="number"
              value={completed}
              onChange={(e) =>
                setCompleted(e.target.value)
              }
              min="0"
              placeholder="Enter completed sales"
              className="w-full border rounded-lg p-3"
              required
            />
          </div>

        </div>

        {/* PENDING + ACHIEVEMENT */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="bg-orange-50 rounded-xl p-5">
            <p className="text-sm text-gray-600">
              Pending Target
            </p>

            <p className="text-2xl font-bold text-orange-600 mt-1">
              {pendingTarget}
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-5">
            <p className="text-sm text-gray-600">
              Achievement
            </p>

            <p className="text-2xl font-bold text-blue-600 mt-1">
              {achievement}%
            </p>
          </div>

        </div>

        {/* REMAINING TIME */}

        <div>
          <label className="block font-medium mb-2">
            Remaining Time
          </label>

          <input
            type="text"
            value={remainingTime}
            onChange={(e) =>
              setRemainingTime(
                e.target.value
              )
            }
            placeholder="Example: 10 days remaining"
            className="w-full border rounded-lg p-3"
          />
        </div>

        {/* EXCEL UPLOAD */}

        <div>
          <label className="block font-medium mb-2">
            Upload Excel File
          </label>

          <input
            id="sales-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) =>
              setSelectedFile(
                e.target.files?.[0] ||
                  null
              )
            }
            className="w-full border rounded-lg p-3"
          />

          {selectedFile && (
            <p className="text-sm text-green-600 mt-2">
              Selected: {selectedFile.name}
            </p>
          )}

          {editingId &&
            !selectedFile && (
              <p className="text-sm text-gray-500 mt-2">
                Leave this empty if you do not want to replace the existing file.
              </p>
            )}
        </div>

        {/* SAVE BUTTON */}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-violet-600 text-white rounded-lg py-3 font-semibold hover:bg-violet-700 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : editingId
            ? "Update Performance"
            : "Upload Performance"}
        </button>

      </form>

      {/* PERFORMANCE HISTORY */}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8 border-b">
          <h2 className="text-2xl font-bold">
            Performance History
          </h2>

          <p className="text-gray-500 mt-1">
            Your month-wise sales performance history.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
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
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-10 text-gray-500"
                  >
                    No sales performance history found.
                  </td>
                </tr>
              ) : (
                history.map((record) => {
                  const recordTarget =
                    Number(record.target) || 0;

                  const recordCompleted =
                    Number(record.completed) || 0;

                  const recordPending =
                    Math.max(
                      recordTarget - recordCompleted,
                      0
                    );

                  const recordAchievement =
                    recordTarget > 0
                      ? Math.min(
                          Math.round(
                            (recordCompleted /
                              recordTarget) *
                              100
                          ),
                          100
                        )
                      : 0;

                  return (
                    <tr
                      key={record.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-4 font-semibold">
                        {MONTHS[record.month - 1]}{" "}
                        {record.year}
                      </td>

                      <td className="p-4">
                        {recordTarget}
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-green-600">
                          {recordCompleted}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-orange-600">
                          {recordPending}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-blue-600">
                          {recordAchievement}%
                        </span>
                      </td>

                      <td className="p-4">
                        {record.remaining_time || "-"}
                      </td>

                      <td className="p-4">
                        {record.file_path ? (
                          <button
                            type="button"
                            onClick={() =>
                              viewFile(record.file_path)
                            }
                            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                          >
                            View File
                          </button>
                        ) : (
                          <span className="text-gray-400">
                            No File
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(record)
                            }
                            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700"
                          >
                            Edit
                          </button>
                        </div>
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