// Génération HTML (A4 .page-sheet) du devis transactionnel.
// Le générateur ne reçoit qu'un modèle d'impression filtré : les champs internes
// (prix d'achat, grossiste, réf. fournisseur, taux de marque, marge) n'y existent pas.
import type { TransacBrandSettings } from '@/lib/transac-brands';
import { computeTransacTotals, lineTotalHt, type TransacLine, type TransacRentalResult } from '@/lib/transac-calculations';

export interface TransacAddress { name?: string; street?: string; zip?: string; city?: string; country?: string }

export interface TransacQuoteDraft {
  brand: 'cybertek-pro' | 'grosbill-pro';
  quoteNumber: string;
  clientNumber: string;
  clientName: string;
  quoteDate: string;
  validUntil: string;
  commercialName: string;
  commercialPhone: string | null;
  commercialEmail: string | null;
  deliveryAddress: TransacAddress;
  billingAddress: TransacAddress;
  billingSameAsDelivery: boolean;
  comment: string;
  lines: TransacLine[];
  rental: TransacRentalResult | null;
}

export interface TransacPrintLine {
  reference: string;
  designation: string;
  ecoParticipation: number | null;
  unitPriceHt: number;
  quantity: number;
  totalHt: number;
}

export interface TransacPrintModel {
  brand: TransacBrandSettings;
  logoUrl: string;
  quoteNumber: string;
  clientNumber: string;
  clientName: string;
  quoteDate: string;
  validUntil: string;
  commercial: { name: string; phone: string | null; email: string | null };
  delivery: TransacAddress;
  billing: TransacAddress;
  comment: string;
  lines: TransacPrintLine[];
  totals: { ht: number; tva: number; ttc: number };
  financing: null | { durationMonths: number; periodicity: string; periodRent: number; totalCost: number; fraisDossier: number | null };
}

/** Seul point de passage vers l'impression : construit une liste blanche de champs visibles. */
export function toPrintModel(d: TransacQuoteDraft, brand: TransacBrandSettings, logoUrl: string): TransacPrintModel {
  const totals = computeTransacTotals(d.lines);
  const r = d.rental;
  return {
    brand, logoUrl,
    quoteNumber: d.quoteNumber, clientNumber: d.clientNumber, clientName: d.clientName,
    quoteDate: d.quoteDate, validUntil: d.validUntil,
    commercial: { name: d.commercialName, phone: d.commercialPhone, email: d.commercialEmail },
    delivery: { ...d.deliveryAddress },
    billing: d.billingSameAsDelivery ? { ...d.deliveryAddress } : { ...d.billingAddress },
    comment: d.comment,
    lines: d.lines.map((l) => ({
      reference: l.reference, designation: l.designation, ecoParticipation: l.ecoParticipation,
      unitPriceHt: l.unitPriceHt, quantity: l.quantity, totalHt: lineTotalHt(l),
    })),
    totals: { ht: totals.totalHt, tva: totals.totalTva, ttc: totals.totalTtc },
    financing: r && r.status === 'ok'
      ? { durationMonths: r.durationMonths, periodicity: r.periodicity === 'trimestriel' ? 'Trimestrielle' : 'Mensuelle',
          periodRent: r.periodRent, totalCost: r.totalCost, fraisDossier: r.fraisDossier }
      : null,
  };
}

