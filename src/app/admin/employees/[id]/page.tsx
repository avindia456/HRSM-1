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

  const { data: employee, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !employee) {
    notFound();
  }

  const documents = [
    { label: "Aadhaar", url: employee.aadhaar_url },
    { label: "PAN", url: employee.pan_file_url },
    { label: "Resume", url: employee.resume_url },
    { label: "Offer Letter", url: employee.offer_letter_url },
    { label: "10th Marksheet", url: employee.tenth_url },
    { label: "12th Marksheet", url: employee.twelfth_url },
    { label: "Graduation Certificate", url: employee.graduation_url },
  ];

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {employee.profile_photo_url ? (
            <Image
              src={employee.profile_photo_url}
              alt={employee.full_name}
              width={120}
              height={120}
              className="h-28 w-28 rounded-full object-cover border"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-violet-100 text-4xl font-bold text-violet-700">
              {employee.full_name?.charAt(0)}
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold">{employee.full_name}</h1>
            <p className="text-gray-500">
              {employee.designation} • {employee.department}
            </p>

            <span
              className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                employee.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {employee.status}
            </span>
          </div>
        </div>

        <Link
          href={`/admin/employees/${employee.id}/edit`}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-3 text-white hover:bg-violet-700"
        >
          <Pencil size={18} />
          Edit Employee
        </Link>
      </div>

      {/* Personal */}
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Personal Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <p><b>Employee Code:</b> {employee.employee_code}</p>
          <p><b>Email:</b> {employee.email}</p>

          <p><b>Phone:</b> {employee.phone}</p>
          <p><b>Gender:</b> {employee.gender}</p>

          <p><b>Date of Birth:</b> {employee.dob}</p>
          <p><b>Blood Group:</b> {employee.blood_group}</p>

          <p><b>Emergency Contact:</b> {employee.emergency_contact}</p>
          <p><b>Address:</b> {employee.address}</p>
        </div>
      </div>

      {/* Company */}
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Company Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <p><b>Department:</b> {employee.department}</p>
          <p><b>Designation:</b> {employee.designation}</p>

          <p><b>Reporting Manager:</b> {employee.reporting_manager}</p>
          <p><b>Employment Type:</b> {employee.employment_type}</p>

          <p><b>Joining Date:</b> {employee.joining_date}</p>
          <p><b>Status:</b> {employee.status}</p>
        </div>
      </div>

      {/* Payroll */}
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Payroll & Bank Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <p><b>Salary:</b> ₹ {employee.salary}</p>
          <p><b>Bank:</b> {employee.bank_name}</p>

          <p><b>Account Number:</b> {employee.account_number}</p>
          <p><b>IFSC:</b> {employee.ifsc_code}</p>

          <p><b>PAN Number:</b> {employee.pan_number}</p>
        </div>
      </div>

      {/* Documents */}
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Documents</h2>

        <div className="grid grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div key={doc.label}>
              <b>{doc.label}:</b>{" "}
              {doc.url ? (
                <a
                  href={doc.url}
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  View Document
                </a>
              ) : (
                <span className="text-gray-400">Not Uploaded</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}