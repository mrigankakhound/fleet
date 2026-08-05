/**
 * Telegram Bot notification service.
 * Sends messages via the Telegram Bot API.
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send a Telegram message.
 * @param {object} opts
 * @param {string} opts.botToken  - Telegram Bot API token
 * @param {string} opts.chatId    - Target chat ID (manager's chat)
 * @param {string} opts.text      - Message text (plain text)
 * @param {number} [opts.retries] - Number of retry attempts (default 3)
 */
const sendMessage = async ({ botToken, chatId, text, retries = 3 }) => {
  if (!botToken || !chatId) {
    throw new Error('Telegram credentials not configured (botToken and chatId required).');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.description || `Telegram API error: ${response.status}`
        );
      }

      return { status: 'sent', chatId, messageId: data.result?.message_id };
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await delay(attempt * 2000); // Exponential backoff
        console.warn(`[Telegram] Retry ${attempt}/${retries} for chat ${chatId}`);
      }
    }
  }

  throw lastError;
};

/**
 * Replace template variables in a string.
 * @param {string} template
 * @param {Record<string, string>} vars
 * @returns {string}
 */
const buildMessage = (template, vars) => {
  let msg = template;
  Object.entries(vars).forEach(([key, value]) => {
    msg = msg.replace(new RegExp(`{${key}}`, 'g'), value ?? '');
  });
  return msg;
};

module.exports = { sendMessage, buildMessage };
