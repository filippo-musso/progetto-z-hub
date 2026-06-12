import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ROLE_LABELS } from "@/types/auth";
import { Badge } from "@/components/ui/badge";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const primaryRole = user?.roles[0];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-card flex items-center px-4 gap-3 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex-1" />
            {user && (
              <div className="flex items-center gap-3 text-sm">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {user.profile.full_name || user.profile.username}
                  </span>
                  {primaryRole && (
                    <Badge variant="secondary">{ROLE_LABELS[primaryRole]}</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Esci</span>
                </Button>
              </div>
            )}
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
