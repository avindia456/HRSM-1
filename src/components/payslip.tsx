interface PayslipProps {
  payroll: any;
}

export default function Payslip({ payroll }: PayslipProps) {
  return (
    <div className="bg-white p-8 w-[900px] mx-auto">

      {/* Header */}

      <div className="flex justify-between items-center border-b pb-5">

        <h1 className="text-3xl font-bold">
          Payslip For {payroll.month} {payroll.year}
        </h1>

        <img
          src="/logo.png"
          className="h-20"
        />

      </div>

      {/* Employee Details */}

      <div className="grid grid-cols-2 gap-6 md:gap-10 mt-8">

        <div>

          <p><b>Employee ID :</b> {payroll.employee.employee_code}</p>

          <p><b>Date Of Joining :</b> {payroll.employee.joining_date}</p>

          <p><b>Total Paid Days :</b> {payroll.paid_days}</p>

          <p><b>Total Leave Taken :</b> {payroll.leave_taken}</p>

        </div>

        <div>

          <p><b>Name :</b> {payroll.employee.full_name}</p>

          <p><b>Designation :</b> {payroll.employee.designation}</p>

          <p><b>Balance Leave :</b> {payroll.balance_leave}</p>

        </div>

      </div>

      {/* Salary */}

      <table className="w-full border mt-10">

        <thead>

          <tr className="bg-gray-200">

            <th className="border p-3">Earnings</th>
            <th className="border">Amount</th>

            <th className="border">Deductions</th>
            <th className="border">Amount</th>

          </tr>

        </thead>

        <tbody>

          <tr>

            <td className="border p-3">Basic</td>
            <td className="border text-center">
              ₹{payroll.basic_salary}
            </td>

            <td className="border p-3">
              Professional Tax
            </td>

            <td className="border text-center">
              ₹{payroll.deduction}
            </td>

          </tr>

          <tr>

            <td className="border p-3">
              House Rent Allowance
            </td>

            <td className="border text-center">
              ₹{payroll.hra}
            </td>

            <td className="border"></td>
            <td className="border"></td>

          </tr>

          <tr>

            <td className="border p-3">
              Medical Allowance
            </td>

            <td className="border text-center">
              ₹{payroll.special_allowance}
            </td>

            <td className="border"></td>
            <td className="border"></td>

          </tr>

          <tr>

            <td className="border p-3">
              Conveyance Allowance
            </td>

            <td className="border text-center">
              ₹{payroll.da}
            </td>

            <td className="border"></td>
            <td className="border"></td>

          </tr>

          <tr className="font-bold">

            <td className="border p-3">
              Gross Salary
            </td>

            <td className="border text-center">
              ₹{payroll.gross_salary}
            </td>

            <td className="border p-3">
              Total Deduction
            </td>

            <td className="border text-center">
              ₹{payroll.deduction}
            </td>

          </tr>

        </tbody>

      </table>

      <div className="mt-10">

        <h2 className="text-3xl font-bold">

          Net Pay : ₹{payroll.net_salary}

        </h2>

      </div>

      <p className="mt-6 font-semibold">
        This is computer generated slip hence not signature required.
      </p>

    </div>
  );
}