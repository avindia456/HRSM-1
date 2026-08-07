"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Employee = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
};

type WFHRequest = {
  id: string;
  employee_id: string;
  work_date: string;
  reason: string;
  status: string;
  created_at?: string | null;
  employee?: Employee | null;
};

export default function AdminWorkFromHomePage() {
  const [requests, setRequests] = useState<WFHRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // FETCH ALL WFH REQUESTS
  // =====================================================

  const fetchRequests = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage("");

    try {
      // -------------------------------------------------
      // 1. FETCH WFH REQUESTS
      // -------------------------------------------------

      const {
        data: wfhData,
        error: wfhError,
      } = await supabase
        .from("work_from_home")
        .select("*");

      if (wfhError) {
        console.error("WFH ERROR MESSAGE:", wfhError.message);
        console.error("WFH ERROR CODE:", wfhError.code);
        console.error("WFH ERROR DETAILS:", wfhError.details);
        console.error("WFH ERROR HINT:", wfhError.hint);

        setErrorMessage(
          wfhError.message || "Unable to load WFH requests."
        );

        return;
      }

      console.log("ADMIN WFH RAW DATA:", wfhData);

      // No requests
      if (!wfhData || wfhData.length === 0) {
        setRequests([]);
        return;
      }

      // -------------------------------------------------
      // 2. SORT REQUESTS
      // -------------------------------------------------

      const sortedWFH = [...wfhData].sort((a, b) => {
        const aTime = a.created_at
          ? new Date(a.created_at).getTime()
          : 0;

        const bTime = b.created_at
          ? new Date(b.created_at).getTime()
          : 0;

        return bTime - aTime;
      });

      // -------------------------------------------------
      // 3. GET UNIQUE EMPLOYEE IDs
      // -------------------------------------------------

      const employeeIds = [
        ...new Set(
          sortedWFH
            .map((request) => request.employee_id)
            .filter(Boolean)
        ),
      ];

      console.log("Employee IDs:", employeeIds);

      // -------------------------------------------------
      // 4. FETCH EMPLOYEES
      // -------------------------------------------------

      let employees: Employee[] = [];

      if (employeeIds.length > 0) {
        const {
          data: employeeData,
          error: employeeError,
        } = await supabase
          .from("employees")
          .select("*")
          .in("id", employeeIds);

        if (employeeError) {
          console.error(
            "EMPLOYEE ERROR MESSAGE:",
            employeeError.message
          );
          console.error(
            "EMPLOYEE ERROR CODE:",
            employeeError.code
          );
          console.error(
            "EMPLOYEE ERROR DETAILS:",
            employeeError.details
          );
          console.error(
            "EMPLOYEE ERROR HINT:",
            employeeError.hint
          );

          // Don't stop showing WFH requests just because
          // employee information could not be fetched.
        } else {
          employees = (employeeData ?? []) as Employee[];
        }
      }

      console.log("ADMIN EMPLOYEES:", employees);

      // -------------------------------------------------
      // 5. COMBINE WFH + EMPLOYEE
      // -------------------------------------------------

      const finalRequests: WFHRequest[] = sortedWFH.map(
        (request) => {
          const employee =
            employees.find(
              (item) => item.id === request.employee_id
            ) ?? null;

          return {
            ...request,
            employee,
          };
        }
      );

      console.log("FINAL ADMIN WFH:", finalRequests);

      setRequests(finalRequests);
    } catch (error) {
      console.error("Unexpected WFH fetch error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unexpected error while loading WFH requests.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // =====================================================
  // INITIAL FETCH
  // =====================================================

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  async function updateStatus(
    requestId: string,
    newStatus: "Approved" | "Rejected"
  ) {
    setUpdatingId(requestId);
    setErrorMessage("");

    try {
      const {
        data,
        error,
      } = await supabase
        .from("work_from_home")
        .update({
          status: newStatus,
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) {
        console.error(
          "UPDATE ERROR MESSAGE:",
          error.message
        );
        console.error(
          "UPDATE ERROR CODE:",
          error.code
        );
        console.error(
          "UPDATE ERROR DETAILS:",
          error.details
        );
        console.error(
          "UPDATE ERROR HINT:",
          error.hint
        );

        alert(
          `Unable to update request: ${error.message}`
        );

        return;
      }

      console.log("UPDATED WFH:", data);

      // Update UI immediately
      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: newStatus,
              }
            : request
        )
      );
    } catch (error) {
      console.error(
        "Unexpected status update error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to update WFH request."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // =====================================================
  // DATE FORMATTER
  // =====================================================

  function formatDate(date?: string | null) {
    if (!date) return "-";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-white p-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />

              <p className="text-gray-600">
                Loading WFH requests...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">

        {/* ============================================= */}
        {/* HEADER */}
        {/* ============================================= */}

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Work From Home Requests
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Review employee WFH requests and approve or
              reject them.
            </p>
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => fetchRequests(true)}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* ============================================= */}
        {/* STATS */}
        {/* ============================================= */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Requests"
            value={requests.length}
          />

          <StatCard
            title="Pending"
            value={
              requests.filter(
                (request) =>
                  request.status?.toLowerCase() === "pending"
              ).length
            }
          />

          <StatCard
            title="Approved"
            value={
              requests.filter(
                (request) =>
                  request.status?.toLowerCase() ===
                  "approved"
              ).length
            }
          />

          <StatCard
            title="Rejected"
            value={
              requests.filter(
                (request) =>
                  request.status?.toLowerCase() ===
                  "rejected"
              ).length
            }
          />
        </div>

        {/* ============================================= */}
        {/* ERROR */}
        {/* ============================================= */}

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-700">
              Unable to load WFH requests
            </p>

            <p className="mt-1 text-sm text-red-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => fetchRequests(true)}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ============================================= */}
        {/* EMPTY STATE */}
        {/* ============================================= */}

        {!errorMessage && requests.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-2xl">
              🏠
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
              No WFH requests
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Employee WFH requests will appear here.
            </p>

            <button
              type="button"
              onClick={() => fetchRequests(true)}
              className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Refresh Requests
            </button>
          </div>
        )}

        {/* ============================================= */}
        {/* TABLE */}
        {/* ============================================= */}

        {requests.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Employee
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      WFH Date
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Reason
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {requests.map((request) => {
                    const employeeName =
                      request.employee?.name ||
                      request.employee?.full_name ||
                      "Unknown Employee";

                    const employeeEmail =
                      request.employee?.email || "-";

                    const isPending =
                      request.status?.toLowerCase() ===
                      "pending";

                    const isUpdating =
                      updatingId === request.id;

                    return (
                      <tr
                        key={request.id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* EMPLOYEE */}

                        <td className="px-6 py-5">
                          <p className="font-semibold text-gray-900">
                            {employeeName}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {employeeEmail}
                          </p>
                        </td>

                        {/* DATE */}

                        <td className="whitespace-nowrap px-6 py-5 text-sm font-medium text-gray-700">
                          {formatDate(request.work_date)}
                        </td>

                        {/* REASON */}

                        <td className="max-w-md px-6 py-5">
                          <p className="line-clamp-3 text-sm leading-6 text-gray-600">
                            {request.reason || "-"}
                          </p>
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">
                          <StatusBadge
                            status={request.status}
                          />
                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-5">
                          {isPending ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateStatus(
                                    request.id,
                                    "Approved"
                                  )
                                }
                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isUpdating
                                  ? "Updating..."
                                  : "Approve"}
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateStatus(
                                    request.id,
                                    "Rejected"
                                  )
                                }
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              No action required
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// STATUS BADGE
// =====================================================

function StatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const normalizedStatus =
    status?.toLowerCase() ?? "pending";

  if (normalizedStatus === "approved") {
    return (
      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        Approved
      </span>
    );
  }

  if (normalizedStatus === "rejected") {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
      Pending
    </span>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}