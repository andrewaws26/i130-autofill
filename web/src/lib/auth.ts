import { auth, currentUser } from '@clerk/nextjs/server';

export type UserRole = 'admin' | 'attorney' | 'paralegal';

/**
 * Get the current user's role from Clerk metadata.
 * Returns null if not authenticated.
 */
export async function getUserRole(): Promise<UserRole | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  // Role stored in Clerk public metadata
  return (user.publicMetadata?.role as UserRole) || 'attorney';
}

/**
 * Require authentication for an API route.
 * Returns the userId or throws a Response.
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return userId;
}

/**
 * Require a specific role for an API route.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<string> {
  const userId = await requireAuth();
  const role = await getUserRole();

  if (!role || !allowedRoles.includes(role)) {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return userId;
}
