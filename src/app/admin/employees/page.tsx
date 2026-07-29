import Link from "next/link";
import { Plus, Eye, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DeleteEmployeeButton from "@/components/employee/DeleteEmployeeButton";

export default async function EmployeesPage() {
  const supabase = await createClient();

  const { data: employees, error } = await supabase
    .from("employees")
    .select(`
      id,
      employee_code,
      full_name,
      email,
      phone,
      department,
      designation,
      status
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Employees
          </h1>

          <p className="text-gray-500">
            Manage all employees
          </p>
        </div>

        <Link
          href="/admin/employees/new"
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-3 text-white transition hover:bg-violet-700"
        >
          <Plus size={18} />
          Add Employee
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-5 py-4 text-left">Code</th>
              <th className="px-5 py-4 text-left">Name</th>
              <th className="px-5 py-4 text-left">Email</th>
              <th className="px-5 py-4 text-left">Phone</th>
              
              <th className="px-5 py-4 text-left">Designation</th>
              
              <th className="px-5 py-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {employees?.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="py-12 text-center text-gray-500"
                >
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    {employee.employee_code}
                  </td>
                  <td className="px-5 py-4 font-medium">
                    {employee.full_name}
                  </td>

                  <td className="px-5 py-4">
                    {employee.email}
                  </td>

                  <td className="px-5 py-4">
                    {employee.phone}
                  </td>

                  <td className="px-5 py-4">
                    {employee.designation}
                  </td>

                 
              
<td className="px-5 py-4">
  <div className="flex items-center gap-3">
    <Link
      href={`/admin/employees/${employee.id}`}
      className="text-blue-600 hover:text-blue-800"
      title="View"
    >
      <Eye size={18} />
    </Link>

    <Link
      href={`/admin/employees/${employee.id}/edit`}
      className="text-green-600 hover:text-green-800"
      title="Edit"
    >
      <Pencil size={18} />
    </Link>

    <DeleteEmployeeButton id={employee.id} />
  </div>
    </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}