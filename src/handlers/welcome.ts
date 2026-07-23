import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { now } from "../types.js";
import { getGroupSettings, setMember, getMember } from "../data.js";

const composer = new Composer<Ctx>();

composer.on("message:new_chat_members", async (ctx) => {
  const chatId = String(ctx.chat?.id ?? "");
  if (!chatId) return;

  const settings = await getGroupSettings(chatId);

  for (const newMember of ctx.message.new_chat_members) {
    if (newMember.is_bot) continue;

    const userId = String(newMember.id);
    const username = newMember.username;

    const existing = await getMember(chatId, userId);
    if (existing?.trusted) continue;

    await setMember({
      id: `${chatId}:${userId}`,
      chatId,
      userId,
      username,
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

    const welcomeText = settings.welcomeText.replace("{username}", username ? `@${username}` : "there");
    const rulesText = settings.rulesText;

    const verifyKeyboard = inlineKeyboard([
      [inlineButton("🔍 Verify", "verify:start")],
    ]);

    await ctx.reply(
      `${welcomeText}\n\n📜 Rules:\n${rulesText}\n\nTap Verify to prove you're human.`,
      { reply_markup: verifyKeyboard },
    );
  }
});

export default composer;
