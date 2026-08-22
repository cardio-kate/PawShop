import { escapeMarkdownV2 } from '@/lib/telegram';

describe('lib/telegram escapeMarkdownV2', () => {
  it('escapes every reserved MarkdownV2 character', () => {
    const input = '_*[]()~`>#+-=|{}.!';
    const escaped = escapeMarkdownV2(input);
    expect(escaped).toBe('\\_\\*\\[\\]\\(\\)\\~\\`\\>\\#\\+\\-\\=\\|\\{\\}\\.\\!');
  });

  it('escapes a realistic German street address with an umlaut and a hyphen', () => {
    // Не синтетическая строка — реальный формат адреса, который Bot API молча отклонит целиком,
    // если "-" не экранирован (architecture.md §3.6, пример из ревизии плана).
    expect(escapeMarkdownV2('Müller-Straße 12')).toBe('Müller\\-Straße 12');
  });

  it('escapes a trailing period in an apartment/comment field', () => {
    expect(escapeMarkdownV2('Apt. 4')).toBe('Apt\\. 4');
  });

  it('leaves plain alphanumeric text with no reserved characters untouched', () => {
    expect(escapeMarkdownV2('Berlin')).toBe('Berlin');
  });

  it('escapes multiple reserved characters within the same word', () => {
    expect(escapeMarkdownV2('order #42 (urgent)!')).toBe('order \\#42 \\(urgent\\)\\!');
  });
});
