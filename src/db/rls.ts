import { sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { db } from './index.ts';
import * as schema from './schema.ts';

export type DbRole = 'public' | 'owner';

export interface DbExecutionContext {
  role: DbRole;
  email?: string;
}

export type ScopedDb = NodePgDatabase<typeof schema>;

/**
 * Executes database operations inside a transaction with PostgreSQL session
 * variables (`app.current_role`, `app.current_user_email`) scoped via `SET LOCAL`
 * so PostgreSQL Row Level Security (RLS) policies enforce read/write isolation.
 */
export async function withDbContext<T>(
  ctx: DbExecutionContext,
  work: (tx: ScopedDb) => Promise<T>,
): Promise<T> {
  try {
    return await db.transaction(async (tx) => {
      const roleValue = ctx.role === 'owner' ? 'owner' : 'public';
      const emailValue = (ctx.email || '').slice(0, 254);

      await tx.execute(
        sql`SELECT set_config('app.current_role', ${roleValue}, true), set_config('app.current_user_email', ${emailValue}, true)`,
      );

      return await work(tx as unknown as ScopedDb);
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'CONFLICT_DETECTED' ||
        error.message === 'NOT_FOUND' ||
        error.message === 'UNAUTHORIZED')
    ) {
      throw error;
    }
    console.error('Database transaction failed:', error);
    throw new Error('Database operation failed.', { cause: error });
  }
}
