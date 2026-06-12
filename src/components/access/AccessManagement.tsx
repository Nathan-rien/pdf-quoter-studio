import { useState, useEffect } from 'react';
import { Users, Shield, UserPlus, Trash2, Loader2, Building2, RefreshCw, Plus, ChevronDown, ChevronRight, Phone, Mail, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { COMMERCIAUX, ENTITIES } from '@/data/commerciaux';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: 'admin' | 'commercial' | 'user' | null;
}

interface PreRegisteredCommercial {
  commercial_id: string;
  email: string;
  full_name: string;
  created_at: string;
  telephone: string | null;
  entity: string | null;
}

interface EditedFields {
  email?: string;
  telephone?: string;
}

export function AccessManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Pré-enregistrés
  const [preRegistered, setPreRegistered] = useState<PreRegisteredCommercial[]>([]);
  const [preLoading, setPreLoading] = useState(true);
  const [showPreRegistered, setShowPreRegistered] = useState(true);
  const [deletingCommercialId, setDeletingCommercialId] = useState<string | null>(null);
  const [confirmDeleteCommercial, setConfirmDeleteCommercial] = useState<string | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, EditedFields>>({});
  const [savingFieldsId, setSavingFieldsId] = useState<string | null>(null);

  // Dialog nouveau profil
  const [showNewProfileDialog, setShowNewProfileDialog] = useState(false);
  const [newProfile, setNewProfile] = useState({
    full_name: '',
    email: '',
    commercial_id: '',
    entity: '',
    telephone: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [useExistingCommercial, setUseExistingCommercial] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchPreRegistered();
  }, []);

  const fetchPreRegistered = async () => {
    setPreLoading(true);
    try {
      const { data, error } = await supabase
        .from('pre_registered_commercials')
        .select('commercial_id, email, full_name, created_at, telephone, entity' as any)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPreRegistered((data as any) || []);
    } catch {
      // silencieux
    } finally {
      setPreLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role as 'admin' | 'user' | null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger la liste des utilisateurs',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'commercial' | 'user') => {
    setUpdatingUserId(userId);
    try {
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
      if (error) throw error;
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast({ title: 'Rôle mis à jour' });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le rôle' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteRole = async (userId: string) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: null } : u)));
      toast({ title: 'Rôle supprimé' });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer le rôle' });
    } finally {
      setUpdatingUserId(null);
      setDeleteUserId(null);
    }
  };

  const handleSaveNewProfile = async () => {
    // Validation
    const name = useExistingCommercial
      ? COMMERCIAUX.find(c => c.id === selectedExistingId)?.nom || ''
      : newProfile.full_name.trim();
    const selectedCommercial = COMMERCIAUX.find(c => c.id === selectedExistingId);
    const email = useExistingCommercial
      ? selectedCommercial?.email || ''
      : newProfile.email.trim();
    const commercialId = useExistingCommercial ? selectedExistingId : newProfile.commercial_id.trim();
    const telephone = useExistingCommercial
      ? selectedCommercial?.telephone || null
      : (newProfile.telephone.trim() || null);
    const entity = useExistingCommercial
      ? selectedCommercial?.entity || null
      : (newProfile.entity || null);

    if (!name || !email || !commercialId) {
      toast({ variant: 'destructive', title: 'Champs manquants', description: 'Nom, email et identifiant commercial sont requis.' });
      return;
    }
    if (!useExistingCommercial && !entity) {
      toast({ variant: 'destructive', title: 'Entité manquante', description: 'Veuillez sélectionner une entité (Cybertek Pro ou Grosbill Pro).' });
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase.from('pre_registered_commercials').insert({
        full_name: name,
        email: email.toLowerCase(),
        commercial_id: commercialId,
        telephone,
        entity,
      } as any);
      if (error) throw error;
      toast({ title: 'Profil ajouté', description: `${name} a été ajouté à la liste des commerciaux autorisés.` });
      setShowNewProfileDialog(false);
      setNewProfile({ full_name: '', email: '', commercial_id: '', entity: '', telephone: '' });
      setSelectedExistingId('');
      setUseExistingCommercial(false);
      fetchPreRegistered();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: err?.message || 'Impossible d\'ajouter le profil.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeletePreRegistered = async (commercialId: string) => {
    setDeletingCommercialId(commercialId);
    try {
      const { error } = await supabase.from('pre_registered_commercials').delete().eq('commercial_id', commercialId);
      if (error) throw error;
      setPreRegistered(prev => prev.filter(p => p.commercial_id !== commercialId));
      toast({ title: 'Supprimé', description: 'Le commercial pré-enregistré a été retiré.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer.' });
    } finally {
      setDeletingCommercialId(null);
      setConfirmDeleteCommercial(null);
    }
  };

  const handleSaveFields = async (commercialId: string) => {
    const fields = editedFields[commercialId];
    if (!fields) return;
    setSavingFieldsId(commercialId);
    try {
      const updatePayload: Record<string, string> = {};
      if (fields.email !== undefined) updatePayload.email = fields.email;
      if (fields.telephone !== undefined) updatePayload.telephone = fields.telephone;
      const { error } = await supabase
        .from('pre_registered_commercials')
        .update(updatePayload)
        .eq('commercial_id', commercialId);
      if (error) throw error;
      setPreRegistered(prev => prev.map(p =>
        p.commercial_id === commercialId
          ? { ...p, ...(fields.email !== undefined && { email: fields.email }), ...(fields.telephone !== undefined && { telephone: fields.telephone }) }
          : p
      ));
      setEditedFields(prev => { const n = { ...prev }; delete n[commercialId]; return n; });
      toast({ title: 'Enregistré' });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder les modifications.' });
    } finally {
      setSavingFieldsId(null);
    }
  };

  const handleFieldChange = (commercialId: string, field: 'email' | 'telephone', value: string, originalValue: string) => {
    setEditedFields(prev => {
      const current = prev[commercialId] || {};
      const updated = { ...current, [field]: value };
      // If value is back to original, remove the field
      if (value === originalValue) {
        delete updated[field];
      }
      if (Object.keys(updated).length === 0) {
        const n = { ...prev }; delete n[commercialId]; return n;
      }
      return { ...prev, [commercialId]: updated };
    });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const selectedExistingCommercial = COMMERCIAUX.find(c => c.id === selectedExistingId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestion des accès
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez les utilisateurs et leurs permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchUsers(); fetchPreRegistered(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button size="sm" onClick={() => setShowNewProfileDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau profil
          </Button>
        </div>
      </div>

      {/* Section : Commerciaux pré-enregistrés */}
      <Card>
        <button
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors rounded-t-lg"
          onClick={() => setShowPreRegistered(p => !p)}
        >
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Commerciaux pré-autorisés
            {!preLoading && (
              <Badge variant="secondary" className="text-xs ml-1">{preRegistered.length}</Badge>
            )}
          </CardTitle>
          {showPreRegistered ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showPreRegistered && (
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-3">
              Ces emails seront automatiquement assignés au rôle "Commercial" à leur inscription.
            </p>
            {preLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : preRegistered.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Aucun commercial pré-enregistré</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email / Téléphone</TableHead>
                    <TableHead>ID Commercial</TableHead>
                    <TableHead>Ajouté le</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preRegistered.map((p) => {
                    const commercialData = COMMERCIAUX.find(c => c.id === p.commercial_id);
                    const entityLabel = commercialData ? ENTITIES.find(e => e.id === commercialData.entity)?.label : null;
                    const edited = editedFields[p.commercial_id];
                    const hasChanges = !!edited;
                    const currentEmail = edited?.email ?? p.email;
                    const currentTel = edited?.telephone ?? p.telephone ?? '';
                    return (
                      <TableRow key={p.commercial_id}>
                        <TableCell className="font-medium">
                          <div>{p.full_name}</div>
                          {entityLabel && <div className="text-[10px] text-muted-foreground">{entityLabel}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <Input
                                value={currentEmail}
                                onChange={e => handleFieldChange(p.commercial_id, 'email', e.target.value, p.email)}
                                className="h-7 text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <Input
                                value={currentTel}
                                onChange={e => handleFieldChange(p.commercial_id, 'telephone', e.target.value, p.telephone ?? '')}
                                placeholder="Téléphone"
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.commercial_id}</code>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(p.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {hasChanges && (
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary"
                                onClick={() => handleSaveFields(p.commercial_id)}
                                disabled={savingFieldsId === p.commercial_id}
                              >
                                {savingFieldsId === p.commercial_id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Check className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setConfirmDeleteCommercial(p.commercial_id)}
                              disabled={deletingCommercialId === p.commercial_id}
                            >
                              {deletingCommercialId === p.commercial_id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        )}
      </Card>

      {/* Section : Utilisateurs inscrits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Utilisateurs inscrits ({users.length})
          </CardTitle>
          <CardDescription>Assignez des rôles aux utilisateurs inscrits</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun utilisateur inscrit</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role || 'none'}
                        onValueChange={(value) => {
                          if (value === 'none') setDeleteUserId(user.id);
                          else handleRoleChange(user.id, value as 'admin' | 'commercial' | 'user');
                        }}
                        disabled={updatingUserId === user.id}
                      >
                        <SelectTrigger className="w-[140px]">
                          {updatingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue>
                              {user.role === 'admin' && <Badge variant="default" className="bg-primary">Admin</Badge>}
                              {user.role === 'commercial' && <Badge variant="outline" className="border-primary/50 text-primary">Commercial</Badge>}
                              {user.role === 'user' && <Badge variant="secondary">Utilisateur</Badge>}
                              {!user.role && <span className="text-muted-foreground">Aucun rôle</span>}
                            </SelectValue>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2"><Shield className="h-4 w-4" />Admin</div>
                          </SelectItem>
                          <SelectItem value="commercial">
                            <div className="flex items-center gap-2"><Building2 className="h-4 w-4" />Commercial</div>
                          </SelectItem>
                          <SelectItem value="user">
                            <div className="flex items-center gap-2"><Users className="h-4 w-4" />Utilisateur</div>
                          </SelectItem>
                          {user.role && (
                            <SelectItem value="none">
                              <div className="flex items-center gap-2 text-destructive"><Trash2 className="h-4 w-4" />Retirer le rôle</div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nouveau Profil */}
      <Dialog open={showNewProfileDialog} onOpenChange={setShowNewProfileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Nouveau profil commercial
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Toggle : depuis la liste existante ou manuel */}
            <div className="flex gap-2">
              <Button
                variant={!useExistingCommercial ? 'default' : 'outline'}
                size="sm" className="flex-1"
                onClick={() => { setUseExistingCommercial(false); setSelectedExistingId(''); }}
              >
                Saisie manuelle
              </Button>
              <Button
                variant={useExistingCommercial ? 'default' : 'outline'}
                size="sm" className="flex-1"
                onClick={() => setUseExistingCommercial(true)}
              >
                Depuis le référentiel
              </Button>
            </div>

            {useExistingCommercial ? (
              /* Sélection depuis COMMERCIAUX */
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Commercial du référentiel</Label>
                  <Select value={selectedExistingId} onValueChange={setSelectedExistingId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un commercial..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITIES.map(entity => (
                        <div key={entity.id}>
                          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{entity.label}</div>
                          {COMMERCIAUX.filter(c => c.entity === entity.id).map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nom}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedExistingCommercial && (
                  <Card className="bg-muted/30">
                    <CardContent className="p-3 space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{selectedExistingCommercial.email}</span>
                      </div>
                      {selectedExistingCommercial.telephone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{selectedExistingCommercial.telephone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{ENTITIES.find(e => e.id === selectedExistingCommercial.entity)?.label}</span>
                      </div>
                      <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded block">{selectedExistingCommercial.id}</code>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              /* Saisie manuelle */
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nom complet *</Label>
                  <Input
                    placeholder="Ex: Jean Dupont"
                    value={newProfile.full_name}
                    onChange={e => setNewProfile(p => ({ ...p, full_name: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email professionnel *</Label>
                  <Input
                    placeholder="Ex: j.dupont@cybertek-pro.fr"
                    type="email"
                    value={newProfile.email}
                    onChange={e => setNewProfile(p => ({ ...p, email: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Téléphone</Label>
                  <Input
                    placeholder="Ex: 06 12 34 56 78"
                    type="tel"
                    value={newProfile.telephone}
                    onChange={e => setNewProfile(p => ({ ...p, telephone: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Entité</Label>
                  <Select value={newProfile.entity} onValueChange={v => setNewProfile(p => ({ ...p, entity: v }))}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Choisir une entité..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITIES.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Identifiant commercial *</Label>
                  <Input
                    placeholder="Ex: jd-cybertek"
                    value={newProfile.commercial_id}
                    onChange={e => setNewProfile(p => ({ ...p, commercial_id: e.target.value }))}
                    className="h-8 text-sm font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Identifiant unique, sans espaces (ex: jd-cybertek)</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProfileDialog(false)} disabled={savingProfile}>
              Annuler
            </Button>
            <Button onClick={handleSaveNewProfile} disabled={savingProfile}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm supprimer commercial pré-enregistré */}
      <AlertDialog open={!!confirmDeleteCommercial} onOpenChange={() => setConfirmDeleteCommercial(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce commercial ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce commercial ne sera plus automatiquement reconnu à l'inscription. Les comptes existants ne seront pas affectés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteCommercial && handleDeletePreRegistered(confirmDeleteCommercial)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm retirer rôle utilisateur */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le rôle ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'utilisateur n'aura plus accès aux fonctionnalités liées à son rôle actuel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && handleDeleteRole(deleteUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
