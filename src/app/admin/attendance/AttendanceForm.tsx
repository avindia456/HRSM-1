"use client";

import AttendanceTable from "./AttendanceTable";

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-gray-500">
          View employee attendance records.
        </p>
      </div>

      <AttendanceTable />
    </div>
  );
}