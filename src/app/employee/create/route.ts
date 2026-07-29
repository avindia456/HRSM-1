import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Create Auth User
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
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

    // 2. Create Employee
    const { data: employee, error: employeeError } =
      await supabaseAdmin
        .from("employees")
        .insert({
          ...body,
          auth_id: authData.user.id,
        })
        .select()
        .single();

    if (employeeError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: employeeError.message },
        { status: 400 }
      );
    }

    // 3. Create Profile
    await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: body.email,
        full_name: body.full_name,
        role: "employee",
      });

    return NextResponse.json(employee);
  } catch (e) {
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}