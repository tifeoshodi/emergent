import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks to prevent errors when not set
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
// Add error handling for Supabase client creation
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a comprehensive mock client with dummy methods to prevent app crashes
  
  const createMockQueryBuilder = () => ({
    select: (columns = '*') => createMockQueryBuilder(),
    insert: (data) => ({ 
      execute: async () => ({ 
        data: Array.isArray(data) ? data : [data], 
        error: null 
      })
    }),
    update: (data) => ({ 
      execute: async () => ({ 
        data: [data], 
        error: null 
      }),
      match: () => createMockQueryBuilder(),
      eq: () => createMockQueryBuilder()
    }),
    delete: () => ({ 
      execute: async () => ({ 
        data: [], 
        error: null 
      }),
      match: () => createMockQueryBuilder(),
      eq: () => createMockQueryBuilder()
    }),
    upsert: (data) => ({ 
      execute: async () => ({ 
        data: Array.isArray(data) ? data : [data], 
        error: null 
      })
    }),
    eq: (column, value) => createMockQueryBuilder(),
    neq: (column, value) => createMockQueryBuilder(),
    gt: (column, value) => createMockQueryBuilder(),
    gte: (column, value) => createMockQueryBuilder(),
    lt: (column, value) => createMockQueryBuilder(),
    lte: (column, value) => createMockQueryBuilder(),
    like: (column, value) => createMockQueryBuilder(),
    ilike: (column, value) => createMockQueryBuilder(),
    is: (column, value) => createMockQueryBuilder(),
    in: (column, values) => createMockQueryBuilder(),
    contains: (column, value) => createMockQueryBuilder(),
    containedBy: (column, value) => createMockQueryBuilder(),
    rangeGt: (column, value) => createMockQueryBuilder(),
    rangeGte: (column, value) => createMockQueryBuilder(),
    rangeLt: (column, value) => createMockQueryBuilder(),
    rangeLte: (column, value) => createMockQueryBuilder(),
    rangeAdjacent: (column, value) => createMockQueryBuilder(),
    overlaps: (column, value) => createMockQueryBuilder(),
    textSearch: (column, query) => createMockQueryBuilder(),
    match: (query) => createMockQueryBuilder(),
    not: (column, operator, value) => createMockQueryBuilder(),
    or: (filters) => createMockQueryBuilder(),
    filter: (column, operator, value) => createMockQueryBuilder(),
    order: (column, options) => createMockQueryBuilder(),
    limit: (count) => createMockQueryBuilder(),
    range: (from, to) => createMockQueryBuilder(),
    single: () => ({ 
      execute: async () => ({ 
        data: null, 
        error: null 
      })
    }),
    maybeSingle: () => ({ 
      execute: async () => ({ 
        data: null, 
        error: null 
      })
    }),
    csv: () => ({ 
      execute: async () => ({ 
        data: '', 
        error: null 
      })
    }),
    execute: async () => ({ 
      data: [], 
      error: null 
    })
  });

  supabase = {
    // Auth methods
    auth: {
      getSession: async () => ({ 
        data: { session: null }, 
        error: null 
      }),
      getUser: async () => ({ 
        data: { user: null }, 
        error: null 
      }),
      signUp: async (credentials) => ({ 
        data: { 
          user: null, 
          session: null 
        }, 
        error: { message: 'Mock client: Supabase not initialized' }
      }),
      signInWithPassword: async (credentials) => ({ 
        data: { 
          user: null, 
          session: null 
        }, 
        error: { message: 'Mock client: Supabase not initialized' }
      }),
      signInWithOAuth: async (provider) => ({ 
        data: { 
          provider: provider,
          url: null 
        }, 
        error: { message: 'Mock client: Supabase not initialized' }
      }),
      signInWithOtp: async (credentials) => ({ 
        data: {}, 
        error: { message: 'Mock client: Supabase not initialized' }
      }),
      signOut: async () => ({ 
        error: null 
      }),
      resetPasswordForEmail: async (email) => ({ 
        data: {}, 
        error: null 
      }),
      updateUser: async (attributes) => ({ 
        data: { user: null }, 
        error: { message: 'Mock client: Supabase not initialized' }
      }),
      setSession: async (tokens) => ({ 
        data: { session: null }, 
        error: null 
      }),
      refreshSession: async () => ({ 
        data: { session: null }, 
        error: null 
      }),
      onAuthStateChange: (callback) => {
        console.warn('Mock client: Auth state change listener not functional');
        return { 
          data: { 
            subscription: {
              unsubscribe: () => {
                console.log('Mock auth subscription unsubscribed');
              }
            }
          }, 
          error: null 
        };
      }
    },
    
    // Database methods
    from: (table) => createMockQueryBuilder(),
    
    // Storage methods
    storage: {
      from: (bucket) => ({
        upload: async (path, file) => ({ 
          data: { path: path }, 
          error: { message: 'Mock client: Storage not available' }
        }),
        download: async (path) => ({ 
          data: null, 
          error: { message: 'Mock client: Storage not available' }
        }),
        remove: async (paths) => ({ 
          data: [], 
          error: { message: 'Mock client: Storage not available' }
        }),
        list: async (path) => ({ 
          data: [], 
          error: { message: 'Mock client: Storage not available' }
        }),
        createSignedUrl: async (path, expiresIn) => ({ 
          data: { signedUrl: null }, 
          error: { message: 'Mock client: Storage not available' }
        }),
        createSignedUrls: async (paths, expiresIn) => ({ 
          data: [], 
          error: { message: 'Mock client: Storage not available' }
        }),
        getPublicUrl: (path) => ({ 
          data: { publicUrl: path },
          error: null
        })
      })
    },
    
    // RPC (Remote Procedure Call) methods
    rpc: async (fn, params) => ({ 
      data: null, 
      error: { message: 'Mock client: RPC not available' }
    }),
    
    // Channel methods for real-time subscriptions
    channel: (name) => ({
      on: (event, callback) => ({
        subscribe: () => {
          console.warn('Mock client: Real-time subscriptions not functional');
          return {
            unsubscribe: () => {
              console.log('Mock channel subscription unsubscribed');
            }
          };
        }
      })
    }),
    
    // Remove channels
    removeChannel: (channel) => {
      console.log('Mock client: Channel removed');
    },
    
    // Remove all channels
    removeAllChannels: () => {
      console.log('Mock client: All channels removed');
    },
    
    // Mock client indicator - allows consuming code to detect mock usage
    isMockClient: true
  };
  
  console.warn('Supabase client failed to initialize. Using mock client with limited functionality.');
}

export { supabase };
