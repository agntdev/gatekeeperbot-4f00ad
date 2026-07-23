import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { generateMathChallenge, now } from "../types.js";
import {
  getMember,
  setMember,
  setVerificationChallenge,
  getVerificationChallenge,
  deleteVerificationChallenge,
  getGroupSettings,
} from "../data.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("verify:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = String(ctx.chat?.id ?? "");
  const userId = String(ctx.from?.id ?? "");
  if (!chatId || !userId) return;

  const member = await getMember(chatId, userId);
  if (member?.verified) {
    await ctx.reply("✅ You're already verified. Welcome!", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  if (member?.banned) {
    await ctx.reply("🚫 You've been banned from this group.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  if (member?.trusted) {
    await ctx.reply("✅ You're a trusted member. No verification needed.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const settings = await getGroupSettings(chatId);
  const { question, answer } = generateMathChallenge();

  await setVerificationChallenge({
    chatId,
    userId,
    question,
    answer,
    issuedAt: now(),
    attempts: 0,
  });

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
  }

  const verifyKeyboard = inlineKeyboard([
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);

  await ctx.reply(
    `🔢 Solve this to verify: What is ${question}?\n\n` +
    `You have ${settings.verificationRetries} attempts and ${settings.verificationTimeout} seconds.`,
    { reply_markup: verifyKeyboard },
  );
});

composer.on("message:text", async (ctx, next) => {
  const chatId = String(ctx.chat?.id ?? "");
  const userId = String(ctx.from?.id ?? "");
  if (!chatId || !userId) return next();

  const challenge = await getVerificationChallenge(chatId, userId);
  if (!challenge) return next();

  const text = ctx.message.text.trim();
  const answer = parseInt(text, 10);

  if (isNaN(answer)) {
    await ctx.reply("Please type a number as your answer.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const settings = await getGroupSettings(chatId);
  const newAttempts = challenge.attempts + 1;

  if (answer === challenge.answer) {
    await deleteVerificationChallenge(chatId, userId);
    const member = await getMember(chatId, userId);
    if (member) {
      member.verified = true;
      await setMember(member);
    }
    await ctx.reply("✅ Verified! You can now participate in the group.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
  } else if (newAttempts >= settings.verificationRetries) {
    await deleteVerificationChallenge(chatId, userId);
    await ctx.reply(
      "❌ Too many wrong attempts. You've been removed from the group.",
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    try {
      await ctx.api.banChatMember(ctx.chat.id, Number(userId));
      await ctx.api.unbanChatMember(ctx.chat.id, Number(userId));
    } catch {
      // Bot may not have permission
    }
  } else {
    await setVerificationChallenge({
      ...challenge,
      attempts: newAttempts,
    });
    await ctx.reply(
      `❌ Wrong answer. Try again (${settings.verificationRetries - newAttempts} attempts left).`,
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
  }
});

export default composer;
