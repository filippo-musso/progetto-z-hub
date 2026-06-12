import { supabase } from "@/integrations/supabase/client";
import type { AppRole, AuthUser, Profile } from "@/types/auth";

const USERNAME_DOMAIN = "app.local";

const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@${USERNAME_DOMAIN}`;

export const emailToUsername = (email: string | null | undefined) =>
  email?.replace(`@${USERNAME_DOMAIN}`, "") ?? "";

/** Login con username + password (lo username viene mappato a un email sintetico). */
export async function signInWithUsername(username: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Carica profilo + ruoli dell'utente loggato. */
export async function loadCurrentUser(): Promise<AuthUser | null> {
  const { data: sessionData } = await supabase.auth.getUser();
  const user = sessionData.user;
  if (!user) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  if (!profile) return null;
  return {
    id: user.id,
    profile: profile as Profile,
    roles: ((roles ?? []) as { role: AppRole }[]).map((r) => r.role),
  };
}

/** Per uso interno (creazione utenti server-side). */
export const usernameToEmailPublic = usernameToEmail;
