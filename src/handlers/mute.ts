import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { now } from "../types.js";
import { getMember, setMember, addModerationAction } from "../data.js";

const composer = new Composer<Ctx>();

composer.command("mute", async (ctx) => {
  const chatId = String(ctx.chat?.id ?? "");
  const actorId = String(ctx.from?.id ?? "");
  if (!chatId || !actorId || !ctx.message) return;

  const args = ctx.message.text.split(/\s+/).slice(1);
  if (args.length < 2) {
    await ctx.reply("Usage: /mute @username <duration> (e.g. 1h, 30m)", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const targetUsername = args[0].replace("@", "");
  const durationStr = args[1];

  const durationMs = parseDuration(durationStr);
  if (!durationMs) {
    await ctx.reply("Invalid duration. Use formats like 30m, 1h, 24h.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const member = await getMember(chatId, targetUsername);
  if (!member) {
    await ctx.reply(`Couldn't find @${targetUsername} in this group.`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  member.mutedUntil = now() + durationMs;
  await setMember(member);

  await addModerationAction({
    id: `${chatId}:${now()}`,
    chatId,
    type: "mute",
    targetUserId: member.userId,
    targetUsername,
    actorUserId: actorId,
    actorUsername: ctx.from?.username,
    reason: `Muted for ${durationStr}`,
    timestamp: now(),
    details: durationStr,
  });

  try {
    await ctx.api.restrictChatMember(ctx.chat.id, Number(member.userId), {
      can_send_messages: false,
    });
  } catch {
    // Bot may not have permission
  }

  await ctx.reply(`🔇 @${targetUsername} has been muted for ${durationStr}.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

function parseDuration(str: string): number | null {
  const match = str.match(/^(\d+)(m|h|d)$/);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

export default composer;
