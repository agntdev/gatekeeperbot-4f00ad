import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, mainMenuKeyboard, inlineButton, inlineKeyboard } from "../toolkit/index.js";

registerMainMenuItem({ label: "🔍 Verify", data: "verify:start", order: 10 });
registerMainMenuItem({ label: "🛡️ Spam", data: "spam:status", order: 30 });
registerMainMenuItem({ label: "📋 Log", data: "log:show", order: 40 });
registerMainMenuItem({ label: "📊 Stats", data: "stats:show", order: 50 });
registerMainMenuItem({ label: "⚙️ Settings", data: "settings:show", order: 60 });

const composer = new Composer<Ctx>();

const WELCOME = "👋 Welcome! Tap a button below to get started.";

composer.command("start", async (ctx) => {
  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
