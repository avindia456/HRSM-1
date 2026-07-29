import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EmployeeForm from "@/components/employee/EmployeeForm";

export default async function EditEmployeePage({
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

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold">Edit Employee</h1>

      <EmployeeForm
        employee={employee}
        isEdit={true}
      />
    </div>
  );
}