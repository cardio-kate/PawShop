import 'server-only';
import { eq } from 'drizzle-orm';
import { dbHttp } from '@/lib/db';
import { admin } from '@/lib/db/schema';

// Единственный админ по конструкции — но session verification всё равно идёт по id из JWT, не по
// "первой строке", чтобы requireAdminSession() не завязывался на это допущение сильнее, чем нужно.
export async function getAdminSessionVersion(id: number): Promise<number | null> {
  const [row] = await dbHttp
    .select({ sessionVersion: admin.sessionVersion })
    .from(admin)
    .where(eq(admin.id, id))
    .limit(1);
  return row?.sessionVersion ?? null;
}
