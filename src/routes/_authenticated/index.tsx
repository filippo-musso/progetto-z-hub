import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MODULES } from "@/config/modules";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/types/auth";
import { Clock, User as UserIcon, BarChart3, LifeBuoy, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div
        className="relative overflow-hidden rounded-2xl p-8 shadow-[var(--shadow-glow)]"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/10 blur-2xl" />
        <div className="relative text-white">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight drop-shadow-sm">
            Ciao{user?.profile.full_name ? `, ${user.profile.full_name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-white/95 mt-2 font-medium drop-shadow-sm">
            Benvenuto nella tua area di lavoro
          </p>
        </div>
      </div>


      {/* Widgets */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Panoramica
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UserWidget />
          <DateTimeWidget />
          <StatsPlaceholderWidget />
        </div>
      </section>

      {/* Modules */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          I tuoi moduli
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => {
            const disabled = m.status === "coming_soon";
            const Icon = m.icon;
            const Inner = (
              <Card
                className={`h-full transition-all ${
                  disabled
                    ? "opacity-60"
                    : "hover:shadow-md hover:border-primary/40 cursor-pointer"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    {disabled && <Badge variant="outline">In costruzione</Badge>}
                  </div>
                  <CardTitle className="text-base mt-3">{m.label}</CardTitle>
                  <CardDescription>{m.description}</CardDescription>
                </CardHeader>
              </Card>
            );
            return disabled ? (
              <div key={m.id}>{Inner}</div>
            ) : (
              <Link key={m.id} to={m.to} className="block">
                {Inner}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Support */}
      <section>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/0 border-primary/20">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Hai bisogno di aiuto?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Contatta il supporto tecnico per qualsiasi problema o richiesta.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link to="/supporto">
                Apri supporto <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function UserWidget() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <UserIcon className="h-4 w-4" />
          Informazioni utente
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="font-semibold">{user.profile.full_name || user.profile.username}</div>
        <div className="text-sm text-muted-foreground">@{user.profile.username}</div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {user.roles.map((r) => (
            <Badge key={r} variant="secondary">{ROLE_LABELS[r]}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DateTimeWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Clock className="h-4 w-4" />
          Data e ora
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">
          {now.toLocaleTimeString("it-IT")}
        </div>
        <div className="text-sm text-muted-foreground capitalize">
          {now.toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function StatsPlaceholderWidget() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <BarChart3 className="h-4 w-4" />
          Statistiche
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-muted-foreground">—</div>
        <div className="text-sm text-muted-foreground">Disponibili a breve</div>
      </CardContent>
    </Card>
  );
}
