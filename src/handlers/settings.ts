import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getGroupSettings } from "../data.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("settings:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = String(ctx.chat?.id ?? "");
  if (!chatId) return;

  const settings = await getGroupSettings(chatId);

  const settingsKeyboard = inlineKeyboard([
    [inlineButton("✏️ Welcome", "settings:welcome")],
    [inlineButton("📜 Rules", "settings:rules")],
    [inlineButton("⏱️ Timeout", "settings:timeout")],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);

  await ctx.editMessageText(
    "⚙️ Group settings:\n\n" +
    `Welcome: ${settings.welcomeText.slice(0, 50)}${settings.welcomeText.length > 50 ? "…" : ""}\n` +
    `Rules: ${settings.rulesText.slice(0, 50)}${settings.rulesText.length > 50 ? "…" : ""}\n` +
    `Verification timeout: ${settings.verificationTimeout}s\n` +
    `Max retries: ${settings.verificationRetries}\n` +
    `Flood threshold: ${settings.spamThresholdFlood} msgs/10s\n` +
    `Trusted users: ${settings.trustedUsers.length}`,
    { reply_markup: settingsKeyboard },
  );
});

export default composer;
