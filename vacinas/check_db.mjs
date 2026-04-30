import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mbcfclgjkngobqkpjmjv.supabase.co',
  'sb_publishable_9nFmYUusUdi5_l-A-WDtig_A_LzZNcK'
);

async function main() {
  console.log('Verificando tabelas no banco...\n');
  
  const tables = ['children', 'vaccine_types', 'vaccine_records'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: existe (${data?.length ?? 0} registro(s))`);
    }
  }
}

main().catch(console.error);