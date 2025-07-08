let createClient;
let supabase;

try {
  ({ createClient } = require('@supabase/supabase-js'));
  if (process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY) {
    supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
  } else {
    supabase = null;
  }
} catch (error) {
  console.warn('Supabase client not available:', error);
  supabase = null;
}

if (!supabase) {
  const noop = () => ({ on: () => ({ subscribe: () => ({ unsubscribe(){} }) }) });
  supabase = {
    channel: noop,
    removeChannel: () => {},
    removeAllChannels: () => {},
    isMockClient: true,
  };
}

export { supabase };
