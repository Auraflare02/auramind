import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

let _adminClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  let url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  // If credentials are placeholder or offline, provide instant mock to prevent 7s DNS timeouts
  if (
    !url ||
    !url.startsWith("http") ||
    url.includes("placeholder-project") ||
    !serviceKey ||
    serviceKey.includes("SENSITIVE")
  ) {
    const createChain = (data: any = []): any => {
      const chain: any = {
        select: () => chain,
        order: () => chain,
        limit: () => chain,
        in: () => chain,
        eq: () => chain,
        neq: () => chain,
        gt: () => chain,
        lt: () => chain,
        or: () => chain,
        ilike: () => chain,
        insert: () => chain,
        upsert: () => chain,
        update: () => chain,
        delete: () => chain,
        maybeSingle: async () => ({ data: null, error: null }),
        single: async () => ({ data: null, error: null }),
        then: (resolve: any) => Promise.resolve({ data, error: null }).then(resolve),
      };
      return chain;
    };

    return {
      from: () => createChain([]),
      auth: {
        admin: {
          listUsers: async () => ({ data: { users: [] }, error: null }),
          getUserById: async (id: string) => ({ data: { user: null }, error: null }),
          updateUserById: async (id: string, attributes: any) => ({ data: { user: { id, ...attributes } }, error: null }),
          createUser: async (attributes: any) => ({
            data: {
              user: {
                id: `mock-user-${Date.now()}`,
                email: attributes.email,
                user_metadata: attributes.user_metadata || {},
                created_at: new Date().toISOString(),
              },
            },
            error: null,
          }),
        },
      },
    } as any;
  }

  if (!_adminClient) {
    _adminClient = createSupabaseClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return _adminClient;
}
