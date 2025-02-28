import { supabase } from "@/lib/supabase";

interface Signature {
  id?: string;
  apartment_complex_id: string;
  signature_url: string;
  created_at?: Date;
  updated_at?: Date;
}

export async function createSignature(signatureData: Omit<Signature, 'id'>) {
  const { data, error } = await supabase
    .from("signatures")
    .insert(signatureData)
    .select()
    .single();
  
  if (error) throw error;
  return data as Signature;
}
export async function getSignatureById(id: string) {
  const { data, error } = await supabase
    .from("signature")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data as Signature;
}