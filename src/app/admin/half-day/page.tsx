"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import {
  Check,
  X,
  Loader2,
  RefreshCw,
  Clock,
  CalendarDays,
} from "lucide-react";

const supabase = createClient();

// ============================================================
// TYPES
// ============================================================

type HalfDayRequest = {
  id: string;

  employee_id: string;

  request_date: string;

  slot: string;

  start_time: string | null;

  end_time: string | null;

  reason: string;

  status:
    | "Pending"
    | "Approved"
    | "Rejected";

  admin_remark: string | null;

  approved_by: string | null;

  approved_at: string | null;

  created_at: string;

  updated_at: string | null;

  employee?: Employee | null;
};

type Employee = Record<
  string,
  any
>;

// ============================================================
// PAGE
// ============================================================

export default function AdminHalfDayPage() {
  const [requests, setRequests] =
    useState<HalfDayRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [rejectId, setRejectId] =
    useState<string | null>(null);

  const [remark, setRemark] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ==========================================================
  // FETCH REQUESTS
  // ==========================================================

  const fetchRequests = useCallback(
    async (manualRefresh = false) => {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        // ====================================================
        // GET HALF DAY REQUESTS
        // ====================================================

        const {
          data,
          error,
        } = await supabase
          .from(
            "half_day_requests"
          )
          .select(`
            id,
            employee_id,
            request_date,
            slot,
            start_time,
            end_time,
            reason,
            status,
            admin_remark,
            approved_by,
            approved_at,
            created_at,
            updated_at
          `)
          .order(
            "request_date",
            {
              ascending: false,
            }
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (error) {
          console.error(
            "Admin Half Day fetch error:",
            error
          );

          throw new Error(
            error.message
          );
        }

        const halfDayRequests =
          (data ??
            []) as HalfDayRequest[];

        // ====================================================
        // GET EMPLOYEE IDs
        // ====================================================

        const employeeIds = [
          ...new Set(
            halfDayRequests.map(
              (request) =>
                request.employee_id
            )
          ),
        ];

        let employees: Employee[] =
          [];

        // ====================================================
        // GET EMPLOYEES
        //
        // IMPORTANT:
        // We use select("*") so we don't assume that your
        // employee name column is called "name".
        // ====================================================

        if (
          employeeIds.length > 0
        ) {
          const {
            data: employeeData,
            error: employeeError,
          } = await supabase
            .from("employees")
            .select("*")
            .in(
              "id",
              employeeIds
            );

          if (employeeError) {
            console.error(
              "Employee fetch error:",
              employeeError
            );

            throw new Error(
              employeeError.message
            );
          }

          employees =
            (employeeData ??
              []) as Employee[];

          console.log(
            "Employees loaded:",
            employees
          );
        }

        // ====================================================
        // COMBINE REQUEST WITH EMPLOYEE
        // ====================================================

        const combined =
          halfDayRequests.map(
            (request) => ({
              ...request,

              employee:
                employees.find(
                  (employee) =>
                    employee.id ===
                    request.employee_id
                ) ?? null,
            })
          );

        setRequests(
          combined
        );
      } catch (error) {
        console.error(
          "Half Day admin fetch failed:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load Half Day requests."
        );
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    []
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ==========================================================
  // UPDATE REQUEST
  // ==========================================================

  async function updateRequest(
    request: HalfDayRequest,
    status:
      | "Approved"
      | "Rejected"
  ) {
    if (updatingId) {
      return;
    }

    // ========================================================
    // OPEN REJECT BOX
    // ========================================================

    if (
      status === "Rejected" &&
      rejectId !== request.id
    ) {
      setRejectId(
        request.id
      );

      setRemark("");

      return;
    }

    // ========================================================
    // CONFIRM
    // ========================================================

    const confirmed =
      window.confirm(
        status === "Approved"
          ? "Are you sure you want to approve this Half Day request?"
          : "Are you sure you want to reject this Half Day request?"
      );

    if (!confirmed) {
      return;
    }

    setUpdatingId(
      request.id
    );

    try {
      // ======================================================
      // GET ADMIN SESSION
      // ======================================================

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error(
          "Admin session expired. Please login again."
        );
      }

      const now =
        new Date().toISOString();

      // ======================================================
      // REJECTION REMARK
      // ======================================================

      const adminRemark =
        status === "Rejected"
          ? remark.trim() || null
          : null;

      // ======================================================
      // UPDATE DATABASE
      // ======================================================

      const {
        data,
        error,
      } = await supabase
        .from(
          "half_day_requests"
        )
        .update({
          status,

          admin_remark:
            adminRemark,

          approved_by:
            status ===
            "Approved"
              ? session.user.id
              : null,

          approved_at:
            status ===
            "Approved"
              ? now
              : null,

          updated_at:
            now,
        })
        .eq(
          "id",
          request.id
        )
        .select()
        .single();

      if (error) {
        console.error(
          "Half Day update error:",
          error
        );

        throw new Error(
          error.message
        );
      }

      console.log(
        "Half Day updated:",
        data
      );

      // ======================================================
      // UPDATE SCREEN
      // ======================================================

      setRequests(
        (previous) =>
          previous.map(
            (item) =>
              item.id ===
              request.id
                ? {
                    ...item,

                    status,

                    admin_remark:
                      adminRemark,

                    approved_by:
                      status ===
                      "Approved"
                        ? session
                            .user
                            .id
                        : null,

                    approved_at:
                      status ===
                      "Approved"
                        ? now
                        : null,

                    updated_at:
                      now,
                  }
                : item
          )
      );

      // ======================================================
      // RESET
      // ======================================================

      setRejectId(null);

      setRemark("");

      // ======================================================
      // SUCCESS
      // ======================================================

      alert(
        status === "Approved"
          ? "Half Day request approved successfully."
          : "Half Day request rejected successfully."
      );
    } catch (error) {
      console.error(
        "Half Day update failed:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to update Half Day request."
      );
    } finally {
      setUpdatingId(
        null
      );
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">

        <div className="flex items-center gap-3 text-gray-600">

          <Loader2
            size={24}
            className="animate-spin"
          />

          <span className="font-medium">
            Loading Half Day requests...
          </span>

        </div>

      </div>
    );
  }

  // ==========================================================
  // COUNTS
  // ==========================================================

  const totalRequests =
    requests.length;

  const pendingRequests =
    requests.filter(
      (request) =>
        request.status ===
        "Pending"
    ).length;

  const approvedRequests =
    requests.filter(
      (request) =>
        request.status ===
        "Approved"
    ).length;

  const rejectedRequests =
    requests.filter(
      (request) =>
        request.status ===
        "Rejected"
    ).length;

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <h1 className="text-3xl font-bold text-gray-900">
            Half Day Requests
          </h1>

          <p className="mt-2 text-gray-500">
            Review and manage employee Half Day requests.
          </p>

        </div>

        <button
          type="button"
          disabled={refreshing}
          onClick={() =>
            fetchRequests(true)
          }
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >

          <RefreshCw
            size={18}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh

        </button>

      </div>

      {/* ==================================================== */}
      {/* ERROR */}
      {/* ==================================================== */}

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">

          <p className="font-semibold text-red-700">
            Unable to load Half Day requests
          </p>

          <p className="mt-1 text-sm text-red-600">
            {errorMessage}
          </p>

        </div>
      )}

      {/* ==================================================== */}
      {/* SUMMARY */}
      {/* ==================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <SummaryCard
          title="Total Requests"
          value={totalRequests}
        />

        <SummaryCard
          title="Pending"
          value={pendingRequests}
        />

        <SummaryCard
          title="Approved"
          value={approvedRequests}
        />

        <SummaryCard
          title="Rejected"
          value={rejectedRequests}
        />

      </div>

      {/* ==================================================== */}
      {/* REQUEST TABLE */}
      {/* ==================================================== */}

      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">

        <div className="border-b border-gray-100 p-6">

          <h2 className="text-xl font-bold text-gray-900">
            Employee Half Day Requests
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Approve or reject pending requests.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1200px]">

            <thead className="bg-gray-50">

              <tr>

                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Employee
                </th>

                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Date
                </th>

                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Time Slot
                </th>

                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Reason
                </th>

                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Status
                </th>

                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Admin Remark
                </th>

                <th className="p-4 text-left text-sm font-semibold text-gray-600">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {requests.length ===
              0 ? (
                <tr>

                  <td
                    colSpan={7}
                    className="p-12 text-center"
                  >

                    <CalendarDays
                      size={42}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    <p className="font-medium text-gray-600">
                      No Half Day requests found.
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      New employee requests will appear here.
                    </p>

                  </td>

                </tr>
              ) : (
                requests.map(
                  (request) => (
                    <tr
                      key={
                        request.id
                      }
                      className="border-t transition hover:bg-gray-50"
                    >

                      {/* ================================== */}
                      {/* EMPLOYEE */}
                      {/* ================================== */}

                      <td className="p-4">

                        <div className="max-w-[250px]">

                          <p className="font-semibold text-gray-900">
                            {getEmployeeName(
                              request.employee
                            )}
                          </p>

                          <p className="mt-1 break-all text-xs text-gray-500">
                            {getEmployeeEmail(
                              request.employee
                            )}
                          </p>

                        </div>

                      </td>

                      {/* ================================== */}
                      {/* DATE */}
                      {/* ================================== */}

                      <td className="p-4">

                        <div className="flex items-center gap-2 whitespace-nowrap">

                          <CalendarDays
                            size={18}
                            className="text-violet-600"
                          />

                          <span className="font-medium">
                            {formatDate(
                              request.request_date
                            )}
                          </span>

                        </div>

                      </td>

                      {/* ================================== */}
                      {/* TIME SLOT */}
                      {/* ================================== */}

                      <td className="p-4">

                        <div className="flex items-center gap-2 whitespace-nowrap">

                          <Clock
                            size={18}
                            className="text-violet-600"
                          />

                          <span className="font-medium">
                            {getSlot(
                              request
                            )}
                          </span>

                        </div>

                      </td>

                      {/* ================================== */}
                      {/* REASON */}
                      {/* ================================== */}

                      <td className="max-w-[280px] p-4">

                        <p className="break-words text-sm leading-6 text-gray-600">
                          {request.reason ||
                            "--"}
                        </p>

                      </td>

                      {/* ================================== */}
                      {/* STATUS */}
                      {/* ================================== */}

                      <td className="p-4">

                        <StatusBadge
                          status={
                            request.status
                          }
                        />

                      </td>

                      {/* ================================== */}
                      {/* ADMIN REMARK */}
                      {/* ================================== */}

                      <td className="max-w-[250px] p-4">

                        {request.admin_remark ? (
                          <p className="break-words text-sm text-gray-600">
                            {
                              request.admin_remark
                            }
                          </p>
                        ) : (
                          <span className="text-sm text-gray-400">
                            --
                          </span>
                        )}

                      </td>

                      {/* ================================== */}
                      {/* ACTION */}
                      {/* ================================== */}

                      <td className="p-4">

                        {request.status ===
                        "Pending" ? (
                          <div className="space-y-3">

                            {/* APPROVE / REJECT */}

                            <div className="flex flex-wrap gap-2">

                              <button
                                type="button"
                                disabled={
                                  updatingId ===
                                  request.id
                                }
                                onClick={() =>
                                  updateRequest(
                                    request,
                                    "Approved"
                                  )
                                }
                                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >

                                {updatingId ===
                                request.id ? (
                                  <Loader2
                                    size={17}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Check
                                    size={17}
                                  />
                                )}

                                Approve

                              </button>

                              <button
                                type="button"
                                disabled={
                                  updatingId ===
                                  request.id
                                }
                                onClick={() =>
                                  updateRequest(
                                    request,
                                    "Rejected"
                                  )
                                }
                                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >

                                <X
                                  size={17}
                                />

                                Reject

                              </button>

                            </div>

                            {/* REJECT REMARK */}

                            {rejectId ===
                              request.id && (
                              <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 p-3">

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                  Rejection Remark
                                </label>

                                <textarea
                                  value={
                                    remark
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setRemark(
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  rows={3}
                                  placeholder="Enter optional reason..."
                                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                />

                                <div className="mt-3 flex gap-2">

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectId(
                                        null
                                      );

                                      setRemark(
                                        ""
                                      );
                                    }}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      updatingId ===
                                      request.id
                                    }
                                    onClick={() =>
                                      updateRequest(
                                        request,
                                        "Rejected"
                                      )
                                    }
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                  >
                                    Confirm Reject
                                  </button>

                                </div>

                              </div>
                            )}

                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Completed
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

// ============================================================
// EMPLOYEE NAME
// ============================================================

function getEmployeeName(
  employee:
    | Employee
    | null
    | undefined
) {
  if (!employee) {
    return "Unknown Employee";
  }

  // ----------------------------------------------------------
  // Common name fields
  // ----------------------------------------------------------

  const possibleNames = [
    employee.name,

    employee.full_name,

    employee.fullName,

    employee.employee_name,

    employee.employeeName,

    employee.emp_name,

    employee.display_name,

    employee.displayName,

    employee.staff_name,

    employee.staffName,
  ];

  for (
    const value of possibleNames
  ) {
    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  // ----------------------------------------------------------
  // First + Last
  // ----------------------------------------------------------

  const firstName =
    employee.first_name ||
    employee.firstName ||
    "";

  const lastName =
    employee.last_name ||
    employee.lastName ||
    "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  // ----------------------------------------------------------
  // Other possible field
  // ----------------------------------------------------------

  if (
    typeof employee.username ===
      "string" &&
    employee.username.trim()
  ) {
    return employee.username;
  }

  if (
    typeof employee.email ===
      "string" &&
    employee.email.trim()
  ) {
    return employee.email;
  }

  // ----------------------------------------------------------
  // Final fallback
  // ----------------------------------------------------------

  if (employee.id) {
    return `Employee ${String(
      employee.id
    ).slice(0, 8)}`;
  }

  return "Employee";
}

// ============================================================
// EMPLOYEE EMAIL
// ============================================================

function getEmployeeEmail(
  employee:
    | Employee
    | null
    | undefined
) {
  if (!employee) {
    return "Employee details unavailable";
  }

  const possibleEmails = [
    employee.email,

    employee.work_email,

    employee.workEmail,

    employee.official_email,

    employee.officialEmail,

    employee.company_email,

    employee.companyEmail,
  ];

  for (
    const value of possibleEmails
  ) {
    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  if (employee.id) {
    return `ID: ${employee.id}`;
  }

  return "Employee details unavailable";
}

// ============================================================
// TIME SLOT
// ============================================================

function getSlot(
  request: HalfDayRequest
) {
  if (
    request.slot &&
    request.slot.trim()
  ) {
    return request.slot;
  }

  if (
    request.start_time &&
    request.end_time
  ) {
    return `${formatTime(
      request.start_time
    )} - ${formatTime(
      request.end_time
    )}`;
  }

  return "--";
}

// ============================================================
// TIME FORMAT
// ============================================================

function formatTime(
  time: string
) {
  try {
    const [hours, minutes] =
      time.split(":");

    const date =
      new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  } catch {
    return time;
  }
}

// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(
  date: string
) {
  if (!date) {
    return "--";
  }

  try {
    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return date;
  }
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">

      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </p>

    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (
    status === "Approved"
  ) {
    return (
      <span className="inline-flex rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
        Approved
      </span>
    );
  }

  if (
    status === "Rejected"
  ) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-semibold text-yellow-700">
      Pending
    </span>
  );
}