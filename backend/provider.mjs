import { createClient } from '@supabase/supabase-js';

export function createAuthProvider(config) {
  // New client per operation: no shared logged-in user and no browser token storage.
  const client = () => createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(10000) }) }
  });
  return {
    signup: credentials => client().auth.signUp({ ...credentials,
      options: { emailRedirectTo: `${config.origin}/` } }),
    login: credentials => client().auth.signInWithPassword(credentials),
    getUser: token => client().auth.getUser(token),
    refresh: token => client().auth.refreshSession({ refresh_token: token }),
    async logout(tokens) {
      const auth = client().auth;
      const { error } = await auth.setSession(tokens);
      if (error) return { error };
      return auth.signOut({ scope: 'local' });
    },
    async confirm(tokenHash) {
      const auth = client().auth;
      const result = await auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
      // Confirm the email only. A GET email link never signs a visitor into an account.
      if (!result.error && result.data.session) await auth.signOut({ scope: 'local' });
      return { error: result.error };
    }
  };
}
