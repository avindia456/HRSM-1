"use client";

import { useRouter } from "next/navigation";

export default function WfhActions({
  id,
}: {
  id: string;
}) {
  const router = useRouter();

  async function updateStatus(status: "Approved" | "Rejected") {
    const res = await fetch("/api/work-from-home/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        status,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => updateStatus("Approved")}
        className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
      >
        Approve
      </button>

      <button
        onClick={() => updateStatus("Rejected")}
        className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
      >
        Reject
      </button>
    </div>
  );
}