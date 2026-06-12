import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listUsersAdmin,
  createUserAdmin,
  setUserRoleAdmin,
  resetUserPasswordAdmin,
  deleteUserAdmin,
} from "@/lib/admin-users.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Plus, KeyRound, Trash2 } from "lucide-react";
import { ROLE_LABELS, type AppRole } from "@/types/auth";

const ROLES: AppRole[] = ["admin", "ufficio", "magazzino", "cliente"];

export const Route = createFileRoute("/_authenticated/admin/utenti")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listUsersAdmin);
  const setRoleFn = useServerFn(setUserRoleAdmin);
  const resetFn = useServerFn(resetUserPasswordAdmin);
  const deleteFn = useServerFn(deleteUserAdmin);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listFn(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });

  const setRole = useMutation({
    mutationFn: (v: { userId: string; role: AppRole }) => setRoleFn({ data: v }),
    onSuccess: () => {
      toast.success("Ruolo aggiornato");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore"),
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => deleteFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("Utente eliminato");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore"),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Gestione utenti
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crea, modifica ruolo o reimposta la password
          </p>
        </div>
        <NewUserDialog onCreated={invalidate} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-muted-foreground">Caricamento…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Nome completo</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Creato il</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">@{u.username}</TableCell>
                    <TableCell>{u.full_name || "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={u.roles[0] ?? "cliente"}
                        onValueChange={(v) =>
                          setRole.mutate({ userId: u.id, role: v as AppRole })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <ResetPasswordButton userId={u.id} username={u.username} resetFn={resetFn} />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Eliminare l'utente @${u.username}?`))
                            deleteUser.mutate(u.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      Nessun utente
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NewUserDialog({ onCreated }: { onCreated: () => void }) {
  const createFn = useServerFn(createUserAdmin);
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("ufficio");

  const m = useMutation({
    mutationFn: () =>
      createFn({ data: { username, password, fullName, role } }),
    onSuccess: () => {
      toast.success("Utente creato");
      setOpen(false);
      setUsername("");
      setFullName("");
      setPassword("");
      setRole("ufficio");
      onCreated();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> Nuovo utente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuovo utente</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={32}
              pattern="[a-z0-9_.\-]+"
            />
          </div>
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label>Ruolo</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={m.isPending}>
              Crea utente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordButton({
  userId,
  username,
  resetFn,
}: {
  userId: string;
  username: string;
  resetFn: ReturnType<typeof useServerFn<typeof resetUserPasswordAdmin>>;
}) {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const m = useMutation({
    mutationFn: () => resetFn({ data: { userId, password: pwd } }),
    onSuccess: () => {
      toast.success("Password aggiornata");
      setOpen(false);
      setPwd("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore"),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <KeyRound className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password per @{username}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Nuova password</Label>
            <Input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={m.isPending}>
              Aggiorna password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
