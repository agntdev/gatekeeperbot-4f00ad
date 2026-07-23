import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { now } from "../types.js";
import { getMember, setMember, addModerationAction } from "../data.js";

const composer = new Composer<Ctx>();

composer.command("warn", async (ctx) => {
  const chatId = String(ctx.chat?.id ?? "");
  const actorId = String(ctx.from?.id ?? "");
  if (!chatId || !actorId || !ctx.message) return;

  const args = ctx.message.text.split(/\s+/).slice(1);
  if (args.length < 1) {
    await ctx.reply("Usage: /warn @username [reason]", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const targetUsername = args[0].replace("@", "");
  const reason = args.slice(1).join(" ") || "No reason provided";

  const member = await getMember(chatId, targetUsername);
  if (!member) {
    await ctx.reply(`Couldn't find @${targetUsername} in this group.`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  member.warningCount += 1;
  await setMember(member);

  await addModerationAction({
    id: `${chatId}:${now()}`,
    chatId,
    type: "warn",
    targetUserId: member.userId,
    targetUsername,
    actorUserId: actorId,
    actorUsername: ctx.from?.username,
    reason,
    timestamp: now(),
  });

  await ctx.reply(`⚠️ @${targetUsername} has been warned. Reason: ${reason}`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
