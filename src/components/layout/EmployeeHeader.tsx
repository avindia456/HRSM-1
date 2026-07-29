"use client";

import { Search, UserCircle2 } from "lucide-react";

export default function EmployeeHeader() {
  return (
    <header className="flex h-16 items-center justify-between rounded-xl bg-white px-6 shadow-sm">
      <div className="relative w-full max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-violet-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <UserCircle2 size={34} className="text-violet-700" />

        <div>
          <p className="font-semibold">Employee</p>
          <p className="text-sm text-gray-500">Employee Portal</p>
        </div>
      </div>
    </header>
  );
}