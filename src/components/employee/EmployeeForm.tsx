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
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    defaultValues: employee
      ? {
          ...employee,
          basic_salary: employee.salary,
          password: "",
        }
      : undefined,
  });

  /*
   * ---------------------------------------------------------
   * LOAD EMPLOYEE DATA IN EDIT MODE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!employee) return;

    reset({
      employee_code: employee.employee_code ?? "",
      full_name: employee.full_name ?? "",
      email: employee.email ?? "",
      password: "",
      phone: employee.phone ?? "",
      gender: employee.gender ?? "",
      dob: employee.dob ?? "",
      blood_group: employee.blood_group ?? "",
      address: employee.address ?? "",
      emergency_contact:
        employee.emergency_contact ?? "",

      department: employee.department ?? "",
      designation: employee.designation ?? "",
      reporting_manager:
        employee.reporting_manager ?? "",
      employment_type:
        employee.employment_type ?? "",
      joining_date: employee.joining_date ?? "",
      status: employee.status ?? "Active",

      basic_salary: Number(employee.salary ?? 0),
      bank_name: employee.bank_name ?? "",
      account_number:
        employee.account_number ?? "",
      ifsc_code: employee.ifsc_code ?? "",
      pan_number: employee.pan_number ?? "",
    });
  }, [employee, reset]);

  /*
   * ---------------------------------------------------------
   * SUBMIT
   * ---------------------------------------------------------
   */

  async function onSubmit(data: EmployeeFormData) {
    try {
      /*
       * -------------------------------------------------------
       * UPLOAD NEW FILES ONLY IF SELECTED
       * -------------------------------------------------------
       */

      const profilePhoto = data.profile_photo?.[0]
        ? await uploadFile(
            data.profile_photo[0],
            "profile"
          )
        : null;

      const aadhaar = data.aadhaar_file?.[0]
        ? await uploadFile(
            data.aadhaar_file[0],
            "aadhaar"
          )
        : null;

      const pan = data.pan_file?.[0]
        ? await uploadFile(
            data.pan_file[0],
            "pan"
          )
        : null;

      const resume = data.resume_file?.[0]
        ? await uploadFile(
            data.resume_file[0],
            "resume"
          )
        : null;

      const offerLetter =
        data.offer_letter_file?.[0]
          ? await uploadFile(
              data.offer_letter_file[0],
              "offer-letter"
            )
          : null;

      const tenth = data.tenth_file?.[0]
        ? await uploadFile(
            data.tenth_file[0],
            "10th"
          )
        : null;

      const twelfth = data.twelfth_file?.[0]
        ? await uploadFile(
            data.twelfth_file[0],
            "12th"
          )
        : null;

      const graduation =
        data.graduation_file?.[0]
          ? await uploadFile(
              data.graduation_file[0],
              "graduation"
            )
          : null;

      /*
       * -------------------------------------------------------
       * EMPLOYEE DATABASE DATA
       * -------------------------------------------------------
       */

      const employeeData = {
        employee_code:
          data.employee_code?.trim() || null,

        full_name:
          data.full_name?.trim() || null,

        email:
          data.email?.trim() || null,

        phone:
          data.phone?.trim() || null,

        gender:
          data.gender || null,

        dob:
          data.dob || null,

        blood_group:
          data.blood_group || null,

        address:
          data.address?.trim() || null,

        emergency_contact:
          data.emergency_contact?.trim() ||
          null,

        department:
          data.department?.trim() || null,

        designation:
          data.designation?.trim() || null,

        reporting_manager:
          data.reporting_manager?.trim() ||
          null,

        employment_type:
          data.employment_type || null,

        joining_date:
          data.joining_date || null,

        status:
          data.status || "Active",

        salary:
          Number.isFinite(data.basic_salary)
            ? data.basic_salary
            : null,

        bank_name:
          data.bank_name?.trim() || null,

        account_number:
          data.account_number?.trim() ||
          null,

        ifsc_code:
          data.ifsc_code?.trim() || null,

        pan_number:
          data.pan_number?.trim() || null,

        /*
         * If editing and user doesn't select
         * a new file, keep existing file.
         */

        profile_photo_url:
          profilePhoto ??
          employee?.profile_photo_url ??
          null,

        aadhaar_url:
          aadhaar ??
          employee?.aadhaar_url ??
          null,

        pan_file_url:
          pan ??
          employee?.pan_file_url ??
          null,

        resume_url:
          resume ??
          employee?.resume_url ??
          null,

        offer_letter_url:
          offerLetter ??
          employee?.offer_letter_url ??
          null,

        tenth_url:
          tenth ??
          employee?.tenth_url ??
          null,

        twelfth_url:
          twelfth ??
          employee?.twelfth_url ??
          null,

        graduation_url:
          graduation ??
          employee?.graduation_url ??
          null,
      };

      console.log("isEdit:", isEdit);
      console.log("employee:", employee);
      console.log("employee id:", employee?.id);
      console.log(
        "Employee Data:",
        employeeData
      );

      /*
       * -------------------------------------------------------
       * EDIT EMPLOYEE
       * -------------------------------------------------------
       */

      if (isEdit) {
        if (!employee?.id) {
          throw new Error(
            "Employee ID not found."
          );
        }

        console.log(
          "UPDATE RUNNING FOR:",
          employee.id
        );

        const {
          data: updatedEmployee,
          error: updateError,
        } = await supabase
          .from("employees")
          .update(employeeData)
          .eq("id", employee.id)
          .select()
          .single();

        if (updateError) {
          console.error(
            "UPDATE ERROR:",
            updateError
          );

          throw updateError;
        }

        console.log(
          "UPDATED EMPLOYEE:",
          updatedEmployee
        );

        alert(
          "Employee updated successfully!"
        );

        window.location.href =
          "/admin/employees";

        return;
      }

      /*
       * -------------------------------------------------------
       * NEW EMPLOYEE
       * -------------------------------------------------------
       */

      console.log("INSERT RUNNING");

      const {
        data: insertedEmployee,
        error: insertError,
      } = await supabase
        .from("employees")
        .insert(employeeData)
        .select()
        .single();

      if (insertError) {
        console.error(
          "INSERT ERROR:",
          insertError
        );

        throw insertError;
      }

      console.log(
        "INSERTED EMPLOYEE:",
        insertedEmployee
      );

      alert(
        "Employee saved successfully!"
      );

      window.location.href =
        "/admin/employees";
    } catch (err: any) {
      console.error(
        "EMPLOYEE SAVE ERROR:",
        err
      );

      alert(
        err?.message ||
          "Something went wrong while saving employee."
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
    >
      {/* PERSONAL INFORMATION */}

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-6 text-2xl font-semibold">
          Personal Information
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          {/* EMPLOYEE CODE */}

          <div>
            <label className="mb-2 block font-medium">
              Employee Code
            </label>

            <input
              {...register("employee_code")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          {/* FULL NAME */}

          <div>
            <label className="mb-2 block font-medium">
              Full Name
            </label>

            <input
              {...register("full_name", {
                required:
                  "Full name is required",
              })}
              className="w-full rounded-lg border p-3"
            />

            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* EMAIL */}

          <div>
            <label className="mb-2 block font-medium">
              Email
            </label>

            <input
              type="email"
              {...register("email", {
                required:
                  "Email is required",
              })}
              className="w-full rounded-lg border p-3"
            />

            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* PASSWORD */}

          <div>
            <label className="mb-2 block font-medium">
              Password
              {isEdit && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  (leave blank to keep current)
                </span>
              )}
            </label>

            <input
              type="password"
              autoComplete="new-password"
              {...register("password", {
                required: isEdit
                  ? false
                  : "Password is required",
              })}
              className="w-full rounded-lg border p-3"
              placeholder={
                isEdit
                  ? "Leave blank to keep current password"
                  : "Enter password"
              }
            />

            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* MOBILE */}

          <div>
            <label className="mb-2 block font-medium">
              Mobile
            </label>

            <input
              {...register("phone")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          {/* GENDER */}

          <div>
            <label className="mb-2 block font-medium">
              Gender
            </label>

            <select
              {...register("gender")}
              className="w-full rounded-lg border p-3"
            >
              <option value="">
                Select Gender
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          {/* DOB */}

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

          {/* BLOOD GROUP */}

          <div>
            <label className="mb-2 block font-medium">
              Blood Group
            </label>

            <select
              {...register("blood_group")}
              className="w-full rounded-lg border p-3"
            >
              <option value="">
                Select Blood Group
              </option>

              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          {/* ADDRESS */}

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

          {/* EMERGENCY CONTACT */}

          <div>
            <label className="mb-2 block font-medium">
              Emergency Contact
            </label>

            <input
              {...register(
                "emergency_contact"
              )}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </div>

      {/* COMPANY INFORMATION */}

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-6 text-2xl font-semibold">
          Company Information
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          {/* DEPARTMENT */}

          <div>
            <label className="mb-2 block font-medium">
              Department
            </label>

            <input
              {...register("department")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          {/* DESIGNATION */}

          <div>
            <label className="mb-2 block font-medium">
              Designation
            </label>

            <input
              {...register("designation")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          {/* REPORTING MANAGER */}

          <div>
            <label className="mb-2 block font-medium">
              Reporting Manager
            </label>

            <input
              {...register(
                "reporting_manager"
              )}
              className="w-full rounded-lg border p-3"
            />
          </div>

          {/* EMPLOYMENT TYPE */}

          <div>
            <label className="mb-2 block font-medium">
              Employment Type
            </label>

            <select
              {...register(
                "employment_type"
              )}
              className="w-full rounded-lg border p-3"
            >
              <option value="">
                Select
              </option>

              <option value="Permanent">
                Permanent
              </option>

              <option value="Contract">
                Contract
              </option>

              <option value="Intern">
                Intern
              </option>
            </select>
          </div>

          {/* JOINING DATE */}

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

          {/* STATUS */}

          <div>
            <label className="mb-2 block font-medium">
              Status
            </label>

            <select
              {...register("status")}
              className="w-full rounded-lg border p-3"
            >
              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* PAYROLL INFORMATION */}

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-6 text-2xl font-semibold">
          Payroll Information
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          {/* SALARY */}

          <div>
            <label className="mb-2 block font-medium">
              Basic Salary
            </label>

            <input
              type="number"
              {...register(
                "basic_salary",
                {
                  valueAsNumber: true,
                }
              )}
              className="w-full rounded-lg border p-3"
            />
          </div>

          {/* BANK */}

          <div>
            <label className="mb-2 block font-medium">
              Bank Name
            </label>

            <input
              {...register("bank_name")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          {/* ACCOUNT */}

          <div>
            <label className="mb-2 block font-medium">
              Account Number
            </label>

            <input
              {...register(
                "account_number"
              )}
              className="w-full rounded-lg border p-3"
            />
          </div>

          {/* IFSC */}

          <div>
            <label className="mb-2 block font-medium">
              IFSC Code
            </label>

            <input
              {...register("ifsc_code")}
              className="w-full rounded-lg border p-3"
            />
          </div>

          {/* PAN */}

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

      {/* DOCUMENT UPLOADS */}

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-6 text-2xl font-semibold">
          Document Uploads
        </h2>

        {isEdit && (
          <p className="mb-5 text-sm text-gray-500">
            Existing documents will remain unchanged
            unless you select a new file.
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {/* PROFILE PHOTO */}

          <div>
            <label className="mb-2 block font-medium">
              Profile Photo
            </label>

            <input
              type="file"
              accept="image/*"
              {...register(
                "profile_photo"
              )}
              className="w-full rounded-lg border p-3"
            />

            {isEdit &&
              employee?.profile_photo_url && (
                <p className="mt-2 text-sm text-green-600">
                  Existing profile photo saved
                </p>
              )}
          </div>

          {/* AADHAAR */}

          <div>
            <label className="mb-2 block font-medium">
              Aadhaar Card
            </label>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              {...register(
                "aadhaar_file"
              )}
              className="w-full rounded-lg border p-3"
            />

            {isEdit &&
              employee?.aadhaar_url && (
                <p className="mt-2 text-sm text-green-600">
                  Existing Aadhaar saved
                </p>
              )}
          </div>

          {/* PAN FILE */}

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

            {isEdit &&
              employee?.pan_file_url && (
                <p className="mt-2 text-sm text-green-600">
                  Existing PAN card saved
                </p>
              )}
          </div>

          {/* RESUME */}

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

            {isEdit &&
              employee?.resume_url && (
                <p className="mt-2 text-sm text-green-600">
                  Existing resume saved
                </p>
              )}
          </div>

          {/* OFFER LETTER */}

          <div>
            <label className="mb-2 block font-medium">
              Offer Letter
            </label>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              {...register(
                "offer_letter_file"
              )}
              className="w-full rounded-lg border p-3"
            />

            {isEdit &&
              employee?.offer_letter_url && (
                <p className="mt-2 text-sm text-green-600">
                  Existing offer letter saved
                </p>
              )}
          </div>

          {/* 10TH */}

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

            {isEdit &&
              employee?.tenth_url && (
                <p className="mt-2 text-sm text-green-600">
                  Existing 10th marksheet saved
                </p>
              )}
          </div>

          {/* 12TH */}

          <div>
            <label className="mb-2 block font-medium">
              12th Marksheet
            </label>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              {...register(
                "twelfth_file"
              )}
              className="w-full rounded-lg border p-3"
            />

            {isEdit &&
              employee?.twelfth_url && (
                <p className="mt-2 text-sm text-green-600">
                  Existing 12th marksheet saved
                </p>
              )}
          </div>

          {/* GRADUATION */}

          <div>
            <label className="mb-2 block font-medium">
              Graduation Certificate
            </label>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              {...register(
                "graduation_file"
              )}
              className="w-full rounded-lg border p-3"
            />

            {isEdit &&
              employee?.graduation_url && (
                <p className="mt-2 text-sm text-green-600">
                  Existing graduation certificate saved
                </p>
              )}
          </div>
        </div>
      </div>

      {/* BUTTONS */}

      <div className="flex justify-end gap-4">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            if (isEdit && employee) {
              reset({
                ...employee,
                basic_salary:
                  employee.salary,
                password: "",
              });
            } else {
              reset();
            }
          }}
          className="rounded-lg border px-6 py-3 disabled:opacity-50"
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? isEdit
              ? "Updating..."
              : "Saving..."
            : isEdit
              ? "Update Employee"
              : "Save Employee"}
        </button>
     </div>
    </form>
  );
}