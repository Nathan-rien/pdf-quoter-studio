import type { Tables } from '@/integrations/supabase/types';

export type ContractIntervention = Tables<'intervention_planning'> & { resolved_service_label?: string };
export const INTERVENTION_STATUS_LABELS = { prevue: 'Prévue', realisee: 'Réalisée', annulee: 'Annulée' };
export function interventionDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
export function filterInterventions(rows: ContractIntervention[], from = '', to = '') {
  return rows.filter(row => {
    const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date(row.date_intervention));
    return (!from || date >= from) && (!to || date <= to);
  });
}
export function interventionHours(rows: ContractIntervention[]) {
  const minutes = { prevue: 0, realisee: 0, annulee: 0 };
  rows.forEach(row => { minutes[row.statut] += row.duree_estimee_minutes ?? 0; });
  return Object.fromEntries(Object.entries(minutes).map(([key, value]) => [key, Math.round(value / 60 * 100) / 100])) as Record<keyof typeof minutes, number>;
}
const service = (row: ContractIntervention) => row.resolved_service_label || row.service_label || 'Prestation non précisée';
const csvCell = (value: unknown) => {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
export function interventionsCsv(rows: ContractIntervention[]) {
  const values: unknown[][] = [['Date', 'Technicien', 'Prestation', 'Durée (minutes)', 'Statut', 'Commentaire'], ...rows.map(row => [interventionDate(row.date_intervention), row.technician_name, service(row), row.duree_estimee_minutes ?? '', INTERVENTION_STATUS_LABELS[row.statut], row.commentaire ?? ''])];
  const totals = interventionHours(rows);
  values.push([], ['Total heures par statut'], ...Object.entries(totals).map(([status, hours]) => [INTERVENTION_STATUS_LABELS[status as keyof typeof totals], hours.toFixed(2)]));
  return '\uFEFF' + values.map(row => row.map(csvCell).join(';')).join('\r\n');
}
function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}
export function interventionsRecapHtml(rows: ContractIntervention[], client: string, number: string | null, from = '', to = '') {
  // Small fixed pages plus bounded text prevent long comments from overflowing A4.
  const chunks: ContractIntervention[][] = [];
  for (let i = 0; i < rows.length; i += 8) chunks.push(rows.slice(i, i + 8));
  if (!chunks.length) chunks.push([]);
  const totals = interventionHours(rows);
  const totalText = Object.entries(totals).map(([status, hours]) => `${INTERVENTION_STATUS_LABELS[status as keyof typeof totals]} : ${hours.toFixed(2)} h`).join(' · ');
  return `<!DOCTYPE html><html><head><style>
    :root{--paper:#fff;--ink:#222;--line:#ccc;--alt:#f4f4f4}
    *{box-sizing:border-box}body{margin:0;color:var(--ink);font-family:Arial,sans-serif;font-size:10pt}
    .page-sheet{width:210mm;height:297mm;padding:15mm;background:var(--paper);overflow:hidden}
    h1{font-size:18pt}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border-bottom:1px solid var(--line);padding:5px;text-align:left;overflow-wrap:anywhere;vertical-align:top}th{background:var(--alt)}
    .note{white-space:pre-wrap;font-size:9pt}.totals{margin-top:8mm}
  </style></head><body>${chunks.map((chunk, index) => `<section class="page-sheet"><h1>Récap interventions</h1><p><strong>${escapeHtml(client)}</strong> · Contrat ${escapeHtml(number || '—')}</p><p>Période : ${escapeHtml(from || 'Début')} au ${escapeHtml(to || 'Fin')} · Page ${index + 1}/${chunks.length}</p><table><thead><tr><th>Date</th><th>Technicien</th><th>Prestation</th><th>Durée</th><th>Statut</th></tr></thead><tbody>${chunk.map(row => `<tr><td>${escapeHtml(interventionDate(row.date_intervention))}</td><td>${escapeHtml(row.technician_name.slice(0, 150))}</td><td>${escapeHtml(service(row).slice(0, 200))}</td><td>${row.duree_estimee_minutes == null ? '—' : `${(Math.round(row.duree_estimee_minutes / 60 * 100) / 100).toFixed(2)} h`}</td><td>${INTERVENTION_STATUS_LABELS[row.statut]}</td></tr>${row.commentaire ? `<tr><td colspan="5" class="note">${escapeHtml(row.commentaire.slice(0, 500))}${row.commentaire.length > 500 ? '… (commentaire complet dans le CSV)' : ''}</td></tr>` : ''}`).join('')}</tbody></table>${index === chunks.length - 1 ? `<p class="totals"><strong>Total heures par statut</strong><br>${escapeHtml(totalText)}</p>` : ''}</section>`).join('')}</body></html>`;
}
export function downloadRecap(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}