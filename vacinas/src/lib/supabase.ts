import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbcfclgjkngobqkpjmjv.supabase.co';
const supabaseAnonKey = 'sb_publishable_9nFmYUusUdi5_l-A-WDtig_A_LzZNcK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);