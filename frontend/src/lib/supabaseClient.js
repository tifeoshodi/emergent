import { createClient } from '@supabase/supabase-js';

let supabase;

try {
  if (process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY) {
    supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
  } else {
    supabase = null;
  }
} catch (error) {
  console.warn('Failed to initialize Supabase client:', error);
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
