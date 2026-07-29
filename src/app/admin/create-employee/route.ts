import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Create Auth User
    const { data: authUser, error: authError } =
      await admin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const authId = authUser.user.id;

    // Create Profile
    const { error: profileError } = await admin
      .from("profiles")
      .insert({
        id: authId,
        role: "employee",
      });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    // Create Employee
    const { error: employeeError } = await admin
      .from("employees")
      .insert({
        auth_id: authId,

        employee_code: body.employee_code,
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,

        department: body.department,
        designation: body.designation,
        reporting_manager: body.reporting_manager,
        employment_type: body.employment_type,
        joining_date: body.joining_date,
        dob: body.dob,

        gender: body.gender,
        blood_group: body.blood_group,
        address: body.address,
        emergency_contact: body.emergency_contact,

        salary: body.basic_salary,

        bank_name: body.bank_name,
        account_number: body.account_number,
        ifsc_code: body.ifsc_code,
        pan_number: body.pan_number,

        status: body.status,

        profile_photo_url: body.profile_photo_url,
        aadhaar_url: body.aadhaar_url,
        pan_file_url: body.pan_file_url,
        resume_url: body.resume_url,
        offer_letter_url: body.offer_letter_url,
        tenth_url: body.tenth_url,
        twelfth_url: body.twelfth_url,
        graduation_url: body.graduation_url,
      });

    if (employeeError) {
      return NextResponse.json(
        { error: employeeError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}