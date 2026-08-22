import 'server-only';
import { eq, sql } from 'drizzle-orm';
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

export async function getAdminByUsername(username: string) {
  const [row] = await dbHttp.select().from(admin).where(eq(admin.username, username)).limit(1);
  return row ?? null;
}

export async function getAdminByResetTokenHash(resetTokenHash: string) {
  const [row] = await dbHttp
    .select()
    .from(admin)
    .where(eq(admin.resetTokenHash, resetTokenHash))
    .limit(1);
  return row ?? null;
}

// Атомарный инкремент + условная установка lockedUntil в ОДНОМ UPDATE (не read-then-write в JS —
// см. .claude/plans/backend-realization-pawshop.md, Фаза 0): наивное «прочитать счётчик → сравнить
// → записать» позволяет двум параллельным неудачным попыткам с одного клиента синхронно пройти
// проверку и не увеличить счётчик. Единственный статичный UPDATE атомарен на уровне строки в
// Postgres сам по себе — отдельная транзакция/dbPool не нужны, здесь ровно один связанный запрос.
export async function recordFailedLoginAttempt(
  id: number,
  maxAttempts: number,
  lockoutMinutes: number,
): Promise<{ failedLoginAttempts: number; lockedUntil: Date | null }> {
  const [row] = await dbHttp
    .update(admin)
    .set({
      failedLoginAttempts: sql`${admin.failedLoginAttempts} + 1`,
      lockedUntil: sql`case when ${admin.failedLoginAttempts} + 1 >= ${maxAttempts}
        then now() + make_interval(mins => ${lockoutMinutes})
        else ${admin.lockedUntil} end`,
    })
    .where(eq(admin.id, id))
    .returning({ failedLoginAttempts: admin.failedLoginAttempts, lockedUntil: admin.lockedUntil });
  if (!row) {
    throw new Error(`admin.queries.recordFailedLoginAttempt: no admin with id ${id}`);
  }
  return row;
}

export async function resetFailedLoginAttempts(id: number): Promise<void> {
  await dbHttp
    .update(admin)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(admin.id, id));
}

export async function setResetToken(
  id: number,
  resetTokenHash: string,
  resetTokenExpiresAt: Date,
): Promise<void> {
  await dbHttp.update(admin).set({ resetTokenHash, resetTokenExpiresAt }).where(eq(admin.id, id));
}

// passwordHash + sessionVersion-инкремент + сброс resetToken — один атомарный UPDATE (architecture.md
// §3.4: "в той же транзакции, где обновляется passwordHash" — для одной строки/одного statement это
// гарантировано атомарностью самого UPDATE, отдельный dbPool/BEGIN не нужен).
export async function resetPasswordAndInvalidateSessions(
  id: number,
  passwordHash: string,
): Promise<void> {
  await dbHttp
    .update(admin)
    .set({
      passwordHash,
      sessionVersion: sql`${admin.sessionVersion} + 1`,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    })
    .where(eq(admin.id, id));
}
