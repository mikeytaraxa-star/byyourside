// @vitest-environment node
import {describe,it,expect} from 'vitest';
import postgres from 'postgres';
const connection=process.env['SUPABASE_DB_URL'];
describe.skipIf(!connection)('isolated live database security rules',()=>{
  async function fixture(run:(sql:ReturnType<typeof postgres>)=>Promise<void>){
    if(!connection)throw new Error('Database test connection missing');
    const sql=postgres(connection,{max:1});
    try{await run(sql);}finally{await sql.end();}
  }
  it('installs enabled credential revocation enforcement on family membership updates',async()=>fixture(async(sql)=>{
    const rows=await sql`SELECT t.tgenabled FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='care_members' AND t.tgname='care_revoke_credentials'`;
    expect(rows).toHaveLength(1);expect(rows[0]?.['tgenabled']).toBe('O');
  }));
  it('restricts transactional care operations to verified server access',async()=>fixture(async(sql)=>{
    const rows=await sql`SELECT proname,has_function_privilege('anon',p.oid,'EXECUTE') AS anon,has_function_privilege('authenticated',p.oid,'EXECUTE') AS signed_in,has_function_privilege('service_role',p.oid,'EXECUTE') AS service FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname IN ('care_edit_entity','care_undo_entity','care_begin_erase')`;
    expect(rows).toHaveLength(3);for(const row of rows){expect(row['anon']).toBe(false);expect(row['signed_in']).toBe(false);expect(row['service']).toBe(true);}
  }));
  it('denies anonymous and general signed-in direct access to all private care tables',async()=>fixture(async(sql)=>{
    const rows=await sql`SELECT tablename,has_table_privilege('anon',format('public.%I',tablename),'SELECT') AS anon,has_table_privilege('authenticated',format('public.%I',tablename),'SELECT') AS signed_in FROM pg_tables WHERE schemaname='public'`;
    expect(rows).toHaveLength(15);
    for(const row of rows){expect(row['anon']).toBe(false);expect(row['signed_in']).toBe(false);}
  }));
});