export type AppRole = "admin" | "ufficio" | "magazzino" | "cliente";

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  profile: Profile;
  roles: AppRole[];
}

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Amministratore",
  ufficio: "Ufficio",
  magazzino: "Magazzino",
  cliente: "Cliente",
};
