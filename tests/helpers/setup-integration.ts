// Только для проекта "integration" (см. jest.integration.config.js) — грузит .env.test
// (гитигнорится, по аналогии с .env.local). Юнит-тесты этот файл не подключают вообще, поэтому
// .env.test/подключение к БД не может просочиться в unit-прогон (docs/architecture.md §7.1).
//
// Порядок важен: .env.local грузится первым, чтобы DATABASE_URL/DATABASE_URL_UNPOOLED были в
// process.env к моменту guard-проверки в tests/helpers/reset-db.ts — без них сравнение
// DATABASE_URL_TEST === DATABASE_URL не с чем делать, и защита от TRUNCATE прод-базы молча не
// сработает. dotenv по умолчанию не перезаписывает уже установленные переменные, так что порядок
// вызовов ниже не даёт .env.test случайно затереть значения из .env.local.
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env.test' });
