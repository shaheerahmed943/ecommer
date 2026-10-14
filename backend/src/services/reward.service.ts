import { Prisma, PrismaClient } from "@prisma/client";

export const RUPEES_PER_POINT = 10;
export const MAX_REDEMPTION_PERCENT = 20;
const REWARD_SETTINGS_KEY = "rewards";

export interface RewardSettings {
  pointsPerAmount: number;
  amountThreshold: number;
  valuePerPoint: number;
  maxRedemptionPercent: number;
}

export const DEFAULT_REWARD_SETTINGS: RewardSettings = {
  pointsPerAmount: 1,
  amountThreshold: 100,
  valuePerPoint: 10,
  maxRedemptionPercent: 20,
};

function normalizeSettings(value: unknown): RewardSettings {
  const input = value && typeof value === "object" ? value as Partial<RewardSettings> : {};
  const settings = {
    pointsPerAmount: Number(input.pointsPerAmount),
    amountThreshold: Number(input.amountThreshold),
    valuePerPoint: Number(input.valuePerPoint),
    maxRedemptionPercent: Number(input.maxRedemptionPercent),
  };
  return Object.values(settings).every(Number.isFinite) &&
    Number.isInteger(settings.pointsPerAmount) && settings.pointsPerAmount > 0 && settings.amountThreshold > 0 &&
    settings.valuePerPoint > 0 && settings.maxRedemptionPercent >= 0 && settings.maxRedemptionPercent <= 100
    ? settings
    : DEFAULT_REWARD_SETTINGS;
}

export async function getRewardSettings(db: PrismaClient | Prisma.TransactionClient): Promise<RewardSettings> {
  const record = await db.storeSetting.findUnique({ where: { key: REWARD_SETTINGS_KEY } });
  return normalizeSettings(record?.value);
}

export async function saveRewardSettings(db: PrismaClient, input: Partial<RewardSettings>) {
  const settings = normalizeSettings(input);
  return db.storeSetting.upsert({
    where: { key: REWARD_SETTINGS_KEY },
    update: { value: JSON.parse(JSON.stringify(settings)) },
    create: { key: REWARD_SETTINGS_KEY, value: JSON.parse(JSON.stringify(settings)) },
  }).then(() => settings);
}

export function pointsEarnedForSubtotal(subtotal: number, settings: RewardSettings): number {
  return Math.floor(subtotal / settings.amountThreshold) * settings.pointsPerAmount;
}

export function maxRedeemablePoints(subtotal: number, settings: RewardSettings): number {
  return Math.floor((subtotal * (settings.maxRedemptionPercent / 100)) / settings.valuePerPoint);
}

export async function getRewardSummary(db: PrismaClient | Prisma.TransactionClient, userId: string) {
  const account = await db.rewardAccount.findUnique({ where: { userId } });
  const settings = await getRewardSettings(db);
  return {
    balance: account?.balance ?? 0,
    lifetimeEarned: account?.lifetimeEarned ?? 0,
    pointsPerAmount: settings.pointsPerAmount,
    amountThreshold: settings.amountThreshold,
    valuePerPoint: settings.valuePerPoint,
    maxRedemptionPercent: settings.maxRedemptionPercent,
  };
}

export async function creditOrderRewards(
  db: Prisma.TransactionClient,
  userId: string,
  orderId: string,
  subtotal: number,
) {
  const settings = await getRewardSettings(db);
  const points = pointsEarnedForSubtotal(subtotal, settings);
  if (points < 1) return 0;

  const account = await db.rewardAccount.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  const existing = await db.rewardTransaction.findFirst({ where: { accountId: account.id, orderId } });
  if (existing) return 0;

  await db.rewardAccount.update({
    where: { id: account.id },
    data: { balance: { increment: points }, lifetimeEarned: { increment: points } },
  });
  await db.rewardTransaction.create({
    data: { accountId: account.id, points, reason: "Order delivered", orderId },
  });
  return points;
}
