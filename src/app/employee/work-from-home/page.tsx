"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function EmployeeWorkFromHomePage() {
  const router = useRouter();

  const [workDate, setWorkDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!workDate) {
      alert("Please select a WFH date.");
      return;
    }

    if (!reason.trim()) {
      alert("Please enter a reason.");
      return;
    }

    setLoading(true);

    try {
      // 1. Get logged-in session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        alert("Your session has expired. Please login again.");
        router.push("/login");
        return;
      }

      const user = session.user;

      console.log("Logged-in user:", user.id, user.email);

      // 2. Find employee
      const {
        data: employee,
        error: employeeError,
      } = await supabase
        .from("employees")
        .select("id, name, email")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (employeeError) {
        console.error("Employee fetch error:", employeeError);
        throw employeeError;
      }

      if (!employee) {
        alert(
          "Employee profile not found. Please contact the administrator."
        );
       return;
      }

      console.log("Employee:", employee);

      // 3. Check duplicate WFH request
      const {
        data: existingRequest,
        error: duplicateError,
      } = await supabase
        .from("work_from_home")
        .select("id")
        .eq("employee_id", employee.id)
        .eq("work_date", workDate)
        .maybeSingle();

      if (duplicateError) {
        console.error("Duplicate check error:", duplicateError);
        throw duplicateError;
      }

      if (existingRequest) {
        alert(
          "You have already submitted a WFH request for this date."
        );
       return;
      }

      // 4. Insert request
      const {
        data: request,
        error: insertError,
      } = await supabase
        .from("work_from_home")
        .insert({
          employee_id: employee.id,
          work_date: workDate,
          reason: reason.trim(),
          status: "Pending",
        })
        .select()
        .single();

      if (insertError) {
        console.error("WFH insert error:", insertError);
        throw insertError;
      }

      console.log("WFH request created:", request);

      alert("WFH request submitted successfully!");

      setWorkDate("");
      setReason("");

      router.refresh();
    } catch (error) {
      console.error("WFH submission failed:", error);

      alert(
        error instanceof Error
          ? `Unable to submit request: ${error.message}`
          : "Unable to submit WFH request."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-violet-700">
            Apply Work From Home
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Submit your work from home request for admin approval.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div>
              <label
                htmlFor="workDate"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                WFH Date
              </label>

              <input
                id="workDate"
                type="date"
                required
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            {/* Reason */}
            <div>
              <label
                htmlFor="reason"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Reason
              </label>

              <textarea
                id="reason"
                required
                rows={5}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us why you need to work from home..."
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 px-7 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}