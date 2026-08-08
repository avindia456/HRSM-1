"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import {
  CalendarDays,
  Clock,
  History,
  Loader2,
  Send,
} from "lucide-react";

const supabase = createClient();

type HalfDayRequest = {
  id: string;
  request_date: string;
  slot: string;
  start_time: string;
  end_time: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  admin_remark: string | null;
  approved_at: string | null;
  created_at: string;
};

const SLOTS = {
  morning: {
    label: "10:00 AM - 2:30 PM",
    start: "10:00",
    end: "14:30",
  },

  evening: {
    label: "1:00 PM - 6:30 PM",
    start: "13:00",
    end: "18:30",
  },
};

function getToday() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function EmployeeHalfDayPage() {
  const [employeeId, setEmployeeId] =
    useState<string | null>(null);

  const [requestDate, setRequestDate] =
    useState(getToday());

  const [selectedSlot, setSelectedSlot] =
    useState<"morning" | "evening">("morning");

  const [reason, setReason] =
    useState("");

  const [history, setHistory] =
    useState<HalfDayRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  // =====================================================
  // GET EMPLOYEE
  // =====================================================

  const getEmployee = useCallback(async () => {
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

    let employee = null;

    const {
      data: byAuth,
      error: authError,
    } = await supabase
      .from("employees")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (authError) {
      console.error(
        "Employee auth lookup:",
        authError.message
      );
    }

    employee = byAuth;

    if (!employee && user.email) {
      const {
        data: byEmail,
        error: emailError,
      } = await supabase
        .from("employees")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (emailError) {
        throw new Error(emailError.message);
      }

      employee = byEmail;
    }

    if (!employee) {
      throw new Error(
        "Employee record not found."
      );
    }

    return employee.id;
  }, []);

  // =====================================================
  // LOAD HISTORY
  // =====================================================

  const loadHistory = useCallback(
    async (id: string) => {
      const {
        data,
        error,
      } = await supabase
        .from("half_day_requests")
        .select("*")
        .eq("employee_id", id)
        .order("request_date", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      setHistory(
        (data ?? []) as HalfDayRequest[]
      );
    },
    []
  );

  // =====================================================
  // INITIALIZE
  // =====================================================

  useEffect(() => {
    async function initialize() {
      setLoading(true);

      try {
        const id =
          await getEmployee();

        setEmployeeId(id);

        await loadHistory(id);
      } catch (error) {
        console.error(
          "Half Day initialization:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load Half Day page."
        );
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [
    getEmployee,
    loadHistory,
  ]);

  // =====================================================
  // SUBMIT
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!employeeId) {
      alert("Employee not found.");
      return;
    }

    if (!requestDate) {
      alert("Please select a date.");
      return;
    }

    if (!reason.trim()) {
      alert("Please enter a reason.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const slot =
        SLOTS[selectedSlot];

      // Check existing request
      const {
        data: existing,
        error: existingError,
      } = await supabase
        .from("half_day_requests")
        .select("id, status")
        .eq(
          "employee_id",
          employeeId
        )
        .eq(
          "request_date",
          requestDate
        )
        .maybeSingle();

      if (existingError) {
        throw new Error(
          existingError.message
        );
      }

      if (existing) {
        alert(
          `You already have a Half Day request for this date. Status: ${existing.status}`
        );

        return;
      }

      // Create request
      const {
        data,
        error,
      } = await supabase
        .from("half_day_requests")
        .insert({
          employee_id:
            employeeId,

          request_date:
            requestDate,

          slot: slot.label,

          start_time:
            slot.start,

          end_time:
            slot.end,

          reason:
            reason.trim(),

          status: "Pending",
        })
        .select()
        .single();

      if (error) {
        throw new Error(
          error.message
        );
      }

      console.log(
        "Half Day request created:",
        data
      );

      setReason("");

      await loadHistory(
        employeeId
      );

      alert(
        "Half Day request submitted successfully!"
      );
    } catch (error) {
      console.error(
        "Half Day submit error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to submit Half Day request.";

      setErrorMessage(message);

      alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />

          Loading Half Day...
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

      {/* HEADER */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-violet-700">
          Half Day Request
        </h1>

        <p className="mt-2 text-gray-500">
          Apply for a half-day schedule and wait for
          admin approval.
        </p>
      </div>

      {/* ERROR */}

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {errorMessage}
        </div>
      )}

      {/* FORM */}

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">

        <form
          onSubmit={handleSubmit}
          className="space-y-7"
        >

          {/* DATE */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Half Day Date
            </label>

            <div className="relative">
              <CalendarDays
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="date"
                value={requestDate}
                min={getToday()}
                onChange={(event) =>
                  setRequestDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>

          {/* SLOT */}

          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              Select Time Slot
            </label>

            <div className="grid gap-4 md:grid-cols-2">

              {/* MORNING */}

              <button
                type="button"
                onClick={() =>
                  setSelectedSlot(
                    "morning"
                  )
                }
                className={`rounded-xl border-2 p-5 text-left transition ${
                  selectedSlot === "morning"
                    ? "border-violet-600 bg-violet-50"
                    : "border-gray-200 hover:border-violet-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock
                    className={
                      selectedSlot ===
                      "morning"
                        ? "text-violet-600"
                        : "text-gray-400"
                    }
                  />

                  <div>
                    <p className="font-semibold text-gray-900">
                      10:00 AM - 2:30 PM
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      First Half
                    </p>
                  </div>
                </div>
              </button>

              {/* EVENING */}

              <button
                type="button"
                onClick={() =>
                  setSelectedSlot(
                    "evening"
                  )
                }
                className={`rounded-xl border-2 p-5 text-left transition ${
                  selectedSlot === "evening"
                    ? "border-violet-600 bg-violet-50"
                    : "border-gray-200 hover:border-violet-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock
                    className={
                      selectedSlot ===
                      "evening"
                        ? "text-violet-600"
                        : "text-gray-400"
                    }
                  />

                  <div>
                    <p className="font-semibold text-gray-900">
                      1:00 PM - 6:30 PM
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Second Half
                    </p>
                  </div>
                </div>
              </button>

            </div>
          </div>

          {/* REASON */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Reason
            </label>

            <textarea
              rows={5}
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
              placeholder="Enter reason for Half Day..."
              className="w-full resize-none rounded-xl border border-gray-300 p-4 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2
                  size={19}
                  className="animate-spin"
                />

                Submitting...
              </>
            ) : (
              <>
                <Send size={19} />

                Submit Half Day Request
              </>
            )}
          </button>

        </form>
      </div>

      {/* HISTORY */}

      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="flex items-center gap-3 border-b border-gray-100 p-6">
          <History className="text-violet-600" />

          <div>
            <h2 className="text-xl font-bold">
              Half Day History
            </h2>

            <p className="text-sm text-gray-500">
              Track your Half Day requests.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[800px]">

            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-left">
                  Time Slot
                </th>

                <th className="p-4 text-left">
                  Reason
                </th>

                <th className="p-4 text-left">
                  Status
                </th>

                <th className="p-4 text-left">
                  Admin Remark
                </th>
              </tr>
            </thead>

            <tbody>

              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-gray-500"
                  >
                    No Half Day requests yet.
                  </td>
                </tr>
              ) : (
                history.map(
                  (request) => (
                    <tr
                      key={request.id}
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="p-4 font-medium">
                        {new Date(
                          `${request.request_date}T00:00:00`
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </td>

                      <td className="p-4">
                        {request.slot}
                      </td>

                      <td className="max-w-xs p-4">
                        {request.reason}
                      </td>

                      <td className="p-4">
                        <StatusBadge
                          status={
                            request.status
                          }
                        />
                      </td>

                      <td className="p-4 text-sm text-gray-500">
                        {request.admin_remark ||
                          "--"}
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

// =====================================================
// STATUS
// =====================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === "Approved") {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        Approved
      </span>
    );
  }

  if (status === "Rejected") {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Rejected
      </span>
    );
  }

  return (
    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
      Pending
    </span>
  );
}