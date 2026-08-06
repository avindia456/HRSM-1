import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
 import { createClient } from "@/lib/supabase/server";
export default async function EmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  // =========================================================
  // GET EMPLOYEE
  // =========================================================

  const { data: employee, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !employee) {
    notFound();
  }

  // =========================================================
  // DOCUMENTS
  // =========================================================

  const documents = [
    {
      label: "Aadhaar",
      url: employee.aadhaar_url,
    },
    {
      label: "PAN",
      url: employee.pan_file_url,
    },
    {
      label: "Resume",
      url: employee.resume_url,
    },
    {
      label: "Offer Letter",
      url: employee.offer_letter_url,
    },
    {
      label: "10th Marksheet",
      url: employee.tenth_url,
    },
    {
      label: "12th Marksheet",
      url: employee.twelfth_url,
    },
    {
      label: "Graduation Certificate",
      url: employee.graduation_url,
    },
  ];

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="w-full space-y-5 p-4 sm:p-5 lg:p-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="rounded-xl bg-white p-4 shadow sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Employee Profile */}

          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* Profile Photo */}

            {employee.profile_photo_url ? (
              <Image
                src={employee.profile_photo_url}
                alt={employee.full_name || "Employee"}
                width={120}
                height={120}
                className="h-24 w-24 shrink-0 rounded-full border object-cover sm:h-28 sm:w-28"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-violet-100 text-3xl font-bold text-violet-700 sm:h-28 sm:w-28">
                {employee.full_name?.charAt(0)?.toUpperCase() || "E"}
              </div>
            )}

            {/* Employee Info */}

            <div className="min-w-0">
              <h1 className="break-words text-2xl font-bold text-gray-900 sm:text-3xl">
                {employee.full_name || "Employee"}
              </h1>

              <p className="mt-1 break-words text-sm text-gray-500 sm:text-base">
                {employee.designation || "No Designation"}
              </p>

              <p className="mt-1 break-all text-sm text-gray-500">
                {employee.email || "--"}
              </p>

              <span
                className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                  employee.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {employee.status || "Unknown"}
              </span>
            </div>
          </div>

          {/* Edit Button */}

          <Link
            href={`/admin/employees/${employee.id}/edit`}
            className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-3 font-medium text-white transition hover:bg-violet-700 sm:w-auto"
          >
            <Pencil size={18} />
            Edit Employee
          </Link>
        </div>
      </div>

      {/* =====================================================
          PERSONAL INFORMATION
      ===================================================== */}

      <div className="rounded-xl bg-white p-4 shadow sm:p-6">
        <h2 className="mb-5 text-xl font-bold text-gray-900">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          <InfoItem
            label="Employee Code"
            value={employee.employee_code}
          />

          <InfoItem
            label="Email"
            value={employee.email}
          />

          <InfoItem
            label="Phone"
            value={employee.phone}
          />

          <InfoItem
            label="Gender"
            value={employee.gender}
          />

          <InfoItem
            label="Date of Birth"
            value={employee.dob}
          />

          <InfoItem
            label="Blood Group"
            value={employee.blood_group}
          />

          <InfoItem
            label="Emergency Contact"
            value={employee.emergency_contact}
          />

          <InfoItem
            label="Address"
            value={employee.address}
          />
        </div>
      </div>

      {/* =====================================================
          COMPANY INFORMATION
      ===================================================== */}

      <div className="rounded-xl bg-white p-4 shadow sm:p-6">
        <h2 className="mb-5 text-xl font-bold text-gray-900">
          Company Information
        </h2>

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          <InfoItem
            label="Department"
            value={employee.department}
          />

          <InfoItem
            label="Designation"
            value={employee.designation}
          />

          <InfoItem
            label="Reporting Manager"
            value={employee.reporting_manager}
          />

          <InfoItem
            label="Employment Type"
            value={employee.employment_type}
          />

          <InfoItem
            label="Joining Date"
            value={employee.joining_date}
          />

          <InfoItem
            label="Status"
            value={employee.status}
          />
        </div>
      </div>

      {/* =====================================================
          PAYROLL & BANK
      ===================================================== */}

      <div className="rounded-xl bg-white p-4 shadow sm:p-6">
        <h2 className="mb-5 text-xl font-bold text-gray-900">
          Payroll & Bank Details
        </h2>

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          <InfoItem
            label="Salary"
            value={
              employee.salary
                ? `₹ ${employee.salary}`
                : "--"
            }
          />

          <InfoItem
            label="Bank"
            value={employee.bank_name}
          />

          <InfoItem
            label="Account Number"
            value={employee.account_number}
          />

          <InfoItem
            label="IFSC"
            value={employee.ifsc_code}
          />

          <InfoItem
            label="PAN Number"
            value={employee.pan_number}
          />
        </div>
      </div>

      {/* =====================================================
          DOCUMENTS
      ===================================================== */}

      <div className="rounded-xl bg-white p-4 shadow sm:p-6">
        <h2 className="mb-5 text-xl font-bold text-gray-900">
          Documents
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {documents.map((doc) => (
            <div
              key={doc.label}
              className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-semibold text-gray-800">
                {doc.label}
              </span>

              {doc.url ? (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit font-medium text-blue-600 hover:underline"
                >
                  View Document
                </a>
              ) : (
                <span className="text-sm text-gray-400">
                  Not Uploaded
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// INFO ITEM
// =========================================================

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="min-w-0 border-b border-gray-100 pb-3">
      <p className="mb-1 text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="break-words font-semibold text-gray-900">
        {value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
          ? value
          : "--"}
      </p>
    </div>
  );
}