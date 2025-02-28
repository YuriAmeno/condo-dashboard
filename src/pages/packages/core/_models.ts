export interface PackageRegisterReq {
  delivery_company: string;
  store_name: string;
  resident_id: string;
  package_id: string;
}
export interface Company {
  id: string;
  name: string;
}
export interface Store {
  id: string;
  name: string;
}
