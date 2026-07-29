"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = {
  id: string;
};

export default function DeleteEmployeeButton({ id }: Props) {
  const router = useRouter();

  async function handleDelete() {
    const ok = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!ok) return;

    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Employee deleted successfully.");

    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
    >
      <Trash2 size={18} />
    </button>
  );
}