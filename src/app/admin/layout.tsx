import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import AdminHeader from "@/components/layout/AdminHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in
  if (!user) {
    redirect("/");
  }

  // Get logged in user's role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Employee cannot access admin pages
  if (!profile || profile.role !== "admin") {
    redirect("/employee/dashboard");
  }

  return (
    <>
      <AdminSidebar />

      <div className="ml-72 min-h-screen bg-gray-100">
        <AdminHeader />

        <main className="p-8">{children}</main>
      </div>
    </>
  );
}