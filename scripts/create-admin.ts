import { config } from 'dotenv';
config({ path: '.env.local' });

const MIN_PASSWORD_LENGTH = 8;

// Разовый интерактивный запуск (npm run create-admin) после первого деплоя/миграции
// (architecture.md §3.4, п.5) — публичной регистрации нет по ТЗ, единственная запись Admin
// появляется только здесь.
//
// lib/auth.ts и admin.queries.ts (через lib/db/index.ts) читают DATABASE_URL/JWT_SECRET на уровне
// модуля — статический import хостится ВЫШЕ config() из dotenv, даже если текстуально написан
// позже (тот же эффект, что уже ловили в tests/unit/auth.test.ts). Поэтому оба импортируются
// динамически внутри main(), после того как config() гарантированно отработал.

type LineSource = AsyncIterator<string>;

// Общий читатель строк для обоих вопросов (username и password при непустом pipe/CI — см.
// promptHidden ниже). Через readline.question() дважды подряд пайпнутый (не интерактивный) ввод
// теряет вторую строку: если весь ввод пришёл одним чанком и поток сразу закрылся, второй
// question() подвешивается навсегда без ошибки — Node просто завершает процесс, когда в event loop
// больше ничего не осталось (проверено на практике, не по памяти). for-await по интерфейсу читает
// все буферизованные строки независимо от того, когда закрылся поток — этой проблемы не имеет.
async function createLineSource(): Promise<LineSource> {
  const { createInterface } = await import('node:readline/promises');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return rl[Symbol.asyncIterator]();
}

async function readLine(source: LineSource, question: string): Promise<string> {
  process.stdout.write(question);
  const { value, done } = await source.next();
  return done ? '' : value.trim();
}

// Пароль не должен эхоситься в терминал/scrollback — единственный админ-креды системы. Стандартный
// vanilla-Node приём через raw mode, без внешней зависимости ради одного разового скрипта. Не
// связан с LineSource выше — читает stdin напрямую посимвольно, только когда это настоящий TTY.
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdout.write(question);
    stdin.resume();
    stdin.setRawMode!(true);
    stdin.setEncoding('utf8');

    let input = '';
    const onData = (char: string) => {
      switch (char) {
        case '\n':
        case '\r':
        case '': // Ctrl+D
          stdin.setRawMode!(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(input);
          return;
        case '': // Ctrl+C
          stdout.write('\n');
          process.exit(1);
          return;
        case '': // Backspace
          input = input.slice(0, -1);
          return;
        default:
          input += char;
      }
    };
    stdin.on('data', onData);
  });
}

async function main(): Promise<void> {
  const { hashPassword } = await import('@/lib/auth');
  const { countAdmins, createAdmin } = await import('@/lib/db/queries/admin.queries');

  // Единственный админ по конструкции (CLAUDE.md → «Auth и сессии») — отказ при попытке создать
  // вторую запись, не полагаться на то, что скрипт просто не запустят дважды.
  const existingCount = await countAdmins();
  if (existingCount > 0) {
    console.error(
      `scripts/create-admin.ts: an Admin already exists (${existingCount} row(s)). Only one admin ` +
        'is supported by design — refusing to create a second one.',
    );
    process.exitCode = 1;
    return;
  }

  const lineSource = await createLineSource();
  const username = await readLine(lineSource, 'Username: ');
  if (!username) {
    console.error('scripts/create-admin.ts: username is required.');
    process.exitCode = 1;
    return;
  }

  const canMaskInput = process.stdin.isTTY && typeof process.stdin.setRawMode === 'function';
  const password = canMaskInput
    ? await promptHidden('Password: ')
    : await readLine(lineSource, 'Password: ');
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(
      `scripts/create-admin.ts: password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);
  await createAdmin({ username, passwordHash });

  console.log(`scripts/create-admin.ts: created admin "${username}".`);
  console.log(
    'Reminder: Admin.telegramChatId is still NULL — have the admin message the bot once, then ' +
      'set it via getUpdates (architecture.md §3.4, п.5) before password reset / order ' +
      'notifications will work.',
  );
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error('scripts/create-admin.ts: failed', error);
    process.exit(1);
  });
