import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { now } from "../types.js";
import { getMember, setMember, getGroupSettings, addModerationAction } from "../data.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("spam:status", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = String(ctx.chat?.id ?? "");
  const userId = String(ctx.from?.id ?? "");
  if (!chatId || !userId) return;

  const member = await getMember(chatId, userId);
  const settings = await getGroupSettings(chatId);

  const status = member
    ? `Spam score: ${member.spamScore}\nWarnings: ${member.warningCount}\nStatus: ${member.banned ? "Banned" : member.mutedUntil && member.mutedUntil > now() ? "Muted" : "Active"}`
    : "No data yet.";

  await ctx.editMessageText(
    `🛡️ Spam protection status:\n\n${status}\n\n` +
    `Thresholds:\n` +
    `• Flood: ${settings.spamThresholdFlood} messages in 10s\n` +
    `• Repeat: ${settings.spamThresholdRepeat} identical messages\n` +
    `• New account: ${settings.spamThresholdNewAccount}s since join`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
  );
});

composer.on("message:text", async (ctx, next) => {
  if (!ctx.message) return next();
  const text = ctx.message.text;
  if (text.startsWith("/")) return next();

  const chatId = String(ctx.chat?.id ?? "");
  const userId = String(ctx.from?.id ?? "");
  if (!chatId || !userId) return next();

  const member = await getMember(chatId, userId);
  if (!member) {
    await setMember({
      id: `${chatId}:${userId}`,
      chatId,
      userId,
      username: ctx.from?.username,
      joinTime: now(),
      trusted: false,
      verified: false,
      warningCount: 0,
      banned: false,
      spamScore: 0,
      lastMessageTime: 0,
      messageCount: 0,
      messageTimestamps: [],
    });
    return next();
  }

  if (member.trusted || member.banned) return next();

  const currentTime = now();

  member.messageCount++;
  member.lastMessageTime = currentTime;

  member.messageTimestamps.push(currentTime);
  member.messageTimestamps = member.messageTimestamps.filter((t) => currentTime - t < 10000);

  const settings = await getGroupSettings(chatId);

  if (member.messageTimestamps.length >= settings.spamThresholdFlood) {
    await handleSpamEscalation(ctx, chatId, userId, member, "Flood detected: too many messages in a short time", settings);
    return next();
  }

  const recentMessages = member.messageTimestamps.filter((t) => currentTime - t < 60000);
  if (recentMessages.length >= settings.spamThresholdRepeat) {
    await handleSpamEscalation(ctx, chatId, userId, member, "Repeat spam: too many messages in 60 seconds", settings);
    return next();
  }

  await setMember(member);
  return next();
});

async function handleSpamEscalation(
  ctx: Ctx,
  chatId: string,
  userId: string,
  member: { warningCount: number; banned: boolean; mutedUntil?: number; spamScore: number; trusted: boolean; verified: boolean; id: string; chatId: string; userId: string; joinTime: number; lastMessageTime: number; messageCount: number; messageTimestamps: number[]; username?: string },
  reason: string,
  settings: { escalationPath: string[]; spamThresholdNewAccount: number },
): Promise<void> {
  member.spamScore++;

  await addModerationAction({
    id: `${chatId}:${now()}`,
    chatId,
    type: "spam",
    targetUserId: userId,
    targetUsername: member.username,
    actorUserId: "system",
    reason,
    timestamp: now(),
  });

  const escalationIndex = Math.min(member.spamScore - 1, settings.escalationPath.length - 1);
  const action = settings.escalationPath[escalationIndex] ?? "warn";

  switch (action) {
    case "warn":
      member.warningCount++;
      await ctx.reply(`⚠️ @${member.username ?? "user"}: ${reason}. Warning issued.`);
      break;
    case "mute":
      member.mutedUntil = now() + 3600000;
      await ctx.reply(`🔇 @${member.username ?? "user"}: ${reason}. Muted for 1 hour.`);
      try {
        if (ctx.chat) {
          await ctx.api.restrictChatMember(ctx.chat.id, Number(userId), {
            can_send_messages: false,
          });
        }
      } catch {
        // Bot may not have permission
      }
      break;
    case "kick":
      member.banned = true;
      await ctx.reply(`👢 @${member.username ?? "user"}: ${reason}. Kicked.`);
      try {
        if (ctx.chat) {
          await ctx.api.banChatMember(ctx.chat.id, Number(userId));
          await ctx.api.unbanChatMember(ctx.chat.id, Number(userId));
        }
      } catch {
        // Bot may not have permission
      }
      break;
    case "ban":
      member.banned = true;
      await ctx.reply(`🚫 @${member.username ?? "user"}: ${reason}. Banned.`);
      try {
        if (ctx.chat) {
          await ctx.api.banChatMember(ctx.chat.id, Number(userId));
        }
      } catch {
        // Bot may not have permission
      }
      break;
  }

  await setMember(member);
}

export default composer;
