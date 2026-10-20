import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Validates Supabase JWT from Authorization header and returns the authenticated Supabase user.
 */
export async function getAuthUser(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    return user;
  } catch (err) {
    console.error('[getAuthUser error]', err);
    return null;
  }
}
