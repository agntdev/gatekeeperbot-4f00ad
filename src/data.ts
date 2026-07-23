import { getStorage } from "./storage.js";
import type {
  MemberRecord,
  GroupSettings,
  ModerationAction,
  VerificationChallenge,
} from "./types.js";
import { DEFAULT_GROUP_SETTINGS } from "./types.js";

const storage = getStorage();

export async function getMember(chatId: string, userId: string): Promise<MemberRecord | null> {
  const s = await storage;
  const key = `member:${chatId}:${userId}`;
  return (await s.get(key)) as MemberRecord | undefined ?? null;
}

export async function setMember(member: MemberRecord): Promise<void> {
  const s = await storage;
  await s.set(`member:${member.chatId}:${member.userId}`, member as unknown as Record<string, unknown>);
}

export async function getGroupSettings(chatId: string): Promise<GroupSettings> {
  const s = await storage;
  const key = `group:${chatId}:settings`;
  const existing = await s.get(key);
  if (existing) return existing as unknown as GroupSettings;
  const defaults: GroupSettings = { chatId, ...DEFAULT_GROUP_SETTINGS };
  await s.set(key, defaults as unknown as Record<string, unknown>);
  return defaults;
}

export async function setGroupSettings(settings: GroupSettings): Promise<void> {
  const s = await storage;
  await s.set(`group:${settings.chatId}:settings`, settings as unknown as Record<string, unknown>);
}

export async function addModerationAction(action: ModerationAction): Promise<void> {
  const s = await storage;
  const key = `log:${action.chatId}`;
  const existing = (await s.get(key)) as unknown as ModerationAction[] | undefined;
  const log = existing ?? [];
  log.push(action);
  if (log.length > 500) log.splice(0, log.length - 500);
  await s.set(key, log as unknown as Record<string, unknown>);
}

export async function getModerationLog(chatId: string): Promise<ModerationAction[]> {
  const s = await storage;
  const key = `log:${chatId}`;
  return ((await s.get(key)) as unknown as ModerationAction[]) ?? [];
}

export async function setVerificationChallenge(challenge: VerificationChallenge): Promise<void> {
  const s = await storage;
  const key = `verify:${challenge.chatId}:${challenge.userId}`;
  await s.set(key, challenge as unknown as Record<string, unknown>);
}

export async function getVerificationChallenge(
  chatId: string,
  userId: string,
): Promise<VerificationChallenge | null> {
  const s = await storage;
  const key = `verify:${chatId}:${userId}`;
  return (await s.get(key)) as VerificationChallenge | undefined ?? null;
}

export async function deleteVerificationChallenge(chatId: string, userId: string): Promise<void> {
  const s = await storage;
  await s.delete(`verify:${chatId}:${userId}`);
}

export async function getMemberIndex(chatId: string): Promise<string[]> {
  const s = await storage;
  const key = `group:${chatId}:members`;
  return ((await s.get(key)) as unknown as string[]) ?? [];
}

export async function addMemberToIndex(chatId: string, userId: string): Promise<void> {
  const s = await storage;
  const key = `group:${chatId}:members`;
  const existing = ((await s.get(key)) as unknown as string[]) ?? [];
  if (!existing.includes(userId)) {
    existing.push(userId);
    await s.set(key, existing as unknown as Record<string, unknown>);
  }
}
