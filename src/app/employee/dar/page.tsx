"use client";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import {
  Plus,
  Trash2,
  Save,
  Send,
  Upload,
  FileSpreadsheet,
  History,
  Download,
  Loader2,
} from "lucide-react";

const supabase = createClient();

// ============================================================
// TYPES
// ============================================================

interface Activity {
  id?: string;

  activity_type: string;
  duration: string;
  work_done: string;
  next_action: string;
  remark: string;
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

  daily_activity_report_items?: Activity[];
}

// ============================================================
// EMPTY ACTIVITY
// ============================================================

function emptyActivity(): Activity {
  return {
    activity_type: "",
    duration: "",
    work_done: "",
    next_action: "",
    remark: "",
  };
}

// ============================================================
// DATE
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
// PAGE
// ============================================================

export default function EmployeeDARPage() {
  const [employeeId, setEmployeeId] =
    useState<string | null>(null);

  const [reportId, setReportId] =
    useState<string | null>(null);

  const [activities, setActivities] =
    useState<Activity[]>([
      emptyActivity(),
    ]);

  const [history, setHistory] =
    useState<DARReport[]>([]);

  const [excelFile, setExcelFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const today = getToday();

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    initializePage();
  }, []);

  async function initializePage() {
    setLoading(true);

    try {
      const id =
        await getLoggedInEmployee();

      if (!id) {
        alert(
          "Employee record not found."
        );

        return;
      }

      setEmployeeId(id);

      await Promise.all([
        loadTodayReport(id),
        loadHistory(id),
      ]);
    } catch (error) {
      console.error(
        "DAR initialization error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // GET LOGGED IN EMPLOYEE
  // ============================================================

  async function getLoggedInEmployee() {
    const {
      data: { user },
      error: authError,
    } =
      await supabase.auth.getUser();

    if (authError) {
      console.error(
        "Auth error:",
        authError
      );

      return null;
    }

    if (!user) {
      return null;
    }

    // First auth_id

    const {
      data: byAuth,
      error: authLookupError,
    } = await supabase
      .from("employees")
      .select(
        "id, email, auth_id"
      )
      .eq(
        "auth_id",
        user.id
      )
      .maybeSingle();

    if (authLookupError) {
      console.error(
        "auth_id lookup:",
        authLookupError
      );
    }

    if (byAuth) {
      return byAuth.id;
    }

    // Fallback email

    if (!user.email) {
      return null;
    }

    const {
      data: byEmail,
      error: emailError,
    } = await supabase
      .from("employees")
      .select(
        "id, email, auth_id"
      )
      .eq(
        "email",
        user.email
      )
      .maybeSingle();

    if (emailError) {
      console.error(
        "Employee lookup:",
        emailError
      );

      return null;
    }

    if (!byEmail) {
      return null;
    }

    // Automatically link auth account

    if (!byEmail.auth_id) {
      const {
        error: updateError,
      } = await supabase
        .from("employees")
        .update({
          auth_id: user.id,
        })
        .eq(
          "id",
          byEmail.id
        );

      if (updateError) {
        console.error(
          "auth_id update:",
          updateError
        );
      }
    }

    return byEmail.id;
  }

  // ============================================================
  // LOAD TODAY REPORT
  // ============================================================

  async function loadTodayReport(
    id: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "daily_activity_reports"
      )
      .select(
        `
          *,
          daily_activity_report_items (*)
        `
      )
      .eq(
        "employee_id",
        id
      )
      .eq(
        "report_date",
        today
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Today's DAR error:",
        error
      );

      return;
    }

    if (!data) {
      setReportId(null);

      setActivities([
        emptyActivity(),
      ]);

      setSubmitted(false);

      return;
    }

    setReportId(data.id);

    setSubmitted(
      data.status === "Submitted"
    );

    const items =
      data.daily_activity_report_items ||
      [];

    if (items.length > 0) {
      setActivities(
        items.map(
          (item: any) => ({
            id: item.id,

            activity_type:
              item.activity_type || "",

            duration:
              item.duration || "",

            work_done:
              item.work_done || "",

            next_action:
              item.next_action || "",

            remark:
              item.remark || "",
          })
        )
      );
    } else {
      setActivities([
        emptyActivity(),
      ]);
    }
  }

  // ============================================================
  // LOAD HISTORY
  // ============================================================

  async function loadHistory(
    id: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "daily_activity_reports"
      )
      .select(
        `
          *,
          daily_activity_report_items (*)
        `
      )
      .eq(
        "employee_id",
        id
      )
      .order(
        "report_date",
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        "History error:",
        error
      );

      return;
    }

    setHistory(
      (data || []) as DARReport[]
    );
  }

  // ============================================================
  // ACTIVITY CHANGE
  // ============================================================

  function updateActivity(
    index: number,
    field: keyof Activity,
    value: string
  ) {
    if (submitted) {
      return;
    }

    setActivities(
      (previous) => {
        const updated = [
          ...previous,
        ];

        updated[index] = {
          ...updated[index],

          [field]: value,
        };

        return updated;
      }
    );
  }

  // ============================================================
  // ADD ACTIVITY
  // ============================================================

  function addActivity() {
    if (submitted) {
      return;
    }

    setActivities(
      (previous) => [
        ...previous,
        emptyActivity(),
      ]
    );
  }

  // ============================================================
  // REMOVE ACTIVITY
  // ============================================================

  function removeActivity(
    index: number
  ) {
    if (submitted) {
      return;
    }

    if (
      activities.length === 1
    ) {
      alert(
        "At least one activity is required."
      );

      return;
    }

    setActivities(
      (previous) =>
        previous.filter(
          (_, i) => i !== index
        )
    );
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  function validateActivities() {
    const valid =
      activities.filter(
        (item) =>
          item.activity_type.trim() ||
          item.duration.trim() ||
          item.work_done.trim() ||
          item.next_action.trim() ||
          item.remark.trim()
      );

    if (
      valid.length === 0
    ) {
      alert(
        "Please enter at least one activity."
      );

      return null;
    }

    return valid;
  }

  // ============================================================
  // CREATE/GET MASTER REPORT
  // ============================================================

  async function getOrCreateReport(
    status:
      | "Draft"
      | "Submitted"
  ) {
    if (!employeeId) {
      throw new Error(
        "Employee not found."
      );
    }

    // Existing report

    if (reportId) {
      const updateData: any = {
        status,
        updated_at:
          new Date().toISOString(),
      };

      if (
        status === "Submitted"
      ) {
        updateData.submitted_at =
          new Date().toISOString();
      }

      const {
        data,
        error,
      } = await supabase
        .from(
          "daily_activity_reports"
        )
        .update(updateData)
        .eq(
          "id",
          reportId
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    }

    // New report

    const {
      data,
      error,
    } = await supabase
      .from(
        "daily_activity_reports"
      )
      .insert({
        employee_id:
          employeeId,

        report_date:
          today,

        status,

        submitted_at:
          status === "Submitted"
            ? new Date().toISOString()
            : null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    setReportId(data.id);

    return data;
  }

  // ============================================================
  // SAVE ITEMS
  // ============================================================

  async function saveItems(
    id: string,
    items: Activity[]
  ) {
    // Delete previous rows

    const {
      error: deleteError,
    } = await supabase
      .from(
        "daily_activity_report_items"
      )
      .delete()
      .eq(
        "report_id",
        id
      );

    if (deleteError) {
      throw deleteError;
    }

    const rows =
      items.map(
        (item) => ({
          report_id: id,

          activity_type:
            item.activity_type.trim(),

          duration:
            item.duration.trim(),

          work_done:
            item.work_done.trim(),

          next_action:
            item.next_action.trim(),

          remark:
            item.remark.trim(),
        })
      );

    const {
      error: insertError,
    } = await supabase
      .from(
        "daily_activity_report_items"
      )
      .insert(rows);

    if (insertError) {
      throw insertError;
    }
  }

  // ============================================================
  // SAVE DAR
  // ============================================================

  async function saveDAR() {
    if (submitted) {
      alert(
        "Today's DAR has already been submitted."
      );

      return;
    }

    const valid =
      validateActivities();

    if (!valid) {
      return;
    }

    setSaving(true);

    try {
      const report =
        await getOrCreateReport(
          "Draft"
        );

      await saveItems(
        report.id,
        valid
      );

      alert(
        "DAR saved successfully."
      );

      if (employeeId) {
        await Promise.all([
          loadTodayReport(
            employeeId
          ),

          loadHistory(
            employeeId
          ),
        ]);
      }
    } catch (error: any) {
      console.error(
        "Save DAR:",
        error
      );

      alert(
        error?.message ||
          "Unable to save DAR."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // SUBMIT DAR
  // ============================================================

  async function submitDAR() {
    if (submitted) {
      alert(
        "Today's DAR is already submitted."
      );

      return;
    }

    const valid =
      validateActivities();

    if (!valid) {
      return;
    }

    const confirmed =
      window.confirm(
        "Submit today's DAR? Please verify your activities before submitting."
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      const report =
        await getOrCreateReport(
          "Submitted"
        );

      await saveItems(
        report.id,
        valid
      );

      setSubmitted(true);

      alert(
        "DAR submitted successfully!"
      );

      if (employeeId) {
        await Promise.all([
          loadTodayReport(
            employeeId
          ),

          loadHistory(
            employeeId
          ),
        ]);
      }
    } catch (error: any) {
      console.error(
        "Submit DAR:",
        error
      );

      alert(
        error?.message ||
          "Unable to submit DAR."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // FILE SELECT
  // ============================================================

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      setExcelFile(null);

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
        "Only .xlsx or .xls files are allowed."
      );

      event.target.value = "";

      setExcelFile(null);

      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (
      file.size > maxSize
    ) {
      alert(
        "Maximum file size is 10 MB."
      );

      event.target.value = "";

      setExcelFile(null);

      return;
    }

    console.log(
      "Excel selected:",
      file
    );

    setExcelFile(file);
  }

  // ============================================================
  // UPLOAD EXCEL
  // ============================================================

 // ============================================================
// UPLOAD EXCEL
// ============================================================

async function uploadExcel() {
  if (!excelFile) {
    alert("Please choose an Excel file.");
    return;
  }

  if (!employeeId) {
    alert("Employee not found.");
    return;
  }

  if (uploading) {
    return;
  }

  setUploading(true);

  try {
    // ========================================================
    // 1. CHECK LOGGED-IN USER
    // ========================================================

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw new Error(
        `Authentication error: ${authError.message}`
      );
    }

    if (!user) {
      throw new Error(
        "You are not logged in. Please login again."
      );
    }

    console.log("DAR upload user:", {
      id: user.id,
      email: user.email,
    });

    // ========================================================
    // 2. VALIDATE FILE
    // ========================================================

    const extension = excelFile.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (
      extension !== "xlsx" &&
      extension !== "xls"
    ) {
      throw new Error(
        "Only .xlsx and .xls files are allowed."
      );
    }

    const maxSize =
      10 * 1024 * 1024;

    if (
      excelFile.size > maxSize
    ) {
      throw new Error(
        "Excel file cannot be larger than 10 MB."
      );
    }

    // ========================================================
    // 3. MAKE SURE TODAY'S DAR EXISTS
    // ========================================================

    let currentReportId =
      reportId;

    if (!currentReportId) {
      console.log(
        "No DAR exists for today. Creating one..."
      );

      const report =
        await getOrCreateReport(
          "Draft"
        );

      if (!report?.id) {
        throw new Error(
          "Unable to create today's DAR."
        );
      }

      currentReportId =
        report.id;

      setReportId(
        currentReportId
      );
    }

    console.log(
      "DAR Report ID:",
      currentReportId
    );

    // ========================================================
    // 4. SAFE FILE NAME
    // ========================================================

    const originalFileName =
      excelFile.name;

    const safeFileName =
      originalFileName
        .replace(/\s+/g, "_")
        .replace(
          /[^a-zA-Z0-9._-]/g,
          ""
        );

    // ========================================================
    // IMPORTANT
    //
    // Storage path starts with auth user.id.
    // This works much better with standard Supabase RLS:
    //
    // auth.uid()::text =
    // (storage.foldername(name))[1]
    //
    // ========================================================

    const filePath = [
      user.id,
      today,
      `${Date.now()}-${safeFileName}`,
    ].join("/");

    console.log(
      "================================"
    );

    console.log(
      "Uploading DAR Excel"
    );

    console.log({
      bucket: "dar-reports",
      path: filePath,
      authUserId: user.id,
      employeeId,
      reportId:
        currentReportId,
      fileName:
        originalFileName,
      fileSize:
        excelFile.size,
      fileType:
        excelFile.type,
    });

    console.log(
      "================================"
    );

    // ========================================================
    // 5. UPLOAD TO SUPABASE STORAGE
    // ========================================================

    const {
      data: uploadData,
      error: uploadError,
    } =
      await supabase.storage
        .from("dar-reports")
        .upload(
          filePath,
          excelFile,
          {
            cacheControl:
              "3600",

            upsert: false,

            contentType:
              extension ===
              "xlsx"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "application/vnd.ms-excel",
          }
        );

    // ========================================================
    // 6. HANDLE STORAGE ERROR PROPERLY
    // ========================================================

    if (uploadError) {
      const errorMessage =
        uploadError.message ||
        "Supabase Storage rejected the upload.";

      console.error(
        "STORAGE ERROR MESSAGE:",
        errorMessage
      );

      console.error(
        "STORAGE ERROR NAME:",
        uploadError.name
      );

      console.error(
        "STORAGE ERROR OBJECT:",
        JSON.stringify(
          uploadError,
          Object.getOwnPropertyNames(
            uploadError
          ),
          2
        )
      );

      throw new Error(
        `Storage upload failed: ${errorMessage}`
      );
    }

    if (!uploadData) {
      throw new Error(
        "Storage returned no upload data."
      );
    }

    if (!uploadData.path) {
      throw new Error(
        "Storage upload completed but no file path was returned."
      );
    }

    console.log(
      "Excel uploaded successfully:",
      uploadData
    );

    // ========================================================
    // 7. SAVE FILE DETAILS IN DAR DATABASE
    // ========================================================

    const {
      data: updatedReport,
      error: databaseError,
    } = await supabase
      .from(
        "daily_activity_reports"
      )
      .update({
        file_name:
          originalFileName,

        file_path:
          uploadData.path,

        file_size:
          excelFile.size,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        currentReportId
      )
      .eq(
        "employee_id",
        employeeId
      )
      .select()
      .maybeSingle();

    if (databaseError) {
      console.error(
        "DATABASE ERROR:",
        databaseError.message
      );

      // ======================================================
      // Database failed after file uploaded.
      // Delete orphaned Storage file.
      // ======================================================

      const {
        error: cleanupError,
      } =
        await supabase.storage
          .from(
            "dar-reports"
          )
          .remove([
            uploadData.path,
          ]);

      if (cleanupError) {
        console.error(
          "Unable to cleanup uploaded file:",
          cleanupError.message
        );
      }

      throw new Error(
        `File uploaded but database update failed: ${databaseError.message}`
      );
    }

    if (!updatedReport) {
      // Cleanup because DB row was not updated

      await supabase.storage
        .from(
          "dar-reports"
        )
        .remove([
          uploadData.path,
        ]);

      throw new Error(
        "DAR database record could not be updated."
      );
    }

    console.log(
      "DAR database updated:",
      updatedReport
    );

    // ========================================================
    // 8. SUCCESS
    // ========================================================

    alert(
      "Excel DAR uploaded successfully!"
    );

    setExcelFile(null);

    // ========================================================
    // 9. RELOAD TODAY + HISTORY
    // ========================================================

    await Promise.all([
      loadTodayReport(
        employeeId
      ),

      loadHistory(
        employeeId
      ),
    ]);
  } catch (error: unknown) {
    // ========================================================
    // ERROR HANDLER
    // ========================================================

    let message =
      "Unable to upload Excel file.";

    if (
      error instanceof Error
    ) {
      message =
        error.message;
    } else if (
      typeof error ===
      "string"
    ) {
      message =
        error;
    } else if (
      error &&
      typeof error ===
        "object" &&
      "message" in error
    ) {
      message =
        String(
          (
            error as {
              message?: unknown;
            }
          ).message
        );
    }

    console.error(
      "Excel upload failed:",
      message
    );

    alert(
      `Upload failed:\n${message}`
    );
  } finally {
    setUploading(false);
  }
}
  // ============================================================
  // DOWNLOAD EXCEL
  // ============================================================

  async function downloadFile(
    report: DARReport
  ) {
    if (!report.file_path) {
      alert(
        "Excel file not available."
      );

      return;
    }

    try {
      const {
        data,
        error,
      } =
        await supabase.storage
          .from(
            "dar-reports"
          )
          .download(
            report.file_path
          );

      if (error) {
        throw error;
      }

      const url =
        URL.createObjectURL(data);

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href = url;

      anchor.download =
        report.file_name ||
        "DAR.xlsx";

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(
        url
      );
    } catch (error: any) {
      console.error(
        "Download:",
        error
      );

      alert(
        error?.message ||
          "Unable to download file."
      );
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-lg">
          <Loader2 className="h-6 w-6 animate-spin" />

          Loading DAR...
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Daily Activity Report
          </h1>

          <p className="mt-2 text-gray-500">
            {new Date(
              `${today}T00:00:00`
            ).toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }
            )}
          </p>
        </div>

        {submitted && (
          <span className="w-fit rounded-full px-5 py-2 font-semibold text-green-700">
            Submitted
          </span>
        )}

      </div>

      {/* ===================================================== */}
      {/* MANUAL DAR */}
      {/* ===================================================== */}

      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">

        <div className="border-b p-6">
          <h2 className="text-2xl font-bold">Today's Activities</h2>

          <p className="mt-1 text-gray-500">Fill your daily activities manually.</p>
        </div>

        {/* Desktop table (hidden on small screens) */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Activity</th>
                <th className="p-4 text-left">Duration incl. Travel</th>
                <th className="p-4 text-left">Work</th>
                <th className="p-4 text-left">Next Action</th>
                <th className="p-4 text-left">Remark</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {activities.map((activity, index) => (
                <tr key={index} className="border-b align-top">
                  <td className="p-3">
                    <select
                      value={activity.activity_type}
                      disabled={submitted}
                      onChange={(e) => updateActivity(index, "activity_type", e.target.value)}
                      className="w-full min-w-[180px] rounded-lg border p-3 disabled:bg-gray-100"
                    >
                      <option value="">Select</option>
                      <option value="Office">Office</option>
                      <option value="Client Visit">Client Visit</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Calling">Calling</option>
                      <option value="Follow Up">Follow Up</option>
                      <option value="Sales">Sales</option>
                      <option value="Other">Other</option>
                    </select>
                  </td>

                  <td className="p-3">
                    <input
                      value={activity.duration}
                      disabled={submitted}
                      onChange={(e) => updateActivity(index, "duration", e.target.value)}
                      placeholder="e.g. 1h 30m"
                      className="w-full min-w-[180px] rounded-lg border p-3 disabled:bg-gray-100"
                    />
                  </td>

                  <td className="p-3">
                    <textarea
                      value={activity.work_done}
                      disabled={submitted}
                      onChange={(e) => updateActivity(index, "work_done", e.target.value)}
                      placeholder="Work done"
                      rows={4}
                      className="w-full min-w-[220px] resize-none rounded-lg border p-3 disabled:bg-gray-100"
                    />
                  </td>

                  <td className="p-3">
                    <textarea
                      value={activity.next_action}
                      disabled={submitted}
                      onChange={(e) => updateActivity(index, "next_action", e.target.value)}
                      placeholder="Next action"
                      rows={4}
                      className="w-full min-w-[220px] resize-none rounded-lg border p-3 disabled:bg-gray-100"
                    />
                  </td>

                  <td className="p-3">
                    <textarea
                      value={activity.remark}
                      disabled={submitted}
                      onChange={(e) => updateActivity(index, "remark", e.target.value)}
                      placeholder="Remark"
                      rows={4}
                      className="w-full min-w-[200px] resize-none rounded-lg border p-3 disabled:bg-gray-100"
                    />
                  </td>

                  <td className="p-3 text-center">
                    {!submitted && (
                      <button
                        type="button"
                        onClick={() => removeActivity(index)}
                        className="rounded-lg p-3 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards (visible on small screens) */}
        <div className="space-y-4 md:hidden p-4">
          {activities.map((row, index) => (
            <div
              key={row.id ?? index}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Activity #{index + 1}</h3>

                {!submitted && (
                  <button
                    type="button"
                    onClick={() => removeActivity(index)}
                    className="rounded-lg p-2 text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Activity</label>

                  <select
                    disabled={submitted}
                    value={row.activity_type || ""}
                    onChange={(e) => updateActivity(index, "activity_type", e.target.value)}
                    className="w-full rounded-lg border p-3"
                  >
                    <option value="">Select</option>
                    <option value="Office">Office</option>
                    <option value="Client Visit">Client Visit</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Calling">Calling</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Sales">Sales</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Duration incl. Travel</label>

                  <input
                    type="text"
                    disabled={submitted}
                    value={row.duration || ""}
                    onChange={(e) => updateActivity(index, "duration", e.target.value)}
                    className="w-full rounded-lg border p-3"
                    placeholder="e.g. 1h 30m"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Work</label>

                  <textarea
                    disabled={submitted}
                    value={row.work_done || ""}
                    onChange={(e) => updateActivity(index, "work_done", e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border p-3"
                    placeholder="Work done"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Next Action</label>

                  <textarea
                    disabled={submitted}
                    value={row.next_action || ""}
                    onChange={(e) => updateActivity(index, "next_action", e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border p-3"
                    placeholder="Next action"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Remark</label>

                  <textarea
                    disabled={submitted}
                    value={row.remark || ""}
                    onChange={(e) => updateActivity(index, "remark", e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border p-3"
                    placeholder="Remark"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        {!submitted && (
          <div className="flex flex-col gap-4 border-t p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={addActivity}
              className="w-full sm:w-auto flex items-center gap-2 rounded-lg border border-violet-600 px-5 py-3 font-medium text-violet-700 hover:bg-violet-50 justify-center"
            >
              <Plus size={20} />
              Add Activity
            </button>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <button
                type="button"
                disabled={saving}
                onClick={saveDAR}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-6 py-3 text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Save size={19} />
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={submitDAR}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-6 py-3 text-white hover:bg-violet-800 disabled:opacity-50"
              >
                <Send size={19} />
                Submit DAR
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ===================================================== */}
      {/* EXCEL UPLOAD */}
      {/* ===================================================== */}

      <div className="rounded-2xl bg-white p-7 shadow-lg">

        <div className="mb-6 flex items-start gap-4">

          <div className="rounded-xl p-3 text-green-700">
            <FileSpreadsheet size={30} />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Upload DAR Excel
            </h2>

            <p className="text-gray-500">
              You can attach your Excel DAR along with the manual report.
            </p>
          </div>

        </div>

        <div className="rounded-xl border-2 border-dashed border-gray-300 p-7">

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={
              handleFileChange
            }
            className="block w-full cursor-pointer"
          />

          <p className="mt-3 text-sm text-gray-500">
            Only .xlsx or .xls files. Maximum size: 10 MB.
          </p>

          {excelFile && (
            <div className="mt-4 rounded-lg p-4 text-sm">

              <p className="font-semibold text-green-800">
                Selected:
              </p>

              <p className="mt-1 break-all">
                {excelFile.name}
              </p>

              <p className="text-gray-500">
                {(
                  excelFile.size /
                  1024 /
                  1024
                ).toFixed(2)}{" "}
                MB
              </p>

            </div>
          )}

          <button
            type="button"
            onClick={
              uploadExcel
            }
            disabled={
              !excelFile ||
              uploading
            }
            className="mt-5 flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {uploading ? (
              <Loader2
                size={19}
                className="animate-spin"
              />
            ) : (
              <Upload size={19} />
            )}

            {uploading
              ? "Uploading..."
              : "Upload Excel"}
          </button>

        </div>

      </div>

      {/* ===================================================== */}
      {/* HISTORY */}
      {/* ===================================================== */}

      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">

        <div className="flex items-center gap-3 border-b p-6">

          <History className="text-violet-700" />

          <div>
            <h2 className="text-2xl font-bold">
              DAR History
            </h2>

            <p className="text-gray-500">
              Your previously saved and submitted reports.
            </p>
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead className="bg-gray-100">

              <tr>
                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-left">
                  Activities
                </th>

                <th className="p-4 text-left">
                  Status
                </th>

                <th className="p-4 text-left">
                  Excel
                </th>

                <th className="p-4 text-left">
                  Submitted
                </th>
              </tr>

            </thead>

            <tbody>

              {history.length === 0 ? (
                <tr>

                  <td
                    colSpan={5}
                    className="p-4 sm:p-6 text-center text-gray-500"
                  >
                    No DAR history found.
                  </td>

                </tr>
              ) : (
                history.map(
                  (report) => (
                    <tr
                      key={
                        report.id
                      }
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="p-4 font-medium">

                        {new Date(
                          `${report.report_date}T00:00:00`
                        ).toLocaleDateString(
                          "en-GB"
                        )}

                      </td>

                      <td className="p-4">

                        {
                          report
                            .daily_activity_report_items
                            ?.length ||
                          0
                        }

                      </td>

                      <td className="p-4">

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            report.status ===
                            "Submitted"
                              ? "text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {
                            report.status
                          }
                        </span>

                      </td>

                      <td className="p-4">

                        {report.file_path ? (
                          <button
                            type="button"
                            onClick={() =>
                              downloadFile(
                                report
                              )
                            }
                            className="flex items-center gap-2 font-medium text-green-700 hover:underline"
                          >
                            <Download size={17} />

                            {report.file_name ||
                              "Download Excel"}
                          </button>
                        ) : (
                          <span className="text-gray-400">
                            --
                          </span>
                        )}

                      </td>

                      <td className="p-4 text-gray-600">

                        {report.submitted_at
                          ? new Date(
                              report.submitted_at
                            ).toLocaleString(
                              "en-GB"
                            )
                          : "--"}

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