import 'server-only';
import { RESET_TOKEN_TTL_MINUTES } from '@/lib/constants';

// Интеграция строго односторонняя (sendMessage) — входящий webhook для апдейтов от бота проекту
// не нужен и не добавляется (architecture.md §3.6).

const TELEGRAM_API_BASE = 'https://api.telegram.org';

// Полный список зарезервированных символов MarkdownV2 из документации Telegram Bot API —
// экранировать нужно ЛЮБОЕ их вхождение вне намеренной разметки, иначе Bot API отклоняет
// сообщение целиком (не только "плохой" фрагмент), а вызов уже обёрнут в try/catch на уровне
// services и падение проглатывается молча (architecture.md §3.6).
const MARKDOWN_V2_RESERVED_CHARS = /[_*[\]()~`>#+\-=|{}.!]/g;

export function escapeMarkdownV2(text: string): string {
  return text.replace(MARKDOWN_V2_RESERVED_CHARS, '\\$&');
}

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('lib/telegram.ts: TELEGRAM_BOT_TOKEN is not set');
  }

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'MarkdownV2' }),
  });

  if (!response.ok) {
    throw new Error(`lib/telegram.ts: Telegram API responded with status ${response.status}`);
  }
}

// resetToken — hex (crypto.randomBytes(...).toString('hex')), не содержит символов MarkdownV2 —
// безопасно подставляется в code span без экранирования (в code span экранируются только ` и \,
// не остальные зарезервированные символы). Остальной текст сообщения статический, но всё равно
// содержит зарезервированные символы разметки (".", "!") — экранируется явно, а не только
// пользовательский ввод, иначе Bot API откажет и на них.
export async function sendResetCode(chatId: string, resetToken: string): Promise<void> {
  const text = [
    escapeMarkdownV2('PawShop admin password reset'),
    '',
    `Reset code: \`${resetToken}\``,
    escapeMarkdownV2(`This code is valid for ${RESET_TOKEN_TTL_MINUTES} minutes.`),
  ].join('\n');
  await sendTelegramMessage(chatId, text);
}

export interface OrderNotificationItem {
  productNameAtOrder: string;
  variantLabelAtOrder: string;
  quantity: number;
  priceAtOrder: string;
}

export interface OrderNotificationData {
  orderId: number;
  customerName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  countryName: string;
  comment: string | null;
  items: OrderNotificationItem[];
  subtotal: string;
  shippingPrice: string;
  total: string;
}

// tz-pawshop.md §12: товары, сумма товаров, стоимость доставки, итоговая сумма, контакты клиента,
// полный адрес доставки (страна/город/улица/индекс), комментарий (если заполнен). Каждая строка
// экранируется целиком через escapeMarkdownV2, включая статический текст и денежные значения
// (numeric(10,2)-строки содержат ".", зарезервированный символ MarkdownV2) — не только
// пользовательский ввод, тот же принцип, что в sendResetCode выше.
export async function sendOrderNotification(
  chatId: string,
  data: OrderNotificationData,
): Promise<void> {
  const lines = [
    escapeMarkdownV2(`New order #${data.orderId}`),
    '',
    escapeMarkdownV2('Items:'),
    ...data.items.map((item) =>
      escapeMarkdownV2(
        `- ${item.productNameAtOrder} (${item.variantLabelAtOrder}) x${item.quantity} — €${item.priceAtOrder}`,
      ),
    ),
    '',
    escapeMarkdownV2(`Subtotal: €${data.subtotal}`),
    escapeMarkdownV2(`Shipping: €${data.shippingPrice}`),
    escapeMarkdownV2(`Total: €${data.total}`),
    '',
    escapeMarkdownV2('Customer:'),
    escapeMarkdownV2(data.customerName),
    escapeMarkdownV2(data.phone),
    '',
    escapeMarkdownV2('Delivery address:'),
    escapeMarkdownV2(`${data.street}, ${data.city}, ${data.postalCode}, ${data.countryName}`),
  ];

  if (data.comment) {
    lines.push('', escapeMarkdownV2(`Comment: ${data.comment}`));
  }

  await sendTelegramMessage(chatId, lines.join('\n'));
}
