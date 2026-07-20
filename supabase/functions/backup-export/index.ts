import { createClient } from 'npm:@supabase/supabase-js@2';
import JSZip from 'npm:jszip@3.10.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Tables métier à sauvegarder (ordre = ordre d'insertion pour la restauration)
const TABLES = [
  'pre_registered_commercials',
  'profiles',
  'user_roles',
  'admin_settings',
  'pdf_templates',
  'template_versions',
  'options_services',
  'service_proposals',
  'proposal_exports',
  'contracts',
  'client_service_references',
  'ticket_usage_log',
  'intervention_planning',
  'gantt_projects',
  'gantt_milestones',
  'gantt_tasks',
  'gantt_subtasks',
  'gantt_dependencies',
  'edi_import_lines',
];

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

    const zip = new JSZip();
    const tablesMeta: Record<string, number> = {};
    let totalRows = 0;

    for (const table of TABLES) {
      const { data, error } = await admin.from(table).select('*');
      if (error) {
        console.error(`[backup-export] table ${table} error`, error);
        zip.file(`${table}.json`, JSON.stringify({ error: error.message }, null, 2));
        tablesMeta[table] = 0;
        continue;
      }
      const rows = data ?? [];
      zip.file(`${table}.json`, JSON.stringify(rows, null, 2));
      tablesMeta[table] = rows.length;
      totalRows += rows.length;
    }

    // Author name
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .maybeSingle();
    const authorName = profile?.full_name || profile?.email || 'admin';

    const manifest = {
      version: 1,
      created_at: new Date().toISOString(),
      created_by: userId,
      created_by_name: authorName,
      tables: TABLES,
      rows_per_table: tablesMeta,
      total_rows: totalRows,
      total_tables: TABLES.length,
      note: 'Backup ne contient PAS les comptes auth ni les fichiers du storage (pièces jointes contrats, logos).',
    };
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    const zipBytes = await zip.generateAsync({ type: 'uint8array' });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `${ts}_${crypto.randomUUID()}.zip`;

    const { error: upErr } = await admin.storage
      .from('backups')
      .upload(filePath, zipBytes, {
        contentType: 'application/zip',
        upsert: false,
      });
    if (upErr) {
      return json({ error: `upload_failed: ${upErr.message}` }, 500);
    }

    const { data: backupRow, error: insErr } = await admin
      .from('backups')
      .insert({
        created_by: userId,
        created_by_name: authorName,
        file_path: filePath,
        size_bytes: zipBytes.length,
        tables_count: TABLES.length,
        rows_count: totalRows,
        kind: 'manual',
      })
      .select()
      .single();
    if (insErr) {
      return json({ error: `insert_failed: ${insErr.message}` }, 500);
    }

    const { data: signed } = await admin.storage
      .from('backups')
      .createSignedUrl(filePath, 300);

    return json({
      backup: backupRow,
      download_url: signed?.signedUrl ?? null,
      manifest,
    });
  } catch (e) {
    console.error('[backup-export] fatal', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
