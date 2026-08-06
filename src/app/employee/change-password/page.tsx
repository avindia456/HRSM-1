"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function EmployeeChangePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setErrorMessage(
        "Please fill all password fields."
      );
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        "New password and confirm password do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage(
        "New password must be different from current password."
      );
      return;
    }

    setLoading(true);

    try {
      // -----------------------------------------
      // GET LOGGED IN USER
      // -----------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Unable to find logged in employee."
        );
      }

      if (!user.email) {
        throw new Error(
          "Employee email not found."
        );
      }

      // -----------------------------------------
      // VERIFY CURRENT PASSWORD
      // -----------------------------------------

      const {
        error: verifyError,
      } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        setErrorMessage(
          "Current password is incorrect."
        );

        setLoading(false);
        return;
      }

      // -----------------------------------------
      // UPDATE PASSWORD
      // -----------------------------------------

      const {
        error: updateError,
      } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // -----------------------------------------
      // SUCCESS
      // -----------------------------------------

      setSuccessMessage(
        "Password changed successfully. Please login again."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Give user a moment to see success message
      await new Promise((resolve) =>
        setTimeout(resolve, 1500)
      );

      // -----------------------------------------
      // LOGOUT
      // -----------------------------------------

      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) {
        console.error(
          "Sign Out Error:",
          signOutError
        );
      }

      // -----------------------------------------
      // REDIRECT TO LOGIN
      // -----------------------------------------

      router.replace("/");
      router.refresh();
    } catch (error: any) {
      console.error(
        "Change Password Error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to change password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Change Password
        </h1>

        <p className="mt-1 text-gray-500">
          Update your employee account password.
        </p>
      </div>

      {/* PASSWORD CARD */}

      <div className="rounded-xl bg-white p-8 shadow-lg">
        {/* CARD HEADER */}

        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <KeyRound size={28} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Account Security
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter your current password and choose
              a new password.
            </p>
          </div>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* CURRENT PASSWORD */}

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Current Password
            </label>

            <div className="relative">
              <Lock
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type={
                  showCurrentPassword
                    ? "text"
                    : "password"
                }
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(
                    e.target.value
                  )
                }
                placeholder="Enter current password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-12 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />

              <button
                type="button"
                onClick={() =>
                  setShowCurrentPassword(
                    (value) => !value
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
              >
                {showCurrentPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* NEW PASSWORD */}

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              New Password
            </label>

            <div className="relative">
              <Lock
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type={
                  showNewPassword
                    ? "text"
                    : "password"
                }
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(
                    e.target.value
                  )
                }
                placeholder="Enter new password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-12 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />

              <button
                type="button"
                onClick={() =>
                  setShowNewPassword(
                    (value) => !value
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
              >
                {showNewPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Password must contain at least 8
              characters.
            </p>
          </div>

          {/* CONFIRM PASSWORD */}

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Confirm New Password
            </label>

            <div className="relative">
              <Lock
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-12 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (value) => !value
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* ERROR MESSAGE */}

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          {/* SUCCESS MESSAGE */}

          {successMessage && (
            <div className="rounded-lg border border-green-200 p-4 text-sm font-medium text-green-700">
              {successMessage}
            </div>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Changing Password..."
              : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}