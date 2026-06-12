import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/supporto")({
  component: AdminSupportPage,
});

function AdminSupportPage() {
  const queryClient = useQueryClient();
  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-support"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((r) => r.user_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, username, full_name").in("id", ids)
        : { data: [] as { id: string; username: string; full_name: string | null }[] };
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((r) => ({ ...r, profile: map.get(r.user_id) ?? null }));
    },
  });

  const close = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("support_requests")
        .update({ status: "closed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Richiesta chiusa");
      queryClient.invalidateQueries({ queryKey: ["admin-support"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore"),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Inbox className="h-6 w-6 text-primary" /> Richieste di supporto
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tutte le richieste</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Caricamento…</p>
          ) : !requests || requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna richiesta</p>
          ) : (
            <div className="space-y-3">
              {requests.map((r: any) => (
                <div key={r.id} className="border rounded-md p-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-medium">{r.subject}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        da @{r.profile?.username ?? "?"} ·{" "}
                        {new Date(r.created_at).toLocaleString("it-IT")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.status === "open" ? "default" : "secondary"}>
                        {r.status === "open" ? "Aperta" : "Chiusa"}
                      </Badge>
                      {r.status === "open" && (
                        <Button size="sm" variant="outline" onClick={() => close.mutate(r.id)}>
                          <Check className="h-3 w-3 mr-1" /> Chiudi
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-sm mt-2 whitespace-pre-wrap">{r.message}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
