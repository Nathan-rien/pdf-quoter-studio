import { createClient } from 'npm:@supabase/supabase-js@2';
import JSZip from 'npm:jszip@3.10.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Ordre d'insertion (dépendances). La purge se fait dans l'ordre inverse.
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

// Tables jamais purgées (comptes utilisateurs, rôles) pour éviter de casser la session admin.
// Elles sont upsertées si présentes dans la sauvegarde.
const NEVER_PURGE = new Set(['profiles', 'user_roles', 'pre_registered_commercials']);

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

    // Payload : { backup_id } ou { zip_base64 }
    const body = await req.json().catch(() => ({}));
    const { backup_id, zip_base64, confirm } = body ?? {};
    if (confirm !== 'REMPLACER') {
      return json({ error: 'confirm_required' }, 400);
    }

    let zipBytes: Uint8Array | null = null;
    let sourceBackupId: string | null = null;

    if (backup_id) {
      const { data: backup, error: bErr } = await admin
        .from('backups')
        .select('*')
        .eq('id', backup_id)
        .maybeSingle();
      if (bErr || !backup) return json({ error: 'backup_not_found' }, 404);
      sourceBackupId = backup.id;
      const { data: file, error: dlErr } = await admin.storage
        .from('backups')
        .download(backup.file_path);
      if (dlErr || !file) return json({ error: `download_failed: ${dlErr?.message}` }, 500);
      zipBytes = new Uint8Array(await file.arrayBuffer());
    } else if (typeof zip_base64 === 'string') {
      zipBytes = base64ToBytes(zip_base64);
    } else {
      return json({ error: 'no_source' }, 400);
    }

    const zip = await JSZip.loadAsync(zipBytes);
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) return json({ error: 'invalid_backup_no_manifest' }, 400);
    const manifest = JSON.parse(await manifestFile.async('string'));
    if (manifest.version !== 1) {
      return json({ error: `unsupported_backup_version:${manifest.version}` }, 400);
    }

    // Purge (ordre inverse). On purge uniquement les tables présentes dans la sauvegarde
    // et pas dans NEVER_PURGE.
    const report: Record<string, { deleted?: number; inserted?: number; error?: string }> = {};
    const backupTables: string[] = manifest.tables ?? TABLES;
    const tablesToPurge = [...backupTables].reverse().filter((t) => !NEVER_PURGE.has(t));

    for (const table of tablesToPurge) {
      const { error, count } = await admin.from(table).delete({ count: 'exact' }).not('id', 'is', null);
      if (error) {
        report[table] = { error: `purge_failed: ${error.message}` };
      } else {
        report[table] = { deleted: count ?? 0 };
      }
    }

    // Insert dans l'ordre normal
    for (const table of backupTables) {
      const file = zip.file(`${table}.json`);
      if (!file) continue;
      const raw = await file.async('string');
      let rows: any[];
      try {
        const parsed = JSON.parse(raw);
        rows = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        report[table] = { ...(report[table] ?? {}), error: `parse_failed: ${(e as Error).message}` };
        continue;
      }
      if (rows.length === 0) {
        report[table] = { ...(report[table] ?? {}), inserted: 0 };
        continue;
      }
      // Upsert pour les tables never-purge, insert sinon.
      let insErr: unknown = null;
      if (NEVER_PURGE.has(table)) {
        const { error } = await admin.from(table).upsert(rows, { onConflict: 'id' });
        insErr = error;
      } else {
        // Chunk de 500 pour éviter les payloads trop gros
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          const { error } = await admin.from(table).insert(chunk);
          if (error) { insErr = error; break; }
        }
      }
      if (insErr) {
        report[table] = {
          ...(report[table] ?? {}),
          error: `insert_failed: ${(insErr as { message: string }).message}`,
        };
      } else {
        report[table] = { ...(report[table] ?? {}), inserted: rows.length };
      }
    }

    // Journaliser la restauration
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .maybeSingle();
    const authorName = profile?.full_name || profile?.email || 'admin';

    await admin.from('backups').insert({
      created_by: userId,
      created_by_name: authorName,
      file_path: `_restore_${new Date().toISOString()}.log`,
      size_bytes: 0,
      tables_count: backupTables.length,
      rows_count: Object.values(report).reduce((a, r) => a + (r.inserted ?? 0), 0),
      label: `Restauration${sourceBackupId ? ` de ${sourceBackupId}` : ' depuis fichier'}`,
      kind: 'restore',
      restored_from: sourceBackupId,
    });

    return json({ ok: true, report, manifest });
  } catch (e) {
    console.error('[backup-restore] fatal', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