const esc = (s: string | null | undefined) =>
  (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const nl = (s: string) => esc(s).replace(/\n/g, '<br/>');
const eur = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const date = (iso: string) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR') : '');
const addr = (a: TransacAddress) =>
  [a.name, a.street, [a.zip, a.city].filter(Boolean).join(' '), a.country].filter((x) => x && x.trim()).map(esc).join('<br/>');

const CSS = `
*{box-sizing:border-box}body{margin:0}
.page-sheet{width:210mm;height:297mm;padding:12mm 12mm 10mm;font-family:Arial,Helvetica,sans-serif;font-size:9.5pt;color:#1a1a1a;background:#fff;display:flex;flex-direction:column;overflow:hidden}
.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a1a1a;padding-bottom:4mm}
.hd img{height:16mm;max-width:60mm;object-fit:contain}
.hd .meta{text-align:right;font-size:9pt;line-height:1.5}
.hd h1{font-size:16pt;margin:0 0 2mm}
.blocks{display:flex;gap:4mm;margin-top:4mm}
.box{flex:1;border:1px solid #bbb;border-radius:2mm;padding:3mm;font-size:8.8pt;line-height:1.4}
.box h3{margin:0 0 1.5mm;font-size:8pt;text-transform:uppercase;color:#555}
table{width:100%;border-collapse:collapse;margin-top:4mm}
th{background:#1a1a1a;color:#fff;font-size:8.5pt;padding:2mm;text-align:left}
td{border-bottom:1px solid #ddd;padding:1.8mm 2mm;vertical-align:top;font-size:8.8pt}
.num{text-align:right;white-space:nowrap}
.eco{font-size:7.5pt;color:#555}
.tot{margin-left:auto;width:75mm;margin-top:4mm}
.tot div{display:flex;justify-content:space-between;padding:1.2mm 2mm}
.tot .ttc{background:#1a1a1a;color:#fff;font-weight:bold}
.fin{border:1.5px solid #1a1a1a;border-radius:2mm;padding:3mm;margin-top:4mm}
.fin h3{margin:0 0 2mm;font-size:10pt}
.fin .g{display:grid;grid-template-columns:1fr 1fr;gap:1mm 6mm}
.note{font-size:8pt;font-style:italic;margin-top:2mm}
.sig{display:flex;gap:6mm;margin-top:5mm}
.sig .box{min-height:30mm}
.ft{margin-top:auto;border-top:1px solid #bbb;padding-top:2mm;font-size:7pt;color:#444;line-height:1.35}
.ft .cond{white-space:normal;margin-bottom:1.5mm}
.pg{text-align:right;font-size:7pt;color:#777}
`;

function chunkLines(lines: TransacPrintLine[]): TransacPrintLine[][] {
  const weight = (l: TransacPrintLine) => 1 + (l.designation.match(/\n/g)?.length ?? 0) * 0.6 + (l.ecoParticipation ? 0.5 : 0);
  const pages: TransacPrintLine[][] = [[]];
  let used = 0;
  let cap = 18;
  for (const l of lines) {
    const w = weight(l);
    if (used + w > cap && pages[pages.length - 1].length) { pages.push([]); used = 0; cap = 30; }
    pages[pages.length - 1].push(l);
    used += w;
  }
  // La dernière page doit laisser la place aux totaux, financement et signature.
  if (used > cap - 10) pages.push([]);
  return pages;
}

export function generateTransacQuoteHtml(m: TransacPrintModel): string {
  const pages = chunkLines(m.lines);
  const header = `
    <div class="hd">
      <div><img src="${esc(m.logoUrl)}" alt="${esc(m.brand.label)}"/></div>
      <div class="meta"><h1>DEVIS N° ${esc(m.quoteNumber)}</h1>
        Date : ${date(m.quoteDate)} — Validité : ${date(m.validUntil)}<br/>
        N° client : ${esc(m.clientNumber)}</div>
    </div>`;
  const footer = (i: number) => `
    <div class="ft">
      ${i === pages.length - 1 ? `<div class="cond">${nl(m.brand.conditions)}</div>` : ''}
      <div>${esc(m.brand.legalFooter)}</div>
      <div>${esc(m.brand.phone)} · ${esc(m.brand.email)} · ${esc(m.brand.website)} · CGV : ${esc(m.brand.cgvUrl)}</div>
      <div class="pg">Page ${i + 1} / ${pages.length}</div>
    </div>`;
  const table = (rows: TransacPrintLine[]) => rows.length ? `
    <table><thead><tr><th style="width:18%">REF</th><th>Désignation</th><th class="num" style="width:14%">PU HT</th><th class="num" style="width:8%">Qté</th><th class="num" style="width:15%">Total HT</th></tr></thead>
    <tbody>${rows.map((l) => `<tr><td>${esc(l.reference)}</td><td>${nl(l.designation)}${l.ecoParticipation ? `<div class="eco">dont éco-participation : ${eur(l.ecoParticipation)}</div>` : ''}</td>
      <td class="num">${eur(l.unitPriceHt)}</td><td class="num">${l.quantity}</td><td class="num">${eur(l.totalHt)}</td></tr>`).join('')}</tbody></table>` : '';
  const f = m.financing;
  const last = `
    <div class="tot"><div><span>Total HT</span><span>${eur(m.totals.ht)}</span></div>
      <div><span>TVA 20 %</span><span>${eur(m.totals.tva)}</span></div>
      <div class="ttc"><span>Total TTC</span><span>${eur(m.totals.ttc)}</span></div></div>
    <div class="note">Sous réserve d'acceptation du comité Groupe Cybertek.</div>
    ${f ? `<div class="fin"><h3>Proposition de financement</h3><div class="g">
      <div>Durée : <b>${f.durationMonths} mois</b></div><div>Périodicité : <b>${f.periodicity}</b></div>
      <div>Loyer HT : <b>${eur(f.periodRent)}</b></div><div>Coût total HT : <b>${eur(f.totalCost)}</b></div>
      <div>Frais de dossier : <b>${f.fraisDossier === null ? '—' : `${eur(f.fraisDossier)} HT`}</b></div></div>
      <div class="note">Sous réserve d'acceptation du comité de financement.</div></div>` : ''}
    ${m.comment.trim() ? `<div class="box" style="margin-top:4mm"><h3>Commentaire</h3>${nl(m.comment)}</div>` : ''}
    <div class="sig"><div class="box"><h3>Bon pour accord</h3>Date, cachet et signature précédés de la mention « Bon pour accord »</div></div>`;
  const body = pages.map((rows, i) => `
    <div class="page-sheet">${header}
      ${i === 0 ? `<div class="blocks">
        <div class="box"><h3>Votre contact</h3>${esc(m.commercial.name)}${m.commercial.phone ? `<br/>${esc(m.commercial.phone)}` : ''}${m.commercial.email ? `<br/>${esc(m.commercial.email)}` : ''}</div>
        <div class="box"><h3>Adresse de livraison</h3>${addr(m.delivery)}</div>
        <div class="box"><h3>Adresse de facturation</h3>${addr(m.billing)}</div></div>` : ''}
      ${table(rows)}
      ${i === pages.length - 1 ? last : ''}
      ${footer(i)}
    </div>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Devis ${esc(m.quoteNumber)}</title><style>${CSS}</style></head><body>${body}</body></html>`;
}
