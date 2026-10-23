import { describe, expect, it } from 'vitest';
import { filterInterventions, interventionHours, interventionsCsv, interventionsRecapHtml, type ContractIntervention } from './interventions-recap';
const row = (statut: ContractIntervention['statut'], minutes: number, date = '2026-10-23T09:00:00Z') => ({ id: statut, statut, duree_estimee_minutes: minutes, date_intervention: date, technician_name: 'Jean Dupont', commentaire: 'Note; "test"', service_label: 'Maintenance' }) as ContractIntervention;
describe('Récap interventions', () => {
  it('sums minutes before rounding hours for each status', () => {
    expect(interventionHours([row('prevue', 20), row('prevue', 20), row('realisee', 90), row('annulee', 60)])).toEqual({ prevue: 0.67, realisee: 1.5, annulee: 1 });
  });
  it('uses inclusive Paris calendar dates for the period', () => {
    const rows = [row('prevue', 60, '2026-10-22T22:30:00Z'), row('realisee', 60, '2026-10-23T22:30:00Z')];
    expect(filterInterventions(rows, '2026-10-23', '2026-10-23').map(r => r.id)).toEqual(['prevue']);
  });
  it('exports UTF-8 semicolon CSV with escaped comments and concrete totals', () => {
    const csv = interventionsCsv([row('realisee', 90)]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Note; ""test"""');
    expect(csv).toContain('"Réalisée";"1.50"');
  });
  it('includes client, contract and status totals in the report', () => {
    const html = interventionsRecapHtml([row('realisee', 90)], 'Client A', 'C-123');
    expect(html).toContain('Client A'); expect(html).toContain('C-123'); expect(html).toContain('Réalisée : 1.50 h');
  });
});