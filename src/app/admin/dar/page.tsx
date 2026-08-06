"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import {
  CalendarDays,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  History,
  Loader2,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";

const supabase = createClient();

// ============================================================
// TYPES
// ============================================================

interface Employee {
  id: string;
  full_name: string;
  email: string;
  designation?: string | null;
  department?: string | null;
}

interface DARReport {
  id: string;
  employee_id: string;
  report_date: string;

  status: "Draft" | "Submitted";

  submitted_at: string | null;

  file_name: string | null;
  file_path: string | null;
  file_size: number | null;

  created_at: string;
  updated_at: string;
}

// ============================================================
// TODAY
// ============================================================

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

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(date: string) {
  if (!date) {
    return "--";
  }

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================================
// FORMAT DATE TIME
// ============================================================

function formatDateTime(value: string | null) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// FILE SIZE
// ============================================================

function formatFileSize(bytes: number | null) {
  if (!bytes) {
    return "--";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} MB`;
}

// ============================================================
// SAFE FILE NAME
// ============================================================

function safeFileName(name: string) {
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

// ============================================================
// PAGE
// ============================================================

export default function AdminDARPage() {
  const [admin, setAdmin] =
    useState<Employee | null>(null);

  const [reports, setReports] =
    useState<DARReport[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [downloadingId, setDownloadingId] =
    useState<string | null>(null);

  // ==========================================================
  // UPLOAD
  // ==========================================================

  const [reportDate, setReportDate] =
    useState(getToday());

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  // ==========================================================
  // HISTORY FILTER
  // ==========================================================

  const [search, setSearch] =
    useState("");

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================================
  // LOAD ADMIN + ADMIN HISTORY
  // ==========================================================

  async function loadData(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // ------------------------------------------------------
      // AUTH USER
      // ------------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("User is not logged in.");
      }

      if (!user.email) {
        throw new Error(
          "Logged-in user does not have an email."
        );
      }

      // ------------------------------------------------------
      // FIND ADMIN IN EMPLOYEES
      // ------------------------------------------------------

      const {
        data: employee,
        error: employeeError,
      } = await supabase
        .from("employees")
        .select(
          `
          id,
          full_name,
          email,
          designation,
          department
        `
        )
        .eq("email", user.email)
        .single();

      if (employeeError) {
        throw new Error(
          `Admin employee record not found: ${employeeError.message}`
        );
      }

      const adminEmployee =
        employee as Employee;

      setAdmin(adminEmployee);

      // ------------------------------------------------------
      // LOAD ONLY ADMIN'S DAR HISTORY
      // ------------------------------------------------------

      const {
        data: reportData,
        error: reportError,
      } = await supabase
        .from("daily_activity_reports")
        .select(
          `
          id,
          employee_id,
          report_date,
          status,
          submitted_at,
          file_name,
          file_path,
          file_size,
          created_at,
          updated_at
        `
        )
        .eq("employee_id", adminEmployee.id)
        .order("report_date", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (reportError) {
        throw reportError;
      }

      setReports(
        (reportData || []) as DARReport[]
      );
    } catch (error: any) {
      console.error(
        "Admin DAR Load Error:",
        error
      );

      alert(
        error?.message ||
          "Unable to load DAR."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // ==========================================================
  // FILE CHANGE
  // ==========================================================

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    if (
      extension !== "xlsx" &&
      extension !== "xls"
    ) {
      alert(
        "Please select an Excel file (.xlsx or .xls)."
      );

      event.target.value = "";

      setSelectedFile(null);

      return;
    }

    setSelectedFile(file);
  }

  // ==========================================================
  // UPLOAD DAR
  // ==========================================================

  async function uploadDAR() {
    if (!admin) {
      alert(
        "Admin employee record not found."
      );

      return;
    }

    if (!reportDate) {
      alert(
        "Please select the DAR date."
      );

      return;
    }

    if (!selectedFile) {
      alert(
        "Please select an Excel DAR file."
      );

      return;
    }

    setUploading(true);

    try {
      // ------------------------------------------------------
      // CHECK EXISTING DAR FOR THIS DATE
      // ------------------------------------------------------

      const existingReport =
        reports.find(
          (report) =>
            report.report_date ===
            reportDate
        );

      // ------------------------------------------------------
      // UPLOAD NEW FILE FIRST
      // ------------------------------------------------------

      const cleanFileName =
        safeFileName(
          selectedFile.name
        );

      const filePath =
        `${admin.id}/${reportDate}/${Date.now()}-${cleanFileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("dar-reports")
        .upload(
          filePath,
          selectedFile,
          {
            cacheControl: "3600",
            upsert: false,
          }
        );

      if (uploadError) {
        throw new Error(
          uploadError.message
        );
      }

      // ------------------------------------------------------
      // UPDATE EXISTING DAR
      // ------------------------------------------------------

      if (existingReport) {
        const oldFilePath =
          existingReport.file_path;

        const {
          error: updateError,
        } = await supabase
          .from(
            "daily_activity_reports"
          )
          .update({
            status: "Submitted",

            submitted_at:
              new Date().toISOString(),

            file_name:
              selectedFile.name,

            file_path:
              filePath,

            file_size:
              selectedFile.size,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            existingReport.id
          );

        if (updateError) {
          // New file uploaded but DB failed.
          // Remove the new orphaned file.
          await supabase.storage
            .from("dar-reports")
            .remove([filePath]);

          throw updateError;
        }

        // Remove previous Excel only AFTER DB update succeeds.
        if (
          oldFilePath &&
          oldFilePath !== filePath
        ) {
          const {
            error: removeError,
          } = await supabase.storage
            .from("dar-reports")
            .remove([
              oldFilePath,
            ]);

          if (removeError) {
            console.warn(
              "Old DAR file could not be removed:",
              removeError
            );
          }
        }
      }

      // ------------------------------------------------------
      // CREATE NEW DAR
      // ------------------------------------------------------

      else {
        const {
          error: insertError,
        } = await supabase
          .from(
            "daily_activity_reports"
          )
          .insert({
            employee_id:
              admin.id,

            report_date:
              reportDate,

            status:
              "Submitted",

            submitted_at:
              new Date().toISOString(),

            file_name:
              selectedFile.name,

            file_path:
              filePath,

            file_size:
              selectedFile.size,
          });

        if (insertError) {
          // Remove uploaded file if DB insert failed.
          await supabase.storage
            .from("dar-reports")
            .remove([filePath]);

          throw insertError;
        }
      }

      alert(
        existingReport
          ? "DAR replaced successfully."
          : "DAR uploaded successfully."
      );

      setSelectedFile(null);

      // Reset actual input
      const fileInput =
        document.getElementById(
          "admin-dar-file"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await loadData(true);
    } catch (error: any) {
      console.error(
        "Admin DAR Upload Error:",
        error
      );

      alert(
        error?.message ||
          "Unable to upload DAR."
      );
    } finally {
      setUploading(false);
    }
  }

  // ==========================================================
  // DOWNLOAD DAR
  // ==========================================================

  async function downloadDAR(
    report: DARReport
  ) {
    if (!report.file_path) {
      alert(
        "DAR file is not available."
      );

      return;
    }

    setDownloadingId(
      report.id
    );

    try {
      const {
        data,
        error,
      } = await supabase.storage
        .from("dar-reports")
        .download(
          report.file_path
        );

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "File could not be downloaded."
        );
      }

      const url =
        URL.createObjectURL(data);

      const anchor =
        document.createElement("a");

      anchor.href = url;

      anchor.download =
        report.file_name ||
        `DAR-${report.report_date}.xlsx`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(
        "DAR Download Error:",
        error
      );

      alert(
        error?.message ||
          "Unable to download DAR."
      );
    } finally {
      setDownloadingId(null);
    }
  }

  // ==========================================================
  // FILTER HISTORY
  // ==========================================================

  const filteredReports =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return reports;
      }

      return reports.filter(
        (report) =>
          report.report_date
            ?.toLowerCase()
            .includes(value) ||
          report.file_name
            ?.toLowerCase()
            .includes(value) ||
          report.status
            ?.toLowerCase()
            .includes(value)
      );
    }, [reports, search]);

  // ==========================================================
  // STATS
  // ==========================================================

  const today = getToday();

  const todayReport =
    reports.find(
      (report) =>
        report.report_date ===
        today
    );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">

        <div className="flex items-center gap-3 text-lg text-gray-600">

          <Loader2 className="h-6 w-6 animate-spin" />

          Loading DAR...

        </div>

      </div>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="mx-auto max-w-[1500px] space-y-8 p-4 sm:p-6 md:p-8 lg:p-10">

      {/* ==================================================== */}
      {/* PAGE HEADER */}
      {/* ==================================================== */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-bold text-violet-700 sm:text-3xl lg:text-4xl">
            My Daily Activity Report
          </h1>

          <div className="mt-2 flex items-center gap-2 text-gray-500">

            <CalendarDays
              size={18}
            />

            <span>
              {formatDate(today)}
            </span>

          </div>

        </div>

        <button
          type="button"
          disabled={refreshing}
          onClick={() =>
            loadData(true)
          }
          className="flex w-fit items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >

          <RefreshCw
            size={18}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}

        </button>

      </div>

      {/* ==================================================== */}
      {/* ADMIN INFORMATION */}
      {/* ==================================================== */}

      {admin && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4">

          <p className="font-semibold text-gray-900">
            {admin.full_name}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {admin.designation ||
              "Administrator"}

            {admin.department
              ? ` • ${admin.department}`
              : ""}
          </p>

        </div>
      )}

      {/* ==================================================== */}
      {/* UPLOAD CARD */}
      {/* ==================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* HEADER */}

        <div className="border-b border-gray-100 p-5 sm:p-6">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">

              <Upload size={23} />

            </div>

            <div>

              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Upload DAR
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Upload your Daily Activity Report in Excel format.
              </p>

            </div>

          </div>

        </div>

        {/* BODY */}

        <div className="p-5 sm:p-6">

          <div className="grid gap-5 lg:grid-cols-[250px_1fr]">

            {/* DATE */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                DAR Date
              </label>

              <input
                type="date"
                value={reportDate}
                max={today}
                onChange={(event) =>
                  setReportDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />

            </div>

            {/* FILE */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Excel File
              </label>

              <input
                id="admin-dar-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={
                  handleFileChange
                }
                className="block w-full rounded-xl border border-gray-300 bg-white text-sm text-gray-600 file:mr-4 file:border-0 file:bg-violet-50 file:px-5 file:py-3 file:font-semibold file:text-violet-700 hover:file:bg-violet-100"
              />

            </div>

          </div>

          {/* SELECTED FILE */}

          {selectedFile && (
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-green-100 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex min-w-0 items-center gap-3">

                <FileSpreadsheet
                  className="shrink-0 text-green-700"
                  size={24}
                />

                <div className="min-w-0">

                  <p className="truncate font-semibold text-gray-800">
                    {
                      selectedFile.name
                    }
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {formatFileSize(
                      selectedFile.size
                    )}
                  </p>

                </div>

              </div>

              <CheckCircle2
                size={22}
                className="shrink-0 text-green-600"
              />

            </div>
          )}

          {/* EXISTING DATE WARNING */}

          {reports.some(
            (report) =>
              report.report_date ===
              reportDate
          ) && (
            <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">

              A DAR already exists for{" "}
              <strong>
                {formatDate(
                  reportDate
                )}
              </strong>
              . Uploading a new file will replace the existing DAR.

            </div>
          )}

          {/* UPLOAD BUTTON */}

          <div className="mt-6 flex justify-end">

            <button
              type="button"
              disabled={
                uploading ||
                !selectedFile ||
                !admin
              }
              onClick={uploadDAR}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >

              {uploading ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />

                  Uploading...
                </>
              ) : (
                <>
                  <Upload
                    size={19}
                  />

                  {reports.some(
                    (report) =>
                      report.report_date ===
                      reportDate
                  )
                    ? "Replace DAR"
                    : "Upload DAR"}
                </>
              )}

            </button>

          </div>

        </div>

      </div>

      {/* ==================================================== */}
      {/* TODAY STATUS */}
      {/* ==================================================== */}

      <div className="grid gap-5 sm:grid-cols-2">

        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-6">

          <p className="text-sm font-medium text-gray-600">
            Today's DAR
          </p>

          <p className="mt-2 text-2xl font-bold text-violet-700">
            {todayReport
              ? "Uploaded"
              : "Not Uploaded"}
          </p>

        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

          <p className="text-sm font-medium text-gray-600">
            Total DAR Uploaded
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-700">
            {reports.length}
          </p>

        </div>

      </div>

      {/* ==================================================== */}
      {/* HISTORY */}
      {/* ==================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* HISTORY HEADER */}

        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

          <div className="flex items-center gap-3">

            <History
              className="text-violet-700"
            />

            <div>

              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                DAR History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredReports.length} report(s)
              </p>

            </div>

          </div>

          {/* SEARCH */}

          <div className="relative w-full sm:max-w-sm">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search history..."
              className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />

          </div>

        </div>

        {/* HISTORY TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[800px]">

            <thead className="bg-gray-50">

              <tr>

                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Date
                </th>

                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  File
                </th>

                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Size
                </th>

                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Status
                </th>

                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Uploaded At
                </th>

                <th className="p-4 text-center text-sm font-semibold text-gray-600">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredReports.length ===
              0 ? (

                <tr>

                  <td
                    colSpan={6}
                    className="p-14 text-center"
                  >

                    <FileSpreadsheet
                      size={44}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    <p className="font-semibold text-gray-600">
                      No DAR history found.
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      Your uploaded DAR files will appear here.
                    </p>

                  </td>

                </tr>

              ) : (

                filteredReports.map(
                  (report) => (

                    <tr
                      key={report.id}
                      className="border-t border-gray-100 transition hover:bg-gray-50"
                    >

                      {/* DATE */}

                      <td className="p-4 font-semibold text-gray-800">
                        {formatDate(
                          report.report_date
                        )}
                      </td>

                      {/* FILE */}

                      <td className="p-4">

                        <div className="flex max-w-[300px] items-center gap-2">

                          <FileSpreadsheet
                            size={18}
                            className="shrink-0 text-green-600"
                          />

                          <span className="truncate font-medium text-gray-700">
                            {report.file_name ||
                              "DAR Excel"}
                          </span>

                        </div>

                      </td>

                      {/* SIZE */}

                      <td className="p-4 text-sm text-gray-500">
                        {formatFileSize(
                          report.file_size
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="p-4">

                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                          {
                            report.status
                          }
                        </span>

                      </td>

                      {/* UPLOADED */}

                      <td className="p-4 text-sm text-gray-500">
                        {formatDateTime(
                          report.submitted_at ||
                            report.created_at
                        )}
                      </td>

                      {/* DOWNLOAD */}

                      <td className="p-4 text-center">

                        {report.file_path ? (

                          <button
                            type="button"
                            disabled={
                              downloadingId ===
                              report.id
                            }
                            onClick={() =>
                              downloadDAR(
                                report
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-violet-200 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
                          >

                            {downloadingId ===
                            report.id ? (
                              <Loader2
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Download
                                size={17}
                              />
                            )}

                            Download

                          </button>

                        ) : (

                          <span className="text-sm text-gray-400">
                            No file
                          </span>

                        )}

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}