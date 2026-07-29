import { supabase } from "@/lib/supabase";

export async function uploadFile(file: File, folder: string) {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from("employee-documents")
    .upload(filePath, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("employee-documents")
    .getPublicUrl(filePath);

  return data.publicUrl;
}