export default function EmployeeSalesPerformancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-violet-700">
        Sales Performance
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Monthly Target</p>
          <h2 className="mt-2 text-3xl font-bold text-violet-700">
            0.00 Lac
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Completed</p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            0.00 Lac
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending</p>
          <h2 className="mt-2 text-3xl font-bold text-red-600">
            0.00 Lac
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Remaining Days</p>
          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            0 Days
          </h2>
        </div>
      </div>

      {/* Daily Entry */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold text-violet-700">
          Today's Sales Entry
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="date"
            className="rounded-lg border p-3 outline-none focus:ring-2 focus:ring-violet-500"
          />

          <input
            type="number"
            placeholder="Today's Sale (Lac)"
            className="rounded-lg border p-3 outline-none focus:ring-2 focus:ring-violet-500"
          />

          <input
            type="text"
            placeholder="Remarks"
            className="rounded-lg border p-3 outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <button className="mt-5 rounded-lg bg-violet-700 px-6 py-3 font-semibold text-white hover:bg-violet-800">
          Save Entry
        </button>
      </div>

      {/* History */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold text-violet-700">
            My Sales History
          </h2>
        </div>

        <table className="w-full">
          <thead className="bg-violet-700 text-white">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Sale (Lac)</th>
              <th className="p-3 text-left">Remarks</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="border-b p-4">No records found</td>
              <td className="border-b"></td>
              <td className="border-b"></td>
              <td className="border-b"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}