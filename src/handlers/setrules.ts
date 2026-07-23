import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getGroupSettings, setGroupSettings } from "../data.js";

const composer = new Composer<Ctx>();

composer.command("setrules", async (ctx) => {
  const chatId = String(ctx.chat?.id ?? "");
  if (!chatId || !ctx.message) return;

  const args = ctx.message.text.split(/\s+/).slice(1);
  const text = args.join(" ");

  if (!text) {
    await ctx.reply("Usage: /setrules <rules text>", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const settings = await getGroupSettings(chatId);
  settings.rulesText = text;
  await setGroupSettings(settings);

  await ctx.reply(`✅ Rules updated:\n\n${text}`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
