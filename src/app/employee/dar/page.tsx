"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import {
  Upload,
  FileSpreadsheet,
  History,
  Download,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

const supabase = createClient();

// ============================================================
// TYPES
// ============================================================

interface DARReport {
  id: string;
  employee_id: string;
  report_date: string;
  status: string;
  submitted_at: string | null;

  file_name: string | null;
  file_path: string | null;
  file_size: number | null;

  created_at?: string | null;
  updated_at?: string | null;
}

// ============================================================
// TODAY
// ============================================================

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ============================================================
// FILE SIZE
// ============================================================

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "--";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ============================================================
// PAGE
// ============================================================

export default function EmployeeDARPage() {
  const today = getToday();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [employeeId, setEmployeeId] =
    useState<string | null>(null);

  const [authUserId, setAuthUserId] =
    useState<string | null>(null);

  const [excelFile, setExcelFile] =
    useState<File | null>(null);

  const [history, setHistory] =
    useState<DARReport[]>([]);

  const [todayReport, setTodayReport] =
    useState<DARReport | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [downloadingId, setDownloadingId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  // ============================================================
  // LOAD REPORTS
  // ============================================================

  const loadReports = useCallback(
    async (id: string) => {
      const { data, error } = await supabase
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
        .eq("employee_id", id)
        .order("report_date", {
          ascending: false,
        });

      if (error) {
        console.error("DAR HISTORY MESSAGE:", error.message);
        console.error("DAR HISTORY CODE:", error.code);
        console.error("DAR HISTORY DETAILS:", error.details);
        console.error("DAR HISTORY HINT:", error.hint);

        throw new Error(error.message);
      }

      const reports = (data ?? []) as DARReport[];

      setHistory(reports);

      const current =
        reports.find(
          (report) => report.report_date === today
        ) ?? null;

      setTodayReport(current);
    },
    [today]
  );

  // ============================================================
  // INITIALIZE EMPLOYEE
  // ============================================================

  const initializePage = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      // --------------------------------------------------------
      // 1. GET EXISTING SESSION
      // --------------------------------------------------------

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (!session?.user) {
        throw new Error(
          "Your login session has expired. Please login again."
        );
      }

      const user = session.user;

      setAuthUserId(user.id);

      console.log("DAR USER:", {
        id: user.id,
        email: user.email,
      });

      // --------------------------------------------------------
      // 2. FIND EMPLOYEE USING AUTH ID
      // --------------------------------------------------------

      let foundEmployeeId: string | null = null;

      const {
        data: employeeByAuth,
        error: authLookupError,
      } = await supabase
        .from("employees")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (authLookupError) {
        console.error(
          "Employee auth lookup:",
          authLookupError.message
        );
      }

      if (employeeByAuth?.id) {
        foundEmployeeId = employeeByAuth.id;
      }

      // --------------------------------------------------------
      // 3. FALLBACK TO EMAIL
      // --------------------------------------------------------

      if (!foundEmployeeId && user.email) {
        const {
          data: employeeByEmail,
          error: emailLookupError,
        } = await supabase
          .from("employees")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();

        if (emailLookupError) {
          throw new Error(emailLookupError.message);
        }

        if (employeeByEmail?.id) {
          foundEmployeeId = employeeByEmail.id;
        }
      }

      if (!foundEmployeeId) {
        throw new Error(
          "Employee record not found. Please contact administrator."
        );
      }

      setEmployeeId(foundEmployeeId);

      // --------------------------------------------------------
      // 4. LOAD HISTORY
      // --------------------------------------------------------

      await loadReports(foundEmployeeId);
    } catch (error) {
      console.error("DAR initialization error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load DAR page."
      );
    } finally {
      setLoading(false);
    }
  }, [loadReports]);

  useEffect(() => {
    initializePage();
  }, [initializePage]);

  // ============================================================
  // REFRESH
  // ============================================================

  async function refreshHistory() {
    if (!employeeId) return;

    setRefreshing(true);
    setErrorMessage("");

    try {
      await loadReports(employeeId);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to refresh DAR history."
      );
    } finally {
      setRefreshing(false);
    }
  }

  // ============================================================
  // FILE SELECT
  // ============================================================

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setExcelFile(null);
      return;
    }

    const extension = file.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (extension !== "xlsx" && extension !== "xls") {
      alert("Please select an Excel .xlsx or .xls file.");

      event.target.value = "";
      setExcelFile(null);

      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Maximum Excel file size is 10 MB.");

      event.target.value = "";
      setExcelFile(null);

      return;
    }

    setExcelFile(file);
  }

  // ============================================================
  // UPLOAD DAR
  // ============================================================

  async function uploadDAR() {
    if (uploading) return;

    if (!excelFile) {
      alert("Please select an Excel file.");
      return;
    }

    if (!employeeId) {
      alert("Employee record not found.");
      return;
    }

    if (!authUserId) {
      alert("Login session not found. Please login again.");
      return;
    }

    // Prevent duplicate DAR for same date
    if (todayReport?.file_path) {
      alert(
        "You have already uploaded today's DAR. It is visible in your history."
      );
      return;
    }

    setUploading(true);
    setErrorMessage("");

    let uploadedPath: string | null = null;

    try {
      // --------------------------------------------------------
      // 1. VALIDATE FILE AGAIN
      // --------------------------------------------------------

      const extension = excelFile.name
        .split(".")
        .pop()
        ?.toLowerCase();

      if (extension !== "xlsx" && extension !== "xls") {
        throw new Error(
          "Only .xlsx and .xls files are allowed."
        );
      }

      if (excelFile.size > 10 * 1024 * 1024) {
        throw new Error(
          "Excel file cannot be larger than 10 MB."
        );
      }

      // --------------------------------------------------------
      // 2. SAFE FILE NAME
      // --------------------------------------------------------

      const originalFileName = excelFile.name;

      const safeFileName = originalFileName
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");

      const filePath = [
        authUserId,
        today,
        `${Date.now()}-${safeFileName}`,
      ].join("/");

      // --------------------------------------------------------
      // 3. UPLOAD FILE TO STORAGE
      // --------------------------------------------------------

      const {
        data: uploadData,
        error: uploadError,
      } = await supabase.storage
        .from("dar-reports")
        .upload(filePath, excelFile, {
          cacheControl: "3600",
          upsert: false,

          contentType:
            extension === "xlsx"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "application/vnd.ms-excel",
        });

      if (uploadError) {
        console.error(
          "DAR STORAGE ERROR:",
          uploadError.message
        );

        throw new Error(
          `File upload failed: ${uploadError.message}`
        );
      }

      if (!uploadData?.path) {
        throw new Error(
          "File upload completed but Storage returned no path."
        );
      }

      uploadedPath = uploadData.path;

      console.log("DAR STORAGE PATH:", uploadedPath);

      // --------------------------------------------------------
      // 4. CREATE OR UPDATE DATABASE REPORT
      // --------------------------------------------------------

      const now = new Date().toISOString();

      // Today's DB record already exists but has no file.
      if (todayReport?.id) {
        const {
          data: updatedReport,
          error: updateError,
        } = await supabase
          .from("daily_activity_reports")
          .update({
            status: "Submitted",
            submitted_at: now,

            file_name: originalFileName,
            file_path: uploadedPath,
            file_size: excelFile.size,

            updated_at: now,
          })
          .eq("id", todayReport.id)
          .eq("employee_id", employeeId)
          .select()
          .single();

        if (updateError) {
          throw new Error(updateError.message);
        }

        console.log("DAR UPDATED:", updatedReport);
      } else {
        // ------------------------------------------------------
        // CREATE NEW DAR
        // ------------------------------------------------------

        const {
          data: insertedReport,
          error: insertError,
        } = await supabase
          .from("daily_activity_reports")
          .insert({
            employee_id: employeeId,
            report_date: today,

            status: "Submitted",
            submitted_at: now,

            file_name: originalFileName,
            file_path: uploadedPath,
            file_size: excelFile.size,
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        console.log("DAR CREATED:", insertedReport);
      }

      // --------------------------------------------------------
      // 5. SUCCESS
      // --------------------------------------------------------

      setExcelFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadReports(employeeId);

      alert(
        "DAR uploaded and submitted successfully!"
      );
    } catch (error) {
      console.error("DAR upload error:", error);

      // --------------------------------------------------------
      // CLEAN STORAGE FILE IF DATABASE FAILED
      // --------------------------------------------------------

      if (uploadedPath) {
        const { error: cleanupError } =
          await supabase.storage
            .from("dar-reports")
            .remove([uploadedPath]);

        if (cleanupError) {
          console.error(
            "Storage cleanup error:",
            cleanupError.message
          );
        }
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unable to upload DAR.";

      setErrorMessage(message);

      alert(`Upload failed:\n${message}`);
    } finally {
      setUploading(false);
    }
  }

  // ============================================================
  // DOWNLOAD
  // ============================================================

  async function downloadFile(report: DARReport) {
    if (!report.file_path) {
      alert("Excel file is not available.");
      return;
    }

    setDownloadingId(report.id);

    try {
      const { data, error } = await supabase.storage
        .from("dar-reports")
        .download(report.file_path);

      if (error) {
        throw new Error(error.message);
      }

      const url = URL.createObjectURL(data);

      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = report.file_name || "DAR.xlsx";

      document.body.appendChild(anchor);

      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("DAR download error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to download Excel file."
      );
    } finally {
      setDownloadingId(null);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />

          <span className="font-medium">
            Loading DAR...
          </span>
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Daily Activity Report
        </h1>

        <p className="mt-2 text-gray-500">
          Upload your daily Excel report and view your DAR
          history.
        </p>
      </div>

      {/* ===================================================== */}
      {/* ERROR */}
      {/* ===================================================== */}

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-700">
            Something went wrong
          </p>

          <p className="mt-1 text-sm text-red-600">
            {errorMessage}
          </p>
        </div>
      )}

      {/* ===================================================== */}
      {/* TODAY STATUS */}
      {/* ===================================================== */}

      {todayReport?.file_path && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />

          <div>
            <p className="font-semibold text-green-800">
              Today&apos;s DAR has been submitted
            </p>

            <p className="mt-1 text-sm text-green-700">
              {todayReport.file_name}
            </p>

            {todayReport.submitted_at && (
              <p className="mt-1 text-xs text-green-600">
                Submitted{" "}
                {new Date(
                  todayReport.submitted_at
                ).toLocaleString("en-IN")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* UPLOAD CARD */}
      {/* ===================================================== */}

      <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="border-b border-gray-100 p-6">
          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Upload Today&apos;s DAR
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {new Date(
                  `${today}T00:00:00`
                ).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

          </div>
        </div>

        <div className="p-6">

          {todayReport?.file_path ? (
            // -------------------------------------------------
            // ALREADY SUBMITTED
            // -------------------------------------------------

            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">

              <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />

              <h3 className="mt-3 font-semibold text-green-800">
                DAR already submitted
              </h3>

              <p className="mt-1 text-sm text-green-700">
                You have already uploaded your DAR for today.
              </p>

              <button
                type="button"
                onClick={() =>
                  downloadFile(todayReport)
                }
                disabled={
                  downloadingId === todayReport.id
                }
                className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {downloadingId === todayReport.id ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Download size={18} />
                )}

                Download Uploaded File
              </button>

            </div>
          ) : (
            // -------------------------------------------------
            // UPLOAD
            // -------------------------------------------------

            <>
              <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">

                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />

                <h3 className="mt-4 font-semibold text-gray-800">
                  Select your Excel DAR
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  XLSX or XLS · Maximum 10 MB
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="mx-auto mt-5 block w-full max-w-md cursor-pointer rounded-lg border border-gray-300 bg-white p-3 text-sm"
                />

              </div>

              {/* Selected file */}

              {excelFile && (
                <div className="mt-5 flex flex-col gap-4 rounded-xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex min-w-0 items-center gap-3">

                    <FileSpreadsheet className="h-8 w-8 shrink-0 text-green-600" />

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {excelFile.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {formatFileSize(excelFile.size)}
                      </p>
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={uploadDAR}
                    disabled={uploading}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                        <Upload size={19} />
                        Upload & Submit
                      </>
                    )}
                  </button>

                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* ===================================================== */}
      {/* HISTORY */}
      {/* ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-gray-100 p-6">

          <div className="flex items-center gap-3">

            <History className="h-6 w-6 text-violet-600" />

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                DAR History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your previously uploaded reports.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={refreshHistory}
            disabled={refreshing}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-violet-600 disabled:opacity-50"
            title="Refresh history"
          >
            <RefreshCw
              size={20}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
          </button>

        </div>

        {/* Desktop */}

        <div className="hidden overflow-x-auto md:block">

          <table className="w-full">

            <thead className="bg-gray-50">
              <tr>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  File
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Size
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Submitted
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {history.length === 0 ? (
              <tr>
                <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No DAR history found.
                  </td>
                </tr>
              ) : (
                history.map((report) => (
                  <tr
                    key={report.id}
                    className="transition hover:bg-gray-50"
                  >

                    <td className="whitespace-nowrap px-6 py-5 font-medium text-gray-900">
                      {new Date(
                        `${report.report_date}T00:00:00`
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="max-w-[280px] px-6 py-5">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 shrink-0 text-green-600" />

                        <span className="truncate text-sm font-medium text-gray-700">
                          {report.file_name || "No file"}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">
                      {formatFileSize(report.file_size)}
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {report.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">
                      {report.submitted_at
                        ? new Date(
                            report.submitted_at
                          ).toLocaleString("en-IN")
                        : "--"}
                    </td>

                    <td className="px-6 py-5">

                      {report.file_path ? (
                        <button
                          type="button"
                          disabled={
                            downloadingId === report.id
                          }
                          onClick={() =>
                            downloadFile(report)
                          }
                          className="flex items-center gap-2 font-semibold text-violet-600 hover:text-violet-800 disabled:opacity-50"
                        >
                          {downloadingId === report.id ? (
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Download size={17} />
                          )}

                          Download
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">
                          --
                        </span>
                      )}

                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>

        </div>

        {/* Mobile */}

        <div className="space-y-4 p-4 md:hidden">

          {history.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No DAR history found.
            </div>
          ) : (
            history.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-gray-200 p-4"
              >

                <div className="flex items-start justify-between gap-3">

                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(
                        `${report.report_date}T00:00:00`
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>

                    <p className="mt-1 break-all text-sm text-gray-500">
                      {report.file_name || "No file"}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    {report.status}
                  </span>

                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">

                  <p className="text-xs text-gray-400">
                    File size
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {formatFileSize(report.file_size)}
                  </p>

                  {report.file_path && (
                    <button
                      type="button"
                      onClick={() =>
                        downloadFile(report)
                      }
                      disabled={
                        downloadingId === report.id
                      }
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
                    >
                      {downloadingId === report.id ? (
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <Download size={18} />
                      )}

                      Download Excel
                    </button>
                  )}

                </div>

              </div>
            ))
          )}

        </div>

      </div>

    </div>
  );
}