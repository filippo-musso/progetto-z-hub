import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { MODULES, ADMIN_NAV, TOP_NAV, SUPPORT_NAV } from "@/config/modules";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import logoAsset from "@/assets/logo.png.asset.json";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { isAdmin } = useAuth();

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-[var(--gradient-brand)] p-1.5 shadow-[var(--shadow-md)] flex items-center justify-center">
            <img src={logoAsset.url} alt="Logo" className="h-full w-full object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold text-sidebar-foreground truncate">
                Progetto Z
              </div>
              <div className="text-[11px] text-sidebar-foreground/60 truncate">
                Gestione operativa
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>


      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(TOP_NAV.to)}>
                  <Link to={TOP_NAV.to}>
                    <TOP_NAV.icon className="h-4 w-4" />
                    <span>{TOP_NAV.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Moduli</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MODULES.map((m) => {
                const disabled = m.status === "coming_soon";
                return (
                  <SidebarMenuItem key={m.id}>
                    <SidebarMenuButton
                      asChild={!disabled}
                      isActive={!disabled && isActive(m.to)}
                      disabled={disabled}
                      className={disabled ? "opacity-50 cursor-not-allowed" : ""}
                      tooltip={disabled ? "In costruzione" : m.label}
                    >
                      {disabled ? (
                        <div>
                          <m.icon className="h-4 w-4" />
                          <span>{m.label}</span>
                          {!collapsed && (
                            <Badge variant="outline" className="ml-auto text-[10px] py-0 px-1.5">
                              soon
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Link to={m.to}>
                          <m.icon className="h-4 w-4" />
                          <span>{m.label}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Amministrazione</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_NAV.map((m) => (
                  <SidebarMenuItem key={m.id}>
                    <SidebarMenuButton asChild isActive={isActive(m.to)}>
                      <Link to={m.to}>
                        <m.icon className="h-4 w-4" />
                        <span>{m.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(SUPPORT_NAV.to)}>
                  <Link to={SUPPORT_NAV.to}>
                    <SUPPORT_NAV.icon className="h-4 w-4" />
                    <span>{SUPPORT_NAV.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
