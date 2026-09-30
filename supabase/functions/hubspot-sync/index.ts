import { createClient } from 'npm:@supabase/supabase-js@2';

type AdminClient = ReturnType<typeof createClient>;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const HUBSPOT_BASE = 'https://api.hubapi.com';
const PAGE_SIZE = 100;

interface HubspotResult {
  id: string;
  properties: Record<string, string | null>;
}

interface HubspotPage {
  results: HubspotResult[];
  paging?: { next?: { after?: string } };
}

async function hubspotFetch(path: string, apiKey: string): Promise<HubspotPage> {
  const res = await fetch(`${HUBSPOT_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HubSpot ${path} -> ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function* hubspotPages(objectType: string, properties: string[], apiKey: string) {
  let after: string | undefined;
  do {
    const propsQuery = properties.map((p) => `properties=${encodeURIComponent(p)}`).join('&');
    const path = `/crm/v3/objects/${objectType}?limit=${PAGE_SIZE}&${propsQuery}${after ? `&after=${after}` : ''}`;
    const page = await hubspotFetch(path, apiKey);
    yield page.results;
    after = page.paging?.next?.after;
  } while (after);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const hubspotKey = Deno.env.get('HUBSPOT_SERVICE_KEY');

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const userId = claims.claims.sub as string;

    const admin = createClient(url, service);
    const { data: isAdminRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    if (!isAdminRow) {
      return json({ error: 'forbidden' }, 403);
    }

    if (!hubspotKey) {
      return json({ error: 'HUBSPOT_SERVICE_KEY secret is not configured' }, 500);
    }

    const { data: logRow, error: logInsertError } = await admin
      .from('hubspot_sync_log')
      .insert({ status: 'running', triggered_by_user: userId })
      .select()
      .single();
    if (logInsertError) {
      return json({ error: `log_insert_failed: ${logInsertError.message}` }, 500);
    }

    let recordsProcessed = 0;
    try {
      recordsProcessed += await syncContacts(admin, hubspotKey);
      recordsProcessed += await syncCompanies(admin, hubspotKey);
      recordsProcessed += await syncHistorique(admin, hubspotKey, 'deal', 'deals', ['dealname', 'amount', 'closedate', 'dealstage']);
      recordsProcessed += await syncHistorique(admin, hubspotKey, 'quote', 'quotes', ['hs_title', 'hs_status', 'hs_createdate']);
      recordsProcessed += await syncHistorique(admin, hubspotKey, 'invoice', 'invoices', ['hs_title', 'hs_invoice_status', 'hs_createdate']);
      recordsProcessed += await syncHistorique(admin, hubspotKey, 'line_item', 'line_items', ['name', 'amount', 'quantity']);

      await admin
        .from('hubspot_sync_log')
        .update({
          status: 'success',
          finished_at: new Date().toISOString(),
          records_processed: recordsProcessed,
        })
        .eq('id', logRow.id);

      return json({ success: true, records_processed: recordsProcessed });
    } catch (syncError) {
      console.error('[hubspot-sync] sync error', syncError);
      await admin
        .from('hubspot_sync_log')
        .update({
          status: 'error',
          finished_at: new Date().toISOString(),
          records_processed: recordsProcessed,
          error_message: (syncError as Error).message,
        })
        .eq('id', logRow.id);
      return json({ error: (syncError as Error).message, records_processed: recordsProcessed }, 502);
    }
  } catch (e) {
    console.error('[hubspot-sync] fatal', e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function syncContacts(admin: AdminClient, apiKey: string): Promise<number> {
  let count = 0;
  for await (const batch of hubspotPages('contacts', ['firstname', 'lastname', 'email', 'phone', 'company'], apiKey)) {
    if (batch.length === 0) continue;
    const rows = batch.map((c) => ({
      hubspot_contact_id: c.id,
      nom: [c.properties.firstname, c.properties.lastname].filter(Boolean).join(' ') || null,
      societe: c.properties.company ?? null,
      email: c.properties.email ?? null,
      telephone: c.properties.phone ?? null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await admin.from('clients').upsert(rows, { onConflict: 'hubspot_contact_id' });
    if (error) throw new Error(`clients upsert (contacts): ${error.message}`);
    count += rows.length;
  }
  return count;
}

async function syncCompanies(admin: AdminClient, apiKey: string): Promise<number> {
  let count = 0;
  for await (const batch of hubspotPages('companies', ['name', 'domain', 'phone'], apiKey)) {
    if (batch.length === 0) continue;
    for (const c of batch) {
      const { data: existing } = await admin
        .from('clients')
        .select('id, telephone')
        .eq('hubspot_company_id', c.id)
        .maybeSingle();
      if (existing) {
        const { error } = await admin
          .from('clients')
          .update({
            societe: c.properties.name ?? null,
            telephone: c.properties.phone ?? existing.telephone ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw new Error(`clients update (companies): ${error.message}`);
      } else {
        const { error } = await admin.from('clients').insert({
          hubspot_company_id: c.id,
          societe: c.properties.name ?? null,
          telephone: c.properties.phone ?? null,
        });
        if (error) throw new Error(`clients insert (companies): ${error.message}`);
      }
      count += 1;
    }
  }
  return count;
}

// Associe un historique HubSpot (deal/quote/invoice/line_item) au client correspondant
// via l'API d'associations HubSpot, puis upsert idempotent dans clients_historique.
async function syncHistorique(
  admin: AdminClient,
  apiKey: string,
  type: string,
  objectType: string,
  properties: string[],
): Promise<number> {
  let count = 0;
  for await (const batch of hubspotPages(objectType, properties, apiKey)) {
    if (batch.length === 0) continue;
    for (const item of batch) {
      let contactId: string | null = null;
      try {
        const assoc = await hubspotFetch(`/crm/v3/objects/${objectType}/${item.id}/associations/contacts`, apiKey);
        contactId = (assoc as unknown as { results?: Array<{ id: string }> }).results?.[0]?.id ?? null;
      } catch {
        contactId = null;
      }
      if (!contactId) continue;

      const { data: client } = await admin
        .from('clients')
        .select('id')
        .eq('hubspot_contact_id', contactId)
        .maybeSingle();
      if (!client) continue;

      const resume = item.properties.dealname ?? item.properties.hs_title ?? item.properties.name ?? null;
      const rawAmount = item.properties.amount ?? item.properties.hs_amount ?? null;
      const rawDate = item.properties.closedate ?? item.properties.hs_createdate ?? null;

      const { error } = await admin.from('clients_historique').upsert(
        {
          client_id: client.id,
          type,
          date: rawDate ? new Date(rawDate).toISOString() : new Date().toISOString(),
          resume,
          montant: rawAmount != null ? Number(rawAmount) : null,
          hubspot_reference: item.id,
          raw_payload: item.properties,
        },
        { onConflict: 'client_id,type,hubspot_reference' },
      );
      if (error) throw new Error(`clients_historique upsert (${type}): ${error.message}`);
      count += 1;
    }
  }
  return count;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
