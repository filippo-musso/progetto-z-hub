import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { loadCurrentUser, signOut as svcSignOut } from "@/services/auth";
import type { AuthUser, AppRole } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    loadCurrentUser().then((u) => {
      if (!cancelled) setState({ user: u, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasRole = useCallback(
    (role: AppRole) => !!state.user?.roles.includes(role),
    [state.user],
  );

  const isAdmin = hasRole("admin");

  const logout = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await svcSignOut();
    navigate({ to: "/auth", replace: true });
  }, [navigate, queryClient]);

  return { ...state, hasRole, isAdmin, logout, supabase };
}
