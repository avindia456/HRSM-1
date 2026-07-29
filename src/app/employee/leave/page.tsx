"use client";

import LeaveForm from "./LeaveForm";

export default function LeavePage() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">
        Apply Leave
      </h1>

      <p className="text-gray-500 mb-8">
        Submit your leave request.
      </p>

      <LeaveForm />
    </div>
  );
}