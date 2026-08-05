"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface SalesPerformance {
  id: string;
  employee_id: string;
  performance_date: string;
  month: number;
  week_number: number;
  year: number;
  target: number;
  completed: number;
  remaining_time: string | null;
  file_name: string | null;
  file_path: string | null;
  created_at?: string;
  updated_at?: string;
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

const WEEKS = [1, 2, 3, 4, 5];

export default function SalesPerformancePage() {
  const today = new Date();

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [history, setHistory] = useState<SalesPerformance[]>([]);

  const [selectedMonth, setSelectedMonth] = useState(
    today.getMonth() + 1
  );

  const [selectedWeek, setSelectedWeek] = useState(1);

  const [selectedYear, setSelectedYear] = useState(
    today.getFullYear()
  );

  const [target, setTarget] = useState("");
  const [completed, setCompleted] = useState("");
  const [remainingTime, setRemainingTime] = useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  // ---------------------------------------------------------
  // INITIALIZE
  // ---------------------------------------------------------

  useEffect(() => {
    void initializePage();
  }, []);

  async function initializePage() {
    setPageLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log("AUTH ERROR");
        console.log(userError.message);
        return;
      }

      if (!user) {
        return;
      }

      let employeeData: Employee | null = null;

      // Try auth_id first
      const {
        data: employeeByAuth,
        error: authEmployeeError,
      } = await supabase
        .from("employees")
        .select("id, full_name, email")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (authEmployeeError) {
        console.log(
          "Employee auth lookup:",
          authEmployeeError.message
        );
      }

      if (employeeByAuth) {
        employeeData = employeeByAuth as Employee;
      }

      // Fallback email
      if (!employeeData && user.email) {
        const {
          data: employeeByEmail,
          error: emailEmployeeError,
        } = await supabase
          .from("employees")
          .select("id, full_name, email")
          .eq("email", user.email)
          .maybeSingle();

        if (emailEmployeeError) {
          console.log(
            "Employee email lookup:",
            emailEmployeeError.message
          );
        }

        if (employeeByEmail) {
          employeeData = employeeByEmail as Employee;
        }
      }

      if (!employeeData) {
        console.log("Employee profile not found");
        return;
      }

      setEmployee(employeeData);

      await loadHistory(employeeData.id);
    } catch (error) {
      console.log("INITIALIZE FAILED");
      console.log(error);
    } finally {
      setPageLoading(false);
    }
  }

  // ---------------------------------------------------------
  // LOAD HISTORY
  // ---------------------------------------------------------

  async function loadHistory(employeeId: string) {
    const { data, error } = await supabase
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
      .eq("employee_id", employeeId)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .order("week_number", { ascending: false });

    if (error) {
      console.log("LOAD HISTORY FAILED");
      console.log("CODE:", error.code);
      console.log("MESSAGE:", error.message);
      console.log("DETAILS:", error.details);
      console.log("HINT:", error.hint);

      alert(
        `Unable to load history:\n${error.message}`
      );

      setHistory([]);
      return;
    }

    setHistory((data ?? []) as SalesPerformance[]);
  }

  // ---------------------------------------------------------
  // AUTO LOAD MONTHLY TARGET
  // ---------------------------------------------------------

  useEffect(() => {
    if (editingId) {
      return;
    }

    const existingMonthRecord = history.find(
      (record) =>
        Number(record.month) === Number(selectedMonth) &&
        Number(record.year) === Number(selectedYear)
    );

    if (existingMonthRecord) {
      setTarget(String(existingMonthRecord.target));
    } else {
      setTarget("");
    }
  }, [
    history,
    selectedMonth,
    selectedYear,
    editingId,
  ]);

  // ---------------------------------------------------------
  // CLEAR FILE
  // ---------------------------------------------------------

  function clearFileInput() {
    const input = document.getElementById(
      "sales-file"
    ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  }

  // ---------------------------------------------------------
  // RESET FORM
  // ---------------------------------------------------------

  function resetForm() {
    setCompleted("");
    setRemainingTime("");
    setSelectedFile(null);
    setEditingId(null);

    clearFileInput();

    const existingMonthRecord = history.find(
      (record) =>
        Number(record.month) === Number(selectedMonth) &&
        Number(record.year) === Number(selectedYear)
    );

    if (existingMonthRecord) {
      setTarget(String(existingMonthRecord.target));
    } else {
      setTarget("");
    }
  }

  // ---------------------------------------------------------
  // CANCEL EDIT
  // ---------------------------------------------------------

  function cancelEdit() {
    setEditingId(null);
    setCompleted("");
    setRemainingTime("");
    setSelectedFile(null);

    clearFileInput();

    const existingMonthRecord = history.find(
      (record) =>
        Number(record.month) === Number(selectedMonth) &&
        Number(record.year) === Number(selectedYear)
    );

    if (existingMonthRecord) {
      setTarget(String(existingMonthRecord.target));
    } else {
      setTarget("");
    }
  }

  // ---------------------------------------------------------
  // EDIT
  // ---------------------------------------------------------

  function handleEdit(record: SalesPerformance) {
    setEditingId(record.id);

    setSelectedMonth(Number(record.month));
    setSelectedWeek(Number(record.week_number));
    setSelectedYear(Number(record.year));

    setTarget(String(record.target ?? ""));
    setCompleted(String(record.completed ?? ""));

    setRemainingTime(
      record.remaining_time ?? ""
    );

    setSelectedFile(null);

    clearFileInput();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ---------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!employee) {
      alert("Employee profile not found.");
      return;
    }

    const normalizedTarget = target
      .trim()
      .replace(/,/g, "");

    const normalizedCompleted = completed
      .trim()
      .replace(/,/g, "");

    const targetNumber = Number(normalizedTarget);
    const completedNumber = Number(
      normalizedCompleted
    );

    if (
      !normalizedTarget ||
      !Number.isFinite(targetNumber) ||
      targetNumber <= 0
    ) {
      alert("Enter a valid monthly target.");
      return;
    }

    if (
      !normalizedCompleted ||
      !Number.isFinite(completedNumber) ||
      completedNumber < 0
    ) {
      alert(
        "Enter a valid completed sales value."
      );
      return;
    }

    // -------------------------------------------------------
    // CHECK SAME MONTH TARGET
    // -------------------------------------------------------

    const otherMonthRecords = history.filter(
      (record) =>
        Number(record.month) === Number(selectedMonth) &&
        Number(record.year) === Number(selectedYear) &&
        record.id !== editingId
    );

    if (otherMonthRecords.length > 0) {
      const existingTarget = Number(
        otherMonthRecords[0].target
      );

      if (existingTarget !== targetNumber) {
        alert(
          `Monthly target for ${
            MONTHS[selectedMonth - 1]
          } ${selectedYear} is already ${existingTarget.toLocaleString()}.`
        );

        return;
      }
    }

    // -------------------------------------------------------
    // DUPLICATE WEEK CHECK
    // -------------------------------------------------------

    const duplicate = history.find(
      (record) =>
        record.employee_id === employee.id &&
        Number(record.month) === Number(selectedMonth) &&
        Number(record.week_number) ===
          Number(selectedWeek) &&
        Number(record.year) === Number(selectedYear) &&
        record.id !== editingId
    );

    if (duplicate) {
      alert(
        `Week ${selectedWeek} already exists for ${
          MONTHS[selectedMonth - 1]
        } ${selectedYear}.\n\nPlease edit the existing report.`
      );

      return;
    }

    setSaving(true);

    let newlyUploadedPath: string | null = null;

    try {
      let fileName: string | null = null;
      let filePath: string | null = null;

      // -----------------------------------------------------
      // EXISTING FILE WHILE EDITING
      // -----------------------------------------------------

      if (editingId) {
        const oldRecord = history.find(
          (record) => record.id === editingId
        );

        fileName =
          oldRecord?.file_name ?? null;

        filePath =
          oldRecord?.file_path ?? null;
      }

      // -----------------------------------------------------
      // UPLOAD FILE
      // -----------------------------------------------------

      if (selectedFile) {
        const extension =
          selectedFile.name
            .split(".")
            .pop()
            ?.toLowerCase() ?? "";

        const allowed = [
          "xlsx",
          "xls",
          "csv",
        ];

        if (!allowed.includes(extension)) {
          alert(
            "Only XLSX, XLS and CSV files are allowed."
          );

          return;
        }

        const storagePath =
          `${employee.id}/` +
          `${selectedYear}/` +
          `${selectedMonth}/` +
          `week-${selectedWeek}-${Date.now()}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
            .from("sales-performance-files")
            .upload(
              storagePath,
              selectedFile,
              {
                upsert: false,
                cacheControl: "3600",
              }
            );

        if (uploadError) {
          console.log("UPLOAD FAILED");
          console.log(
            "MESSAGE:",
            uploadError.message
          );

          alert(
            `File upload failed:\n${uploadError.message}`
          );

          return;
        }

        newlyUploadedPath = storagePath;
        fileName = selectedFile.name;
        filePath = storagePath;
      }

      // -----------------------------------------------------
      // PERFORMANCE DATE
      // -----------------------------------------------------

    const performanceDate =
  `${selectedYear}-${String(selectedMonth).padStart(
    2,
    "0"
  )}-${String(
    Math.min((selectedWeek - 1) * 7 + 1, 28)
  ).padStart(2, "0")}`;

      // -----------------------------------------------------
      // PAYLOAD
      // -----------------------------------------------------

      const payload = {
        employee_id: employee.id,

        performance_date: performanceDate,

        month: selectedMonth,
        week_number: selectedWeek,
        year: selectedYear,

        target: targetNumber,
        completed: completedNumber,

        remaining_time:
          remainingTime.trim() || null,

        file_name: fileName,
        file_path: filePath,
      };

      console.log("PAYLOAD:", payload);

      // -----------------------------------------------------
      // UPDATE
      // -----------------------------------------------------

      if (editingId) {
        const {
          data: updatedData,
          error: updateError,
        } = await supabase
          .from("sales_performance")
          .update(payload)
          .eq("id", editingId)
          .eq("employee_id", employee.id)
          .select();

        if (updateError) {
          if (newlyUploadedPath) {
            await supabase.storage
              .from("sales-performance-files")
              .remove([newlyUploadedPath]);
          }

          console.log(
            "===== UPDATE FAILED ====="
          );
          console.log(
            "CODE:",
            updateError.code
          );
          console.log(
            "MESSAGE:",
            updateError.message
          );
          console.log(
            "DETAILS:",
            updateError.details
          );
          console.log(
            "HINT:",
            updateError.hint
          );

          alert(
            [
              "Unable to update report.",
              "",
              `Code: ${updateError.code || "N/A"}`,
              `Message: ${
                updateError.message || "N/A"
              }`,
              `Details: ${
                updateError.details || "N/A"
              }`,
              `Hint: ${
                updateError.hint || "N/A"
              }`,
            ].join("\n")
          );

          return;
        }

        console.log(
          "UPDATE SUCCESS:",
          updatedData
        );

        await loadHistory(employee.id);

        resetForm();

        alert(
          "Weekly sales performance updated successfully."
        );

        return;
      }

      // -----------------------------------------------------
      // INSERT
      // -----------------------------------------------------

      const {
        data: insertedData,
        error: insertError,
      } = await supabase
        .from("sales_performance")
        .insert(payload)
        .select();

      if (insertError) {
        if (newlyUploadedPath) {
          await supabase.storage
            .from("sales-performance-files")
            .remove([newlyUploadedPath]);
        }

        console.log(
          "===== SALES INSERT FAILED ====="
        );

        console.log(
          "CODE:",
          insertError.code
        );

        console.log(
          "MESSAGE:",
          insertError.message
        );

        console.log(
          "DETAILS:",
          insertError.details
        );

        console.log(
          "HINT:",
          insertError.hint
        );

        console.log(
          "PAYLOAD:",
          payload
        );

        alert(
          [
            "Unable to save report.",
            "",
            `Code: ${insertError.code || "N/A"}`,
            `Message: ${
              insertError.message || "N/A"
            }`,
            `Details: ${
              insertError.details || "N/A"
            }`,
            `Hint: ${
              insertError.hint || "N/A"
            }`,
          ].join("\n")
        );

        return;
      }

      console.log(
        "INSERT SUCCESS:",
        insertedData
      );

      // Reload DB data BEFORE resetting form
      await loadHistory(employee.id);

      resetForm();

      alert(
        "Weekly sales performance uploaded successfully."
      );
    } catch (error) {
      console.log(
        "===== UNEXPECTED SALES ERROR ====="
      );

      console.log(error);

      if (newlyUploadedPath) {
        await supabase.storage
          .from("sales-performance-files")
          .remove([newlyUploadedPath]);
      }

      alert(
        "Something unexpected went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------
  // VIEW FILE
  // ---------------------------------------------------------

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
      console.log("VIEW FILE FAILED");
      console.log(error.message);

      alert(
        `Unable to open file:\n${error.message}`
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

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (pageLoading) {
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

  // ---------------------------------------------------------
  // EMPLOYEE NOT FOUND
  // ---------------------------------------------------------

  if (!employee) {
    return (
      <div className="p-8">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <p className="font-semibold text-red-600">
            Employee profile not found.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="space-y-8 p-8">
      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold">
          Weekly Sales Performance
        </h1>

        <p className="mt-1 text-gray-500">
          Upload your weekly sales against your
          monthly target.
        </p>
      </div>

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl bg-white p-8 shadow-lg"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {editingId
                ? "Edit Weekly Report"
                : "Upload Weekly Report"}
            </h2>

            <p className="mt-1 text-gray-500">
              Upload this week&apos;s sales
              performance.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border px-4 py-2 hover:bg-gray-100"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* MONTH / WEEK / YEAR */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block font-medium">
              Month
            </label>

            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(
                  Number(e.target.value)
                );

                if (!editingId) {
                  setCompleted("");
                  setRemainingTime("");
                }
              }}
              className="w-full rounded-lg border p-3"
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
            <label className="mb-2 block font-medium">
              Week
            </label>

            <select
              value={selectedWeek}
              onChange={(e) =>
                setSelectedWeek(
                  Number(e.target.value)
                )
              }
              className="w-full rounded-lg border p-3"
            >
              {WEEKS.map((week) => (
                <option
                  key={week}
                  value={week}
                >
                  Week {week}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Year
            </label>

            <input
              type="number"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(
                  Number(e.target.value)
                );

                if (!editingId) {
                  setCompleted("");
                  setRemainingTime("");
                }
              }}
              min={2024}
              max={2100}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>

        {/* TARGET / COMPLETED */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">
              Monthly Target
            </label>

            <input
              type="number"
              value={target}
              onChange={(e) =>
                setTarget(e.target.value)
              }
              min="1"
              step="1"
              className="w-full rounded-lg border p-3"
              placeholder="Enter monthly target"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Completed This Week
            </label>

            <input
              type="number"
              value={completed}
              onChange={(e) =>
                setCompleted(e.target.value)
              }
              min="0"
              step="1"
              className="w-full rounded-lg border p-3"
              placeholder="Completed this week"
              required
            />
          </div>
        </div>

        {/* REMAINING */}

        <div>
          <label className="mb-2 block font-medium">
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
            className="w-full rounded-lg border p-3"
            placeholder="Example: 10 days remaining"
          />
        </div>

        {/* FILE */}

        <div>
          <label className="mb-2 block font-medium">
            Upload Excel File
          </label>

          <input
            id="sales-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) =>
              setSelectedFile(
                e.target.files?.[0] ?? null
              )
            }
            className="w-full rounded-lg border p-3"
          />

          {selectedFile && (
            <p className="mt-2 text-sm text-green-600">
              Selected: {selectedFile.name}
            </p>
          )}

          {editingId &&
            !selectedFile &&
            history.find(
              (item) =>
                item.id === editingId
            )?.file_name && (
              <p className="mt-2 text-sm text-gray-500">
                Current file:{" "}
                {
                  history.find(
                    (item) =>
                      item.id === editingId
                  )?.file_name
                }
              </p>
            )}
        </div>

        {/* BUTTON */}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-violet-600 py-3 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : editingId
              ? "Update Weekly Report"
              : "Upload Weekly Report"}
        </button>
      </form>

      {/* HISTORY */}

      <div className="rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Performance History
          </h2>

          <p className="mt-1 text-gray-500">
            View all your submitted weekly sales
            reports.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No sales performance reports found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-3 text-left">
                    Month
                  </th>

                  <th className="border px-4 py-3 text-left">
                    Week
                  </th>

                  <th className="border px-4 py-3 text-left">
                    Year
                  </th>

                  <th className="border px-4 py-3 text-right">
                    Monthly Target
                  </th>

                  <th className="border px-4 py-3 text-right">
                    Completed
                  </th>

                  <th className="border px-4 py-3 text-left">
                    Remaining Time
                  </th>

                  <th className="border px-4 py-3 text-left">
                    File
                  </th>

                  <th className="border px-4 py-3 text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="border px-4 py-3">
                      {MONTHS[
                        Number(record.month) - 1
                      ] ?? "-"}
                    </td>

                    <td className="border px-4 py-3">
                      Week{" "}
                      {record.week_number}
                    </td>

                    <td className="border px-4 py-3">
                      {record.year}
                    </td>

                    <td className="border px-4 py-3 text-right font-medium">
                      {Number(
                        record.target ?? 0
                      ).toLocaleString()}
                    </td>

                    <td className="border px-4 py-3 text-right font-semibold text-green-600">
                      {Number(
                        record.completed ?? 0
                      ).toLocaleString()}
                    </td>

                    <td className="border px-4 py-3">
                      {record.remaining_time ||
                        "-"}
                    </td>

                    <td className="border px-4 py-3">
                      {record.file_name ? (
                        <button
                          type="button"
                          onClick={() =>
                            viewFile(
                              record.file_path
                            )
                          }
                          className="text-blue-600 hover:underline"
                        >
                          {record.file_name}
                        </button>
                      ) : (
                        <span className="text-gray-400">
                          No File
                        </span>
                      )}
                    </td>

                    <td className="border px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(record)
                          }
                          className="rounded bg-violet-600 px-3 py-1 text-white hover:bg-violet-700"
                        >
                          Edit
                        </button>

                        {record.file_path && (
                          <button
                            type="button"
                            onClick={() =>
                              viewFile(
                                record.file_path
                              )
                            }
                            className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}