import axios from "axios";
import type { PackageRegisterReq } from "./_models";
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
