import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useSaveBaseTauxFees } from '@/hooks/useFinancialPartners';
import type { BaseTauxRow } from '@/lib/partners';

export function BaseTauxFeesInput({ row, defaultFees }: { row: BaseTauxRow; defaultFees: number | null }) {
  const [value, setValue] = useState(row.fraisDossier == null ? '' : row.fraisDossier.toFixed(2));
  const save = useSaveBaseTauxFees();
  const commit = async () => {
    const parsed = value.trim() === '' ? null : Number(value.trim().replace(',', '.'));
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
      toast.error('Frais de dossier invalides');
      return;
    }
    const fraisDossier = parsed === null ? null : Math.round(parsed * 100) / 100;
    if (fraisDossier === (row.fraisDossier ?? null)) return;
    try {
      await save.mutateAsync({ id: row.id, fraisDossier });
      setValue(fraisDossier === null ? '' : fraisDossier.toFixed(2));
    } catch (error) {
      toast.error(`Enregistrement impossible : ${error instanceof Error ? error.message : 'erreur inconnue'}`);
      setValue(row.fraisDossier == null ? '' : row.fraisDossier.toFixed(2));
    }
  };
  return <Input
    aria-label={`Frais de dossier ${row.montantMin}–${row.montantMax} € ${row.dureeMois} mois`}
    title={defaultFees === null ? 'Valeur du partenaire non renseignée' : `Valeur du partenaire : ${defaultFees.toFixed(2)} € HT`}
    className="ml-auto h-8 w-32 text-right placeholder:text-muted-foreground"
    inputMode="decimal" value={value} disabled={save.isPending}
    placeholder={defaultFees === null ? '—' : defaultFees.toFixed(2)}
    onChange={(event) => setValue(event.target.value)}
    onBlur={commit}
    onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
  />;
}