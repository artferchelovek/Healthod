import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getAchievements = async (_req: Request, res: Response) => {
  try {
    const achievements = await prisma.achievement.findMany();
    return res.json(achievements);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyAchievements = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: req.user.userId },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
    });

    return res.json(userAchievements);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const seedAchievements = async (_req: Request, res: Response) => {
  try {
    const achievements = [
      { title: "First Post", description: "Create your first post", icon: "📝" },
      { title: "Social Butterfly", description: "Create 10 posts", icon: "🦋" },
      { title: "First Workout", description: "Complete your first workout", icon: "💪" },
      { title: "Athlete", description: "Complete 10 workouts", icon: "🏆" },
      { title: "Calorie Crusher", description: "Burn 1000 total calories", icon: "🔥" },
      { title: "First Comment", description: "Leave your first comment", icon: "💬" },
      { title: "Food Tracker", description: "Log your first meal", icon: "🍎" },
      { title: "Nutritionist", description: "Log 50 meals", icon: "🥗" },
      { title: "Mood Tracker", description: "Log your first mood", icon: "😊" },
      { title: "Self-Aware", description: "Log mood 7 days in a row", icon: "🧠" },
      { title: "Follower", description: "Follow your first user", icon: "👥" },
      { title: "Popular", description: "Get 10 likes on a post", icon: "⭐" },
      { title: "Community Builder", description: "Create a community", icon: "🏛️" },
      { title: "Chatter", description: "Send your first message", icon: "✉️" },
    ];

    for (const achievement of achievements) {
      await prisma.achievement.upsert({
        where: { id: achievement.title },
        create: { id: achievement.title, ...achievement },
        update: achievement,
      });
    }

    const all = await prisma.achievement.findMany();
    return res.json({ message: "Achievements seeded", count: all.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export async function checkAndUnlockAchievements(userId: string): Promise<void> {
  const [postCount, workoutCount, commentCount, foodLogCount, moodLogs, followingCount, likeCount, communityCount, messageCount] = await Promise.all([
    prisma.post.count({ where: { authorId: userId } }),
    prisma.workout.count({ where: { userId } }),
    prisma.comment.count({ where: { authorId: userId } }),
    prisma.foodLog.count({ where: { userId } }),
    prisma.moodLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.like.count({ where: { userId } }),
    prisma.community.count({ where: { ownerId: userId } }),
    prisma.message.count({ where: { senderId: userId } }),
  ]);

  let totalCalories = 0;
  const workouts = await prisma.workout.findMany({ where: { userId }, select: { totalCalories: true } });
  for (const w of workouts) {
    totalCalories += w.totalCalories || 0;
  }

  let hasPopularPost = false;
  const posts = await prisma.post.findMany({ where: { authorId: userId }, select: { likesCount: true } });
  for (const p of posts) {
    if (p.likesCount >= 10) { hasPopularPost = true; break; }
  }

  const checks: { key: string; condition: boolean }[] = [
    { key: "First Post", condition: postCount >= 1 },
    { key: "Social Butterfly", condition: postCount >= 10 },
    { key: "First Workout", condition: workoutCount >= 1 },
    { key: "Athlete", condition: workoutCount >= 10 },
    { key: "Calorie Crusher", condition: totalCalories >= 1000 },
    { key: "First Comment", condition: commentCount >= 1 },
    { key: "Food Tracker", condition: foodLogCount >= 1 },
    { key: "Nutritionist", condition: foodLogCount >= 50 },
    { key: "Mood Tracker", condition: moodLogs.length >= 1 },
    { key: "Self-Aware", condition: hasConsecutiveDays(moodLogs, 7) },
    { key: "Follower", condition: followingCount >= 1 },
    { key: "Popular", condition: hasPopularPost },
    { key: "Community Builder", condition: communityCount >= 1 },
    { key: "Chatter", condition: messageCount >= 1 },
  ];

  const existing = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const existingIds = new Set(existing.map((e: { achievementId: string }) => e.achievementId));

  for (const check of checks) {
    if (check.condition && !existingIds.has(check.key)) {
      const achievement = await prisma.achievement.findUnique({
        where: { id: check.key },
      });
      if (achievement) {
        await prisma.userAchievement.create({
          data: { userId, achievementId: achievement.id },
        });
      }
    }
  }
}

function hasConsecutiveDays(
  moodLogs: { createdAt: Date }[],
  days: number,
): boolean {
  if (moodLogs.length < days) return false;

  const dates = moodLogs.map((m) => {
    const d = new Date(m.createdAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);

  if (uniqueDates.length < days) return false;

  let count = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = (uniqueDates[i - 1] - uniqueDates[i]) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      count++;
      if (count >= days) return true;
    } else {
      count = 1;
    }
  }

  return count >= days;
}
