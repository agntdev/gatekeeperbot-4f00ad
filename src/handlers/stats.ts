import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getMemberIndex, getMember, getModerationLog } from "../data.js";

const composer = new Composer<Ctx>();

composer.command("stats", async (ctx) => {
  const chatId = String(ctx.chat?.id ?? "");
  if (!chatId) return;

  const stats = await computeStats(chatId);
  await ctx.reply(formatStats(stats), {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

composer.callbackQuery("stats:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = String(ctx.chat?.id ?? "");
  if (!chatId) return;

  const stats = await computeStats(chatId);
  await ctx.editMessageText(formatStats(stats), {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

interface Stats {
  totalMembers: number;
  verified: number;
  trusted: number;
  banned: number;
  warnings: number;
  mutes: number;
  kicks: number;
  bans: number;
}

async function computeStats(chatId: string): Promise<Stats> {
  const memberIds = await getMemberIndex(chatId);
  const stats: Stats = {
    totalMembers: memberIds.length,
    verified: 0,
    trusted: 0,
    banned: 0,
    warnings: 0,
    mutes: 0,
    kicks: 0,
    bans: 0,
  };

  for (const uid of memberIds) {
    const member = await getMember(chatId, uid);
    if (!member) continue;
    if (member.verified) stats.verified++;
    if (member.trusted) stats.trusted++;
    if (member.banned) stats.banned++;
  }

  const log = await getModerationLog(chatId);
  for (const action of log) {
    switch (action.type) {
      case "warn": stats.warnings++; break;
      case "mute": stats.mutes++; break;
      case "kick": stats.kicks++; break;
      case "ban": stats.bans++; break;
    }
  }

  return stats;
}

function formatStats(stats: Stats): string {
  return (
    "📊 Group stats:\n\n" +
    `👥 Total members: ${stats.totalMembers}\n` +
    `✅ Verified: ${stats.verified}\n` +
    `🛡️ Trusted: ${stats.trusted}\n` +
    `🚫 Banned: ${stats.banned}\n\n` +
    "Moderation:\n" +
    `⚠️ Warnings: ${stats.warnings}\n` +
    `🔇 Mutes: ${stats.mutes}\n` +
    `👢 Kicks: ${stats.kicks}\n` +
    `🚫 Bans: ${stats.bans}`
  );
}

export default composer;
