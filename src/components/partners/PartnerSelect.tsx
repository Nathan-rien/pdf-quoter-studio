import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialPartners } from '@/hooks/useFinancialPartners';
import { normalizePartnerName, resolvePartner } from '@/lib/partners';

interface PartnerSelectProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  triggerClassName?: string;
}

export const INACTIVE_PARTNER_LABEL = 'Partenaire désactivé';

/**
 * Sélecteur de refinanceur : uniquement les partenaires actifs.
 * Si la valeur courante (dossier existant) ne correspond à aucun partenaire actif
 * (partenaire désactivé, alias, inconnu), elle est conservée comme entrée à part,
 * avec un badge « Partenaire désactivé » le cas échéant : le champ n'est jamais vidé.
 */
export function PartnerSelect({ value, onChange, id, placeholder = 'Sélectionner...', triggerClassName }: PartnerSelectProps) {
  const { data: allPartners = [] } = useFinancialPartners({ includeInactive: true });
  const active = allPartners.filter((p) => p.isActive);
  const current = value?.trim() ? value : null;
  const currentKey = normalizePartnerName(current);
  const resolved = current ? resolvePartner(allPartners, current) : null;
  const isListed = !!current && active.some((p) => normalizePartnerName(p.name) === currentKey);

  return (
    <Select value={current ?? ''} onValueChange={onChange}>
      <SelectTrigger id={id} className={triggerClassName}>
        <SelectValue placeholder={placeholder}>
          {current && (
            <span className="flex items-center gap-2">
              {current}
              {resolved && !resolved.isActive && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {INACTIVE_PARTNER_LABEL}
                </span>
              )}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {current && !isListed && (
          <SelectItem value={current} disabled={!!resolved && !resolved.isActive}>
            {current}
            {resolved && !resolved.isActive ? ` — ${INACTIVE_PARTNER_LABEL}` : ''}
          </SelectItem>
        )}
        {active.map((p) => (
          <SelectItem key={p.id} value={p.name}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
