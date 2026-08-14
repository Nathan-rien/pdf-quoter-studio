export interface RemoteSupportCsvRow {
  bu: string | null;
  commercial_name: string | null;
  entity: string;
  client_number: string | null;
  order_number: string | null;
  invoice_number: string | null;
  forfait: string | null;
  tickets_label: string | null;
  tickets_initial: number | null;
  tickets_remaining: number | null;
  attribution: string | null;
  machines_count: number | null;
  products_sn: string | null;
  start_date: string | null;
  end_date: string | null;
  is_paid: boolean;
}

/** Split a CSV text into rows of cells, honouring quotes and embedded newlines. */
function splitCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(cell);
      cell = '';
    } else if (c === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += c;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] ?? '';
  const counts: Record<string, number> = {
    ';': (firstLine.match(/;/g) ?? []).length,
    ',': (firstLine.match(/,/g) ?? []).length,
    '\t': (firstLine.match(/\t/g) ?? []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const HEADERS: Record<keyof RemoteSupportCsvRow, string[]> = {
  bu: ['bu'],
  commercial_name: ['commerciale', 'commercial'],
  entity: ['entite'],
  client_number: ['nclt', 'noclt', 'numeroclient'],
  order_number: ['ncmddus', 'ncmd', 'nocmd'],
  invoice_number: ['nfact', 'nofact', 'nfacture'],
  forfait: ['forfait'],
  tickets_label: ['nbretickets', 'nbtickets', 'nombretickets'],
  tickets_initial: ['ticketsinitiaux'],
  tickets_remaining: ['ticketsrestants'],
  attribution: ['attribution'],
  machines_count: ['nbremachines', 'nbmachines', 'nombremachines'],
  products_sn: ['listeproduitssn', 'listeproduits', 'produitssn'],
  start_date: ['debut'],
  end_date: ['fin'],
  is_paid: ['payer', 'paye'],
};

function indexOfHeader(headers: string[], keys: string[]): number {
  const normed = headers.map(norm);
  for (const k of keys) {
    const exact = normed.indexOf(k);
    if (exact !== -1) return exact;
  }
  for (const k of keys) {
    const partial = normed.findIndex((h) => h.startsWith(k) || k.startsWith(h));
    if (partial !== -1 && normed[partial] !== '') return partial;
  }
  return -1;
}

function parseDate(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const m = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})/);
  if (!m) return null;
  let [, a, b, y] = m;
  // CSV export uses M/D/YYYY; fall back to D/M/YYYY when the first part cannot be a month.
  let month = Number(a);
  let day = Number(b);
  if (month > 12) {
    day = Number(a);
    month = Number(b);
  }
  const year = y.length === 2 ? 2000 + Number(y) : Number(y);
  if (!month || !day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseBool(v: string): boolean {
  const s = norm(v);
  return ['vrai', 'true', 'oui', 'yes', '1', 'x'].includes(s);
}

function parseNumber(v: string): number | null {
  const s = v.replace(/\s/g, '').replace(',', '.');
  if (!s) return null;
  const n = Number(s.match(/-?\d+(\.\d+)?/)?.[0] ?? NaN);
  return Number.isFinite(n) ? n : null;
}

/** Derives a ticket quota from a free-text ticket label such as "5 tickets" or "39 x ...". */
function ticketsFromLabel(label: string): number | null {
  const s = label.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);
  const m = s.match(/(\d+)\s*(?:x|tickets?)/i);
  return m ? Number(m[1]) : null;
}

export function parseRemoteSupportCsv(text: string): RemoteSupportCsvRow[] {
  const clean = text.replace(/^\uFEFF/, '');
  const rows = splitCsv(clean, detectDelimiter(clean));
  if (rows.length < 2) return [];

  const headers = rows[0];
  const idx = Object.fromEntries(
    (Object.keys(HEADERS) as (keyof RemoteSupportCsvRow)[]).map((k) => [
      k,
      indexOfHeader(headers, HEADERS[k]),
    ]),
  ) as Record<keyof RemoteSupportCsvRow, number>;

  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');

  return rows
    .slice(1)
    .map((r) => {
      const entity = cell(r, idx.entity);
      if (!entity) return null;
      const label = cell(r, idx.tickets_label);
      const initial = parseNumber(cell(r, idx.tickets_initial)) ?? ticketsFromLabel(label);
      const remaining = parseNumber(cell(r, idx.tickets_remaining)) ?? initial;
      return {
        bu: cell(r, idx.bu) || null,
        commercial_name: cell(r, idx.commercial_name) || null,
        entity,
        client_number: cell(r, idx.client_number) || null,
        order_number: cell(r, idx.order_number) || null,
        invoice_number: cell(r, idx.invoice_number) || null,
        forfait: cell(r, idx.forfait) || null,
        tickets_label: label || null,
        tickets_initial: initial,
        tickets_remaining: remaining,
        attribution: cell(r, idx.attribution) || null,
        machines_count: parseNumber(cell(r, idx.machines_count)),
        products_sn: cell(r, idx.products_sn) || null,
        start_date: parseDate(cell(r, idx.start_date)),
        end_date: parseDate(cell(r, idx.end_date)),
        is_paid: parseBool(cell(r, idx.is_paid)),
      } satisfies RemoteSupportCsvRow;
    })
    .filter((r): r is RemoteSupportCsvRow => r !== null);
}
