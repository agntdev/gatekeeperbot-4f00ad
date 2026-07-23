import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getModerationLog } from "../data.js";

const composer = new Composer<Ctx>();

composer.command("log", async (ctx) => {
  const chatId = String(ctx.chat?.id ?? "");
  if (!chatId) return;

  const log = await getModerationLog(chatId);
  if (log.length === 0) {
    await ctx.reply("📋 No moderation actions yet.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const recent = log.slice(-10).reverse();
  const lines = recent.map((action) => {
    const time = new Date(action.timestamp).toLocaleString();
    return `• ${action.type.toUpperCase()} @${action.targetUsername ?? "unknown"} by @${action.actorUsername ?? "system"} — ${action.reason} (${time})`;
  });

  await ctx.reply(`📋 Recent moderation actions:\n\n${lines.join("\n")}`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

composer.callbackQuery("log:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = String(ctx.chat?.id ?? "");
  if (!chatId) return;

  const log = await getModerationLog(chatId);
  if (log.length === 0) {
    await ctx.editMessageText("📋 No moderation actions yet.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const recent = log.slice(-10).reverse();
  const lines = recent.map((action) => {
    const time = new Date(action.timestamp).toLocaleString();
    return `• ${action.type.toUpperCase()} @${action.targetUsername ?? "unknown"} by @${action.actorUsername ?? "system"} — ${action.reason} (${time})`;
  });

  await ctx.editMessageText(`📋 Recent moderation actions:\n\n${lines.join("\n")}`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
