const { createClient } = require('@supabase/supabase-js');

// Load credentials
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Optionally, test connectivity
(async () => {
  try {
    const { error } = await supabase.from('users').select('*').limit(1);
    if (error) {
      console.error('[Supabase]  Failed test query:', error.message);
    } else {
      console.log('[Supabase]  Test query succeeded.');
    }
  } catch (err) {
    console.error('[Supabase]  Exception during test query:', err.message);
  }
})();

module.exports = { supabase };
