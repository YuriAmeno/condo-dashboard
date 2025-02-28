import axios from "axios";
import type { Company, PackageRegisterReq, Store } from "./_models";
import { supabase } from "@/lib/supabase";
const WEB_HOOK_URL = "https://hook.2be.com.br/webhook";
const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
};

export const packageSend = (data: PackageRegisterReq) => {
  return axios.post(`${WEB_HOOK_URL}/package-delivered`, data, {
    headers: headers,
  });
};

export const packageConfirm = (data: PackageRegisterReq) => {
  return axios.post(`${WEB_HOOK_URL}/package-received`, data, {
    headers: headers,
  });
};

export async function getCompanies() {
  const { data: companies, error } = await supabase.from("company").select("*");
  if (error) throw error;
  return companies as Company[];
}

export async function getStores(){
  const {data: stores , error} = await supabase.from('store').select('*');
  if (error) throw error;
  return stores as Store[];
}

