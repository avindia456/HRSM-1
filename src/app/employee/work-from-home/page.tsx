"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function EmployeeWorkFromHomePage() {
  const router = useRouter();

  const [workDate, setWorkDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!workDate) {
      alert("Please select WFH date.");
      return;
    }

    if (!reason.trim()) {
      alert("Please enter a reason.");
      return;
    }

    setLoading(true);

    try {
      // --------------------------------------------------
      // GET LOGGED IN USER
      // --------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth Error:", userError);
        alert(`Unable to get logged in user: ${userError.message}`);
        return;
      }

      if (!user) {
        alert("Please login first.");
        return;
      }

      console.log("Logged in user:", user.id, user.email);

      // --------------------------------------------------
      // FIND EMPLOYEE
      // FIRST TRY auth_id
      // --------------------------------------------------

      let employeeId: string | null = null;

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
          "Employee auth_id lookup error:",
          authLookupError
        );
      }

      if (employeeByAuth?.id) {
        employeeId = employeeByAuth.id;
      }

      // --------------------------------------------------
      // FALLBACK: FIND EMPLOYEE USING EMAIL
      // --------------------------------------------------

      if (!employeeId && user.email) {
        const {
          data: employeeByEmail,
          error: emailLookupError,
        } = await supabase
          .from("employees")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();

        if (emailLookupError) {
          console.error(
            "Employee email lookup error:",
            emailLookupError
          );
        }

        if (employeeByEmail?.id) {
          employeeId = employeeByEmail.id;

          // ------------------------------------------------
          // OPTIONAL BUT USEFUL:
          // LINK THIS EMPLOYEE WITH AUTH USER
          // ------------------------------------------------

          const { error: linkError } = await supabase
            .from("employees")
            .update({
              auth_id: user.id,
            })
            .eq("id", employeeByEmail.id);

          if (linkError) {
            console.warn(
              "Could not update employee auth_id:",
              linkError
            );
          }
        }
      }

      // --------------------------------------------------
      // EMPLOYEE STILL NOT FOUND
      // --------------------------------------------------

      if (!employeeId) {
        console.error(
          "Employee not found for:",
          user.id,
          user.email
        );

        alert(
          "Employee record not found. Please contact administrator."
        );

        return;
      }

      console.log("Employee ID:", employeeId);

      // --------------------------------------------------
      // CHECK EXISTING WFH REQUEST
      // Prevent duplicate request for same date
      // --------------------------------------------------

      const {
        data: existingRequest,
        error: existingError,
      } = await supabase
        .from("work_from_home")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("work_date", workDate)
        .maybeSingle();

      if (existingError) {
        console.error(
          "Existing WFH check error:",
          existingError
        );
      }

      if (existingRequest) {
        alert(
          "You have already submitted a WFH request for this date."
        );

        return;
      }

      // --------------------------------------------------
      // INSERT WFH REQUEST
      // --------------------------------------------------

      const {
        data: insertedRequest,
        error: insertError,
      } = await supabase
        .from("work_from_home")
        .insert({
          employee_id: employeeId,
          work_date: workDate,
          reason: reason.trim(),
          status: "Pending",
        })
        .select()
        .single();

      if (insertError) {
        console.error(
          "WFH Insert Error:",
          insertError
        );

        alert(
          `Unable to submit WFH request: ${insertError.message}`
        );

        return;
      }

      console.log(
        "WFH request created:",
        insertedRequest
      );

      // --------------------------------------------------
      // SUCCESS
      // --------------------------------------------------

      alert("WFH request submitted successfully!");

      setWorkDate("");
      setReason("");

      router.refresh();
    } catch (error) {
      console.error(
        "WFH Submit Unexpected Error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting WFH request."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-3xl font-bold text-violet-700">
        Apply Work From Home
      </h1>

      <div className="rounded-xl bg-white p-8 shadow">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* WFH DATE */}

          <div>
            <label className="mb-2 block font-medium">
              WFH Date
            </label>

            <input
              type="date"
              required
              value={workDate}
              onChange={(e) =>
                setWorkDate(e.target.value)
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          {/* REASON */}

          <div>
            <label className="mb-2 block font-medium">
              Reason
            </label>

            <textarea
              required
              rows={5}
              value={reason}
              onChange={(e) =>
                setReason(e.target.value)
              }
              placeholder="Enter reason..."
              className="w-full rounded-lg border p-3"
            />
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-violet-600 px-8 py-3 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Submitting..."
              : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}