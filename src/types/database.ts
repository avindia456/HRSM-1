export type Role = "admin" | "employee";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
}