import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Accessing environment variables for Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Logging environment variables for debugging
// console.log('SUPABASE_URL:', supabaseUrl);
// console.log('SUPABASE_ANON_KEY:', supabaseKey ? '[REDACTED]' : undefined);

// Validating environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    `Missing Supabase configuration: ${!supabaseUrl ? 'SUPABASE_URL' : ''}${
      !supabaseUrl && !supabaseKey ? ' and ' : ''
    }${!supabaseKey ? 'SUPABASE_ANON_KEY' : ''} not found in environment variables.`
  );
}

// Initializing Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // Disable session persistence for server-side
  },
});
