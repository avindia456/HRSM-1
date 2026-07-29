"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/uploadFile";
type EmployeeFormData = {
  employee_code: string;
  full_name: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  dob: string;
  blood_group: string;
  address: string;
  emergency_contact: string;

  department: string;
  designation: string;
  reporting_manager: string;
  employment_type: string;
  joining_date: string;
  status: string;

  basic_salary: number;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  pan_number: string;
  profile_photo: FileList;
aadhaar_file: FileList;
pan_file: FileList;
resume_file: FileList;
offer_letter_file: FileList;
tenth_file: FileList;
twelfth_file: FileList;
graduation_file: FileList;
};
type EmployeeFormProps = {
  employee?: any;
  isEdit?: boolean;
};
export default function EmployeeForm({
  employee,
  isEdit = false,
}: EmployeeFormProps) {
  const {
  register,
  handleSubmit,
  reset,
  formState: { errors },
} = useForm<EmployeeFormData>({
  defaultValues: employee,
});
useEffect(() => {
  if (employee) {
    reset({
      ...employee,
      basic_salary: employee.salary,
    });
  }
}, [employee, reset]);

  async function onSubmit(data: EmployeeFormData) {
    try {
      const profilePhoto = data.profile_photo?.[0]
        ? await uploadFile(data.profile_photo[0], "profile")
        : null;

      const aadhaar = data.aadhaar_file?.[0]
        ? await uploadFile(data.aadhaar_file[0], "aadhaar")
        : null;

      const pan = data.pan_file?.[0]
        ? await uploadFile(data.pan_file[0], "pan")
        : null;

      const resume = data.resume_file?.[0]
        ? await uploadFile(data.resume_file[0], "resume")
        : null;

      const offerLetter = data.offer_letter_file?.[0]
        ? await uploadFile(data.offer_letter_file[0], "offer-letter")
        : null;

      const tenth = data.tenth_file?.[0]
        ? await uploadFile(data.tenth_file[0], "10th")
        : null;

      const twelfth = data.twelfth_file?.[0]
        ? await uploadFile(data.twelfth_file[0], "12th")
        : null;

      const graduation = data.graduation_file?.[0]
        ? await uploadFile(data.graduation_file[0], "graduation")
        : null;

  const employeeData = {
  employee_code: data.employee_code,
  full_name: data.full_name,
  email: data.email,
  phone: data.phone,
  department: data.department,
  designation: data.designation,
  reporting_manager: data.reporting_manager,
  employment_type: data.employment_type,
  joining_date: data.joining_date || null,
dob: data.dob || null,
  status: data.status,

  gender: data.gender,

  blood_group: data.blood_group,
  address: data.address,
  emergency_contact: data.emergency_contact,

  salary: data.basic_salary,
  bank_name: data.bank_name,
  account_number: data.account_number,
  ifsc_code: data.ifsc_code,
  pan_number: data.pan_number,

  profile_photo_url: profilePhoto,
  aadhaar_url: aadhaar,
  pan_file_url: pan,
  resume_url: resume,
  offer_letter_url: offerLetter,
  tenth_url: tenth,
  twelfth_url: twelfth,
  graduation_url: graduation,
};
console.log("isEdit:", isEdit);
console.log("employee:", employee);
console.log("employee.id:", employee?.id);  
console.log(employeeData);
let error;

if (isEdit && employee?.id) {
  console.log("UPDATE RUNNING");

  const result = await supabase
    .from("employees")
    .update(employeeData)
    .eq("id", employee.id);

  error = result.error;
} else {
  console.log("INSERT RUNNING");

const result = await supabase
  .from("employees")
  .insert(employeeData);

error = result.error;

if (error) throw error;

alert(
  isEdit
    ? "Employee updated successfully!"
    : "Employee saved successfully!"
);
}
      } catch (err: any) {
  console.error("ERROR:", err);
  alert(err?.message || "Unknown error");
}
}
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
    >
              <div className="rounded-xl bg-white p-6 shadow">

        <h2 className="mb-6 text-2xl font-semibold">
          Personal Information
        </h2>

        <div className="grid gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block font-medium">
              Employee Code
            </label>

            <input
              {...register("employee_code")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Full Name
            </label>

            <input
              {...register("full_name", {
                required: true,
              })}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Email
            </label>

            <input
              type="email"
              {...register("email", {
                required: true,
              })}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Password
            </label>

            <input
              type="password"
              {...register("password", {
                required: true,
              })}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Mobile
            </label>

            <input
              {...register("phone")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Gender
            </label>

            <select
              {...register("gender")}
              className="w-full rounded-lg border p-3"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Date Of Birth
            </label>

            <input
              type="date"
              {...register("dob")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Blood Group
            </label>

            <select
              {...register("blood_group")}
              className="w-full rounded-lg border p-3"
            >
              <option>A+</option>
              <option>A-</option>
              <option>B+</option>
              <option>B-</option>
              <option>AB+</option>
              <option>AB-</option>
              <option>O+</option>
              <option>O-</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">
              Address
            </label>

            <textarea
              rows={4}
              {...register("address")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Emergency Contact
            </label>

            <input
              {...register("emergency_contact")}
              className="w-full rounded-lg border p-3"
            />
          </div>

        </div>

      </div>
            <div className="rounded-xl bg-white p-6 shadow">

        <h2 className="mb-6 text-2xl font-semibold">
          Company Information
        </h2>

        <div className="grid gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block font-medium">
              Department
            </label>

            <input
              {...register("department")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Designation
            </label>

            <input
              {...register("designation")}
              className="w-full rounded-lg border p-3"
            />
          </div>
                    <div>
            <label className="mb-2 block font-medium">
              Reporting Manager
            </label>

            <input
              {...register("reporting_manager")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Employment Type
            </label>

            <select
              {...register("employment_type")}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select</option>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Joining Date
            </label>

            <input
              type="date"
              {...register("joining_date")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Status
            </label>

            <select
              {...register("status")}
              className="w-full rounded-lg border p-3"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">

        <h2 className="mb-6 text-2xl font-semibold">
          Payroll Information
        </h2>

        <div className="grid gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block font-medium">
              Basic Salary
            </label>

            <input
              type="number"
              {...register("basic_salary", {
                valueAsNumber: true,
              })}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Bank Name
            </label>

            <input
              {...register("bank_name")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Account Number
            </label>

            <input
              {...register("account_number")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              IFSC Code
            </label>

            <input
              {...register("ifsc_code")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              PAN Number
            </label>

            <input
              {...register("pan_number")}
              className="w-full rounded-lg border p-3"
            />
          </div>

        </div>

      </div>
      <div className="rounded-xl bg-white p-6 shadow">

  <h2 className="mb-6 text-2xl font-semibold">
    Document Uploads
  </h2>

  <div className="grid gap-5 md:grid-cols-2">

    <div>
      <label className="mb-2 block font-medium">
        Profile Photo
      </label>

      <input
        type="file"
        accept="image/*"
        {...register("profile_photo")}
        className="w-full rounded-lg border p-3"
      />
    </div>

    <div>
      <label className="mb-2 block font-medium">
        Aadhaar Card
      </label>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        {...register("aadhaar_file")}
        className="w-full rounded-lg border p-3"
      />
    </div>

    <div>
      <label className="mb-2 block font-medium">
        PAN Card
      </label>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        {...register("pan_file")}
        className="w-full rounded-lg border p-3"
      />
    </div>

    <div>
      <label className="mb-2 block font-medium">
        Resume
      </label>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        {...register("resume_file")}
        className="w-full rounded-lg border p-3"
      />
    </div>

    <div>
      <label className="mb-2 block font-medium">
        Offer Letter
      </label>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        {...register("offer_letter_file")}
        className="w-full rounded-lg border p-3"
      />
    </div>

    <div>
      <label className="mb-2 block font-medium">
        10th Marksheet
      </label>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        {...register("tenth_file")}
        className="w-full rounded-lg border p-3"
      />
    </div>

    <div>
      <label className="mb-2 block font-medium">
        12th Marksheet
      </label>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        {...register("twelfth_file")}
        className="w-full rounded-lg border p-3"
      />
    </div>

    <div>
      <label className="mb-2 block font-medium">
        Graduation Certificate
      </label>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        {...register("graduation_file")}
        className="w-full rounded-lg border p-3"
      />
    </div>

  </div>

</div>
            <div className="flex justify-end gap-4">

        <button
          type="reset"
          className="rounded-lg border px-6 py-3"
        >
          Cancel
        </button>

        <button
  type="submit"
  className="rounded-lg bg-violet-600 px-6 py-3 text-white hover:bg-violet-700"
>
  {isEdit ? "Update Employee" : "Save Employee"}
</button>

      </div>

    </form>

);
}