import { createClient } from "@/lib/supabase/server";
import WfhActions from "@/components/work-from-home/WfhActions";

export default async function AdminWorkFromHomePage() {
  const supabase = await createClient();

  const { data: requests, error } = await supabase
    .from("work_from_home")
    .select(`
      id,
      work_date,
      reason,
      status,
      employees (
        full_name,
        department
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-violet-700">
          Work From Home Requests
        </h1>

        <p className="mt-6 text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="mb-8 text-3xl font-bold text-violet-700">
        Work From Home Requests
      </h1>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full">
          <thead className="bg-violet-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {requests && requests.length > 0 ? (
              requests.map((request: any) => (
                <tr key={request.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {request.employees?.full_name}
                  </td>

                  <td className="px-4 py-3">
                    {request.employees?.department}
                  </td>

                  <td className="px-4 py-3">
                    {request.work_date}
                  </td>

                  <td className="px-4 py-3">
                    {request.reason}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        request.status === "Approved"
                          ? "text-green-700"
                          : request.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {request.status === "Pending" ? (
                      <WfhActions id={request.id} />
                    ) : (
                      <span className="text-gray-500">Completed</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No WFH requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}