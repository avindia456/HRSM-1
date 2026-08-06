"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface Employee {
  id: string;
  full_name: string;
  employee_code: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  blood_group: string;
  address: string;
  emergency_contact: string;

  department: string;
  designation: string;
  role: string;
  employment_type: string;
  reporting_manager: string;
  joining_date: string;
  shift_type: string;
  office_start_time: string;
  status: string;

  profile_photo_url: string;
}

export default function EmployeeProfile() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

const [attendance, setAttendance] = useState({
  present: 0,
  late: 0,
  halfDay: 0,
  leave: 0,
  wfh: 0,
  workingHours: "0 hrs",
});

 const [leave, setLeave] = useState({
  total: 0,
  used: 0,
  pending: 0,
  remaining: 0,
});

  const [wfh, setWfh] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("email", user.email)
      .single();

    if (error || !data) {
      console.error(error);
      setLoading(false);
      return;
    }

    setEmployee(data);

    await loadAttendance(data.id);
    await loadLeave(data.id);
    await loadWFH(data.id);

    setLoading(false);
  }
async function loadAttendance(employeeId: string) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employeeId);

  if (error || !data) {
    console.error(error);
    return;
  }

 const present = data.filter(
  (a: any) => a.status === "Present"
).length;

 const halfDay = data.filter(
  (a: any) => a.status === "Half Day"
).length;

const late = data.filter(
  (a: any) => a.late_mark === true
).length;

  setAttendance((prev) => ({
    ...prev,
    present,
    halfDay,
    late,
  }));
}
async function loadLeave(employeeId: string) {
  const { data, error } = await supabase
    .from("leaves")
    .select("*")
    .eq("employee_id", employeeId);

  if (error || !data) {
    console.error(error);
    return;
  }

  const total = data.length;

const approved = data.filter(
  (l: any) => l.status === "Approved"
).length;

const pending = data.filter(
  (l: any) => l.status === "Pending"
).length;

  setLeave({
    total,
    used: approved,
    pending,
    remaining: Math.max(total - approved, 0),
  });

  setAttendance((prev) => ({
    ...prev,
    leave: approved,
  }));
}
  async function loadWFH(employeeId: string) {
  const { data, error } = await supabase
    .from("work_from_home")
    .select("*")
    .eq("employee_id", employeeId);

  if (error || !data) {
    console.error(error);
    return;
  }

  const total = data.length;
  const approved = data.filter(
  (r: any) => r.status === "Approved"
).length;
 const pending = data.filter(
  (r: any) => r.status === "Pending"
).length;
  const rejected = data.filter(
  (r: any) => r.status === "Rejected"
).length;

  setWfh({
    total,
    approved,
    pending,
    rejected,
  });

  setAttendance((prev) => ({
    ...prev,
    wfh: approved,
  }));
}

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2 className="text-xl font-semibold">
          Loading Profile...
        </h2>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2 className="text-xl font-semibold">
          Profile not found.
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">

      {/* Profile Header */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex flex-col md:flex-row gap-8 items-center">

          <img
            src={
              employee.profile_photo_url ||
              "https://placehold.co/200x200"
            }
            alt="Profile"
            className="w-40 h-40 rounded-full border-4 border-violet-600 object-cover"
          />

          <div> 

            <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
              {employee.full_name}
            </h1>

            <p className="text-xl text-gray-500 mt-2">
              {employee.designation}
            </p>

            <p className="text-gray-500">
              {employee.department}
            </p>

            <div className="flex gap-3 mt-4">

              <span className="bg-violet-100 text-violet-700 px-4 py-2 rounded-full">
                {employee.employee_code}
              </span>

              <span className="text-green-700 px-4 py-2 rounded-full">
                {employee.status}
              </span>

            </div>

          </div>

        </div>

      </div>    
            {/* Personal Information */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h2 className="text-2xl font-bold mb-6">
          👤 Personal Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Info title="Full Name" value={employee.full_name} />
          <Info title="Employee Code" value={employee.employee_code} />

          <Info title="Email" value={employee.email} />
          <Info title="Phone" value={employee.phone} />

          <Info title="Gender" value={employee.gender} />
          <Info title="Date of Birth" value={employee.dob} />

          <Info title="Blood Group" value={employee.blood_group} />
          <Info
            title="Emergency Contact"
            value={employee.emergency_contact}
          />

          <div className="md:col-span-2">
            <Info
              title="Address"
              value={employee.address}
            />
          </div>

        </div>

      </div>

      {/* Company Information */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h2 className="text-2xl font-bold mb-6">
          🏢 Company Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Info
            title="Department"
            value={employee.department}
          />

          <Info
            title="Designation"
            value={employee.designation}
          />

          <Info
            title="Role"
            value={employee.role}
          />

          <Info
            title="Employment Type"
            value={employee.employment_type}
          />

          <Info
            title="Reporting Manager"
            value={employee.reporting_manager}
          />

          <Info
            title="Joining Date"
            value={employee.joining_date}
          />

          <Info
            title="Shift Type"
            value={employee.shift_type}
          />

          <Info
            title="Office Start Time"
            value={employee.office_start_time}
          />

          <Info
            title="Status"
            value={employee.status}
          />
          </div>
</div>
      {/* Attendance Summary */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h2 className="text-2xl font-bold mb-6">
          📊 Attendance Summary
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">

          <Card
            title="Present Days"
            value={attendance.present}
          />

          <Card
            title="Late Marks"
            value={attendance.late}
          />

          <Card
            title="Half Days"
            value={attendance.halfDay}
          />

          <Card
            title="WFH Days"
            value={attendance.wfh}
          />

          <Card
            title="Leave Days"
            value={attendance.leave}
          />

          <Card
            title="Working Hours"
            value={attendance.workingHours}
          />

        </div>

      </div>

      {/* Leave Summary */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h2 className="text-2xl font-bold mb-6">
          🏖️ Leave Summary
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          <Card
            title="Total Leave"
            value={leave.total}
          />

          <Card
            title="Used"
            value={leave.used}
          />

          <Card
            title="Remaining"
            value={leave.remaining}
          />

          <Card
            title="Pending"
            value={leave.pending}
          />

        </div>

      </div>

      {/* Work From Home Summary */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h2 className="text-2xl font-bold mb-6">
          🏠 Work From Home Summary
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          <Card
            title="Total WFH"
            value={wfh.total}
          />

          <Card
            title="Approved"
            value={wfh.approved}
          />

          <Card
            title="Pending"
            value={wfh.pending}
          />

          <Card
            title="Rejected"
            value={wfh.rejected}
          />

        </div>

      </div>
          </div>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">
        {title}
      </p>

      <p className="text-lg font-semibold text-gray-800">
        {value || "-"}
      </p>
    </div>
  );
}

function Card({      
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center hover:shadow-md transition">

      <p className="text-gray-500 text-sm">
        {title}
      </p>

      <h3 className="text-3xl font-bold text-violet-700 mt-3">
        {value}
      </h3>

    </div>
  );
}