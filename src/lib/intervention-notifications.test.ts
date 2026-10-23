import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const db = new PGlite();
const admin = '00000000-0000-0000-0000-000000000001';
const commercial = '00000000-0000-0000-0000-000000000002';
const other = '00000000-0000-0000-0000-000000000003';
const contract = '10000000-0000-0000-0000-000000000001';
const reference = '20000000-0000-0000-0000-000000000001';
beforeAll(async () => {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
  CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY, email text);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULLIF(current_setting('test.user_id',true),'')::uuid $$;
  GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
  CREATE TABLE public.user_roles(user_id uuid, role text); CREATE TABLE public.profiles(id uuid,full_name text);
  CREATE TABLE public.pre_registered_commercials(commercial_id text,email text,full_name text);
  CREATE TABLE public.contracts(id uuid PRIMARY KEY, commercial_id text,commercial_name text,client_name text);
  CREATE TABLE public.client_service_references(id uuid PRIMARY KEY,contract_id uuid,service_label text);
  CREATE TABLE public.intervention_planning(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reference_id uuid,client_name text,service_label text,technician_name text,date_intervention timestamptz,statut text,created_by uuid);
  CREATE FUNCTION public.has_role(uid uuid,r text) RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=uid AND role=r) $$;
  CREATE FUNCTION public.can_access_contract(uid uuid,cid text,cname text) RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$ SELECT public.has_role(uid,'admin') OR EXISTS(SELECT 1 FROM auth.users u JOIN public.pre_registered_commercials p ON lower(u.email)=lower(p.email) WHERE u.id=uid AND p.commercial_id=cid) $$;
  INSERT INTO auth.users VALUES ('${admin}','admin@test.invalid'),('${commercial}','commercial@test.invalid'),('${other}','other@test.invalid');
  INSERT INTO public.user_roles VALUES ('${admin}','admin'),('${commercial}','commercial');
  INSERT INTO public.profiles VALUES ('${commercial}','Jean Dupont'),('${other}','Autre Nom');
  INSERT INTO public.pre_registered_commercials VALUES ('jd','COMMERCIAL@test.invalid','Jean Dupont');
  INSERT INTO public.contracts VALUES ('${contract}','jd','Jean Dupont','Client A');
  INSERT INTO public.client_service_references VALUES ('${reference}','${contract}','Maintenance');
  INSERT INTO public.intervention_planning(reference_id,technician_name,date_intervention,statut) VALUES ('${reference}','Technicien','2026-10-23 09:00Z','prevue');`);
  await db.exec(readFileSync('drizzle/migrations/0002_intervention_notifications_contract_history.sql', 'utf8'));
  await db.exec(readFileSync('drizzle/migrations/0003_secure_contract_intervention_history.sql', 'utf8'));
  await db.exec(readFileSync('drizzle/migrations/0004_restrict_notification_browser_privileges.sql', 'utf8'));
  await db.exec(readFileSync('drizzle/migrations/0005_protect_notification_identity.sql', 'utf8'));
}, 30000);
afterAll(async () => { await db.close(); });
async function scalar(sql: string) { const result = await db.query<{ value: unknown }>(sql); return result.rows[0]?.value; }
describe('Intervention notifications — actual SQL in an isolated database', () => {
  it('backfills only the contract link without historical notifications', async () => {
    expect(await scalar('SELECT contract_id::text AS value FROM intervention_planning LIMIT 1')).toBe(contract);
    expect(await scalar('SELECT count(*)::int AS value FROM notifications')).toBe(0);
  });
  it('resolves the commercial through ID and case-insensitive email', async () => {
    expect(await scalar(`SELECT resolve_contract_commercial_user('${contract}')::text AS value`)).toBe(commercial);
  });
  it('quick exact normalized full name resolves to a unique account', async () => {
    await db.exec(`UPDATE contracts SET commercial_id='quick', commercial_name='  Jean   DUPONT  ';`);
    expect(await scalar(`SELECT resolve_contract_commercial_user('${contract}')::text AS value`)).toBe(commercial);
  });
  it('quick partial names never resolve', async () => {
    for (const name of ['CYRIL', 'Jonathan', 'Grégory']) {
      await db.exec(`UPDATE contracts SET commercial_name='${name}'`);
      expect(await scalar(`SELECT resolve_contract_commercial_user('${contract}')::text AS value`)).toBeNull();
    }
  });
  it('quick ambiguous full name never resolves', async () => {
    await db.exec(`UPDATE contracts SET commercial_name='Jean Dupont'; UPDATE profiles SET full_name='Jean Dupont' WHERE id='${other}'`);
    expect(await scalar(`SELECT resolve_contract_commercial_user('${contract}')::text AS value`)).toBeNull();
    await db.exec(`UPDATE profiles SET full_name='Autre Nom' WHERE id='${other}'; UPDATE contracts SET commercial_id='jd'`);
  });
  it('missing commercial account falls back to admins', async () => {
    await db.exec(`UPDATE contracts SET commercial_id='missing',commercial_name=NULL; INSERT INTO intervention_planning(contract_id,technician_name,date_intervention,statut) VALUES ('${contract}','Tech','2026-10-23 09:00Z','prevue')`);
    expect(await scalar("SELECT title AS value FROM notifications ORDER BY created_at DESC LIMIT 1")).toBe('[commercial non identifié] Intervention planifiée');
    expect(await scalar("SELECT user_id::text AS value FROM notifications ORDER BY created_at DESC LIMIT 1")).toBe(admin);
    await db.exec(`UPDATE contracts SET commercial_id='jd',commercial_name='Jean Dupont'`);
  });
  it('creates, reschedules, cancels and deletes using OLD and retains deleted ID', async () => {
    const id = '30000000-0000-0000-0000-000000000001';
    await db.exec(`INSERT INTO intervention_planning(id,reference_id,technician_name,date_intervention,statut,created_by) VALUES ('${id}','${reference}','Tech','2026-10-23 09:00Z','prevue','${admin}'); SET test.user_id='${admin}'; UPDATE intervention_planning SET date_intervention='2026-10-24 09:00Z' WHERE id='${id}'; UPDATE intervention_planning SET statut='annulee' WHERE id='${id}'; DELETE FROM intervention_planning WHERE id='${id}';`);
    const result = await db.query<{ type: string; user_id: string; message: string; contract_id: string }>(`SELECT type,user_id,message,contract_id FROM notifications WHERE intervention_id='${id}' ORDER BY created_at`);
    expect(result.rows.map(r => r.type)).toEqual(['intervention_created','intervention_rescheduled','intervention_cancelled','intervention_deleted']);
    expect(result.rows.every(r => r.user_id === commercial && r.contract_id === contract)).toBe(true);
    expect(result.rows[3]?.message).toBe('Client A · Maintenance · Tech · 24/10/2026 11:00');
  });
  it('hors contrat deletion notifies admins without contract link', async () => {
    const id = '30000000-0000-0000-0000-000000000002';
    await db.exec(`INSERT INTO intervention_planning(id,client_name,service_label,technician_name,date_intervention,statut) VALUES ('${id}','Client libre','Dépannage','Tech','2026-10-23 09:00Z','prevue'); DELETE FROM intervention_planning WHERE id='${id}'`);
    expect(await scalar(`SELECT title AS value FROM notifications WHERE intervention_id='${id}' AND type='intervention_deleted'`)).toBe('[hors contrat] Intervention supprimée');
    expect(await scalar(`SELECT contract_id AS value FROM notifications WHERE intervention_id='${id}' AND type='intervention_deleted'`)).toBeNull();
  });
  it('commercial report returns service labels; other users get no rows', async () => {
    await db.exec(`SET test.user_id='${commercial}';`);
    expect((await scalar(`SELECT get_contract_interventions('${contract}') AS value`) as Array<{resolved_service_label: string}>)[0]?.resolved_service_label).toBe('Maintenance');
    await db.exec(`SET test.user_id='${other}';`);
    expect(await scalar(`SELECT get_contract_interventions('${contract}') AS value`)).toEqual([]);
  });
  it('RLS limits reads and updates to own notifications; only is_read is mutable', async () => {
    await db.exec(`SET ROLE authenticated; SET test.user_id='${commercial}';`);
    expect(await scalar(`SELECT count(*)::int AS value FROM notifications WHERE user_id <> '${commercial}'`)).toBe(0);
    const own = await db.query<{ id: string }>('SELECT id FROM notifications LIMIT 1');
    const id = own.rows[0]?.id;
    expect(id).toBeDefined();
    await db.exec(`UPDATE notifications SET is_read=true WHERE id='${id}'`);
    expect(await scalar(`SELECT is_read AS value FROM notifications WHERE id='${id}'`)).toBe(true);
    await expect(db.exec(`UPDATE notifications SET title='hacked' WHERE id='${id}'`)).rejects.toThrow('only_is_read_can_change');
    await expect(db.exec(`UPDATE notifications SET id=gen_random_uuid() WHERE id='${id}'`)).rejects.toThrow('only_is_read_can_change');
    await expect(db.exec(`INSERT INTO notifications(user_id,type,title) VALUES ('${commercial}','fake','fake')`)).rejects.toThrow();
    await expect(db.exec(`DELETE FROM notifications WHERE id='${id}'`)).rejects.toThrow();
    await expect(db.exec(`SELECT create_notification('${commercial}','fake','fake',NULL,NULL)`)).rejects.toThrow();
    await db.exec('RESET ROLE');
  });
  it('another user cannot mark someone else’s notification read', async () => {
    const id = await scalar(`SELECT id::text AS value FROM notifications WHERE user_id='${commercial}' LIMIT 1`);
    await db.exec(`UPDATE notifications SET is_read=false WHERE id='${id}'; SET ROLE authenticated; SET test.user_id='${other}'`);
    await db.exec(`UPDATE notifications SET is_read=true WHERE id='${id}'`);
    await db.exec('RESET ROLE');
    expect(await scalar(`SELECT is_read AS value FROM notifications WHERE id='${id}'`)).toBe(false);
  });
  it('a contract intervention can omit the optional service', async () => {
    await db.exec(`INSERT INTO intervention_planning(contract_id,technician_name,date_intervention,statut) VALUES ('${contract}','Tech','2026-10-23 09:00Z','prevue')`);
    expect(await scalar(`SELECT count(*)::int AS value FROM notifications WHERE user_id='${commercial}' AND message LIKE '%Prestation non précisée%'`)).toBe(1);
  });
  it('non-owner cannot change the new contract association', async () => {
    await db.exec(`SET test.user_id='${other}'`);
    await expect(db.exec(`UPDATE intervention_planning SET contract_id=NULL WHERE reference_id='${reference}'`)).rejects.toThrow('not_owner_can_only_change_status');
  });
});