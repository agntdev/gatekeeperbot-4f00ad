import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getGroupSettings, setGroupSettings } from "../data.js";

const composer = new Composer<Ctx>();

composer.command("setpolicy", async (ctx) => {
  const chatId = String(ctx.chat?.id ?? "");
  if (!chatId || !ctx.message) return;

  const args = ctx.message.text.split(/\s+/).slice(1);
  if (args.length < 2) {
    await ctx.reply(
      "Usage: /setpolicy <setting> <value>\n\n" +
      "Settings:\n" +
      "• timeout <seconds> — verification timeout (default: 180)\n" +
      "• retries <count> — max verification attempts (default: 3)\n" +
      "• flood <count> — messages in 10s to trigger flood (default: 5)\n" +
      "• repeat <count> — identical messages to trigger repeat (default: 3)",
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }

  const setting = args[0].toLowerCase();
  const value = parseInt(args[1], 10);

  if (isNaN(value) || value < 1) {
    await ctx.reply("Please provide a valid number for the setting.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const settings = await getGroupSettings(chatId);

  switch (setting) {
    case "timeout":
      settings.verificationTimeout = value;
      break;
    case "retries":
      settings.verificationRetries = value;
      break;
    case "flood":
      settings.spamThresholdFlood = value;
      break;
    case "repeat":
      settings.spamThresholdRepeat = value;
      break;
    default:
      await ctx.reply("Unknown setting. Use: timeout, retries, flood, or repeat.", {
        reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
      });
      return;
  }

  await setGroupSettings(settings);

  await ctx.reply(`✅ Policy updated: ${setting} = ${value}`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
