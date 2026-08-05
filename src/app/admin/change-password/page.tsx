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

export default function ChangePasswordPage() {
  const router = useRouter();

  const supabase = createClient();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

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
      /*
       * -----------------------------------------
       * GET CURRENT USER
       * -----------------------------------------
       */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Unable to find logged in admin."
        );
      }

      if (!user.email) {
        throw new Error(
          "Admin email not found."
        );
      }

      /*
       * -----------------------------------------
       * VERIFY CURRENT PASSWORD
       *
       * We sign in again using the current
       * email + password.
       * -----------------------------------------
       */

      const {
        error: verifyError,
      } =
        await supabase.auth.signInWithPassword({
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

      /*
       * -----------------------------------------
       * UPDATE PASSWORD
       * -----------------------------------------
       */

      const {
        error: updateError,
      } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        throw updateError;
      }

      setMessage(
        "Password changed successfully. Logging you out..."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      /*
       * -----------------------------------------
       * LOGOUT
       * -----------------------------------------
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );

      const { error: logoutError } =
        await supabase.auth.signOut();

      if (logoutError) {
        console.error(
          "Logout Error:",
          logoutError
        );
      }

      /*
       * Your current logout redirects to "/",
       * so we keep the same behaviour here.
       */

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
          Update your admin account password.
        </p>
      </div>

      {/* CARD */}

      <div className="rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <KeyRound size={28} />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              Security
            </h2>

            <p className="text-sm text-gray-500">
              Choose a strong password for your
              admin account.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* CURRENT PASSWORD */}

          <div>
            <label className="mb-2 block font-medium">
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
                className="w-full rounded-lg border py-3 pl-11 pr-12 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
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
            <label className="mb-2 block font-medium">
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
                className="w-full rounded-lg border py-3 pl-11 pr-12 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
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
              Use at least 8 characters.
            </p>
          </div>

          {/* CONFIRM PASSWORD */}

          <div>
            <label className="mb-2 block font-medium">
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
                className="w-full rounded-lg border py-3 pl-11 pr-12 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
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

          {/* ERROR */}

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          {/* SUCCESS */}

          {message && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              {message}
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