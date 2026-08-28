// Только для проекта "integration" (см. jest.integration.config.js) — грузит .env.test
// (гитигнорится, по аналогии с .env.local). Юнит-тесты этот файл не подключают вообще, поэтому
// .env.test/подключение к БД не может просочиться в unit-прогон (docs/architecture.md §7.1).
//
// Порядок важен: .env.local грузится первым, чтобы прод-значения DATABASE_URL/DATABASE_URL_UNPOOLED
// были прочитаны до .env.test — dotenv по умолчанию не перезаписывает уже установленные переменные,
// так что вызов ниже не даёт .env.test случайно затереть их раньше, чем они сохранены под *_PROD_*
// ниже.
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env.test' });

if (!process.env.DATABASE_URL_TEST || !process.env.DATABASE_URL_TEST_UNPOOLED) {
  throw new Error(
    'tests/helpers/setup-integration.ts: DATABASE_URL_TEST/DATABASE_URL_TEST_UNPOOLED is not set. ' +
      'See .env.test / docs/architecture.md §7.1.',
  );
}

// lib/db/index.ts строит dbHttp/dbPool ровно один раз, при первом импорте, читая
// process.env.DATABASE_URL/DATABASE_URL_UNPOOLED напрямую — у него нет параметра "какую БД
// использовать". Чтобы реальные queries/services/actions в integration-тестах ходили в тестовую
// ветку, а не в прод, эти переменные подменяются здесь, в setupFiles — гарантированно раньше, чем
// любой тестовый файл (и транзитивно lib/db/index.ts) успеет импортироваться.
//
// Оригинальные прод-значения сохраняются под *_PROD_FOR_GUARD — guard в tests/helpers/reset-db.ts
// сверяется именно с ними, а не с уже подменённым DATABASE_URL: сверка с самим собой после подмены
// была бы тавтологией (всегда "совпадает") и не отличала бы реальную ошибку конфигурации от
// нормального состояния после этой подмены.
process.env.DATABASE_URL_PROD_FOR_GUARD = process.env.DATABASE_URL;
process.env.DATABASE_URL_UNPOOLED_PROD_FOR_GUARD = process.env.DATABASE_URL_UNPOOLED;
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL_TEST_UNPOOLED;
