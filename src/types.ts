export interface MemberRecord {
  id: string;
  chatId: string;
  userId: string;
  username?: string;
  joinTime: number;
  trusted: boolean;
  verified: boolean;
  warningCount: number;
  mutedUntil?: number;
  banned: boolean;
  spamScore: number;
  lastMessageTime: number;
  messageCount: number;
  messageTimestamps: number[];
}

export interface GroupSettings {
  chatId: string;
  welcomeText: string;
  rulesText: string;
  verificationTimeout: number;
  verificationRetries: number;
  spamThresholdNewAccount: number;
  spamThresholdRepeat: number;
  spamThresholdFlood: number;
  escalationPath: string[];
  trustedUsers: string[];
  logRetentionDays: number;
  notificationsToAdminChat: boolean;
}

export interface ModerationAction {
  id: string;
  chatId: string;
  type: "warn" | "mute" | "kick" | "ban" | "trust" | "untrust" | "verify" | "spam";
  targetUserId: string;
  targetUsername?: string;
  actorUserId: string;
  actorUsername?: string;
  reason: string;
  timestamp: number;
  details?: string;
}

export interface VerificationChallenge {
  chatId: string;
  userId: string;
  question: string;
  answer: number;
  issuedAt: number;
  attempts: number;
}

export const DEFAULT_GROUP_SETTINGS: Omit<GroupSettings, "chatId"> = {
  welcomeText: "👋 Welcome to the group! Tap Verify to prove you're human.",
  rulesText: "Be respectful. No spam. No self-promotion.",
  verificationTimeout: 180,
  verificationRetries: 3,
  spamThresholdNewAccount: 172800,
  spamThresholdRepeat: 3,
  spamThresholdFlood: 5,
  escalationPath: ["warn", "mute", "kick", "ban"],
  trustedUsers: [],
  logRetentionDays: 90,
  notificationsToAdminChat: true,
};

export function generateMathChallenge(): { question: string; answer: number } {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const ops = ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let answer: number;
  switch (op) {
    case "+": answer = a + b; break;
    case "-": answer = a - b; break;
    case "×": answer = a * b; break;
    default: answer = a + b;
  }
  return { question: `${a} ${op} ${b}`, answer };
}

export function now(): number {
  return Date.now();
}
