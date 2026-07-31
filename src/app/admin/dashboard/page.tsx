import { createClient } from "@/lib/supabase/server";
import StatsCard from "@/components/dashboard/StatsCard";
import AdminAttendance from "@/components/Admin/AdminAttendance";
import {
  Users,
  Clock3,
  House,
  CalendarDays,
 } from "lucide-react";
export default async function AdminDashboard() {
  const supabase = await createClient();

  const { count: totalEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true });

  const today = new Date().toISOString().split("T")[0];

const { count: presentToday } = await supabase
  .from("attendance")
  .select("*", { count: "exact", head: true })
  .eq("attendance_date", today)
  .in("status", ["Working", "Present", "Half Day"]);

  const { count: leaveRequests } = await supabase
    .from("leaves")
    .select("*", { count: "exact", head: true });
const { count: wfhToday } = await supabase
  .from("attendance")
  .select("*", { count: "exact", head: true })
  .eq("attendance_date", today)
  .eq("status", "WFH");
  const { data: employees } = await supabase
    .from("employees")
    .select("full_name, designation, department")
    .limit(5);
return (
  <>
    <h1 className="mb-8 text-4xl font-bold text-violet-700">
      Admin Dashboard
    </h1>

    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Employees"
        value={totalEmployees ?? 0}
        icon={Users}
        color="bg-blue-500"
      />

      <StatsCard
        title="Present Today"
        value={presentToday ?? 0}
        icon={Clock3}
        color="bg-green-500"
      />

      <StatsCard
        title="WFH Today"
        value={wfhToday ?? 0}
        icon={House}
        color="bg-orange-500"
      />

      <StatsCard
        title="Leave Requests"
        value={leaveRequests ?? 0}
        icon={CalendarDays}
        color="bg-red-500"
      />
    </div>
<AdminAttendance />
    <div className="mt-10 rounded-xl bg-white p-6 shadow">
      <h2 className="mb-5 text-2xl font-semibold">
        Recent Employees
      </h2>

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="py-3 text-left">Name</th>
            <th className="text-left">Designation</th>
            <th className="text-left">Department</th>
          </tr>
        </thead>

        <tbody>
          {employees?.map((employee, index) => (
            <tr key={index} className="border-b">
              <td className="py-3">{employee.full_name}</td>
              <td>{employee.designation}</td>
              <td>{employee.department}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
 );
}