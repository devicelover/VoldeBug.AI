import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("Seeding database...");

  // Destroy sequence
  await prisma.notification.deleteMany();
  await prisma.dailyChallenge.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.xPTransaction.deleteMany();
  await prisma.streak.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.classMember.deleteMany();
  await prisma.class.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.school.deleteMany();
  await prisma.user.deleteMany();
  console.log("  Purged database successfully.");

  // Badges
  const badgeDefs = [
    { name: "First Step", desc: "Completed your first assignment", condition: "first_assignment", count: 1, xp: 100, icon: "📤" },
    { name: "Tool Explorer", desc: "Used 5 different AI tools", condition: "used_5_tools", count: 5, xp: 150, icon: "🔭" },
    { name: "Streak Master", desc: "Maintained a 7-day login streak", condition: "streak_7", count: 7, xp: 200, icon: "⚡" },
    { name: "Top Scholar", desc: "Reached #1 on the class leaderboard", condition: "rank_1", count: 1, xp: 300, icon: "🏆" }
  ];
  const badges = [];
  for (const b of badgeDefs) {
    badges.push(await prisma.badge.create({
      data: {
        name: b.name,
        description: b.desc,
        iconUrl: b.icon,
        conditionKey: b.condition,
        requiredCount: b.count,
        xpReward: b.xp,
      },
    }));
  }

  // Tools
  const toolDefs = [
    { name: "ChatGPT", cat: "CHAT_AI", desc: "Conversational AI.", color: "#10a37f", uses: ["Ask questions"], subjects: ["General"] },
    { name: "Claude", cat: "CHAT_AI", desc: "Thoughtful AI assistant.", color: "#d97706", uses: ["Writing help"], subjects: ["English"] },
    { name: "GitHub Copilot", cat: "CODE_AI", desc: "AI pair programmer.", color: "#8b5cf6", uses: ["Write code"], subjects: ["Computer Science"] },
  ];
  const tools = [];
  for (const t of toolDefs) {
    tools.push(await prisma.tool.create({
      data: {
        name: t.name, category: t.cat, description: t.desc, logoUrl: `/tools/${t.name.toLowerCase().replace(/ /g, "-")}.svg`, brandColor: t.color, useCases: t.uses, subjects: t.subjects,
      },
    }));
  }

  // School & Admin
  const admin = await prisma.user.create({
    data: { name: "Admin", email: "admin@voldebug.ai", passwordHash: await hashPassword("Admin123!"), role: "ADMIN", onboardingStatus: "COMPLETED" },
  });
  const school = await prisma.school.create({ data: { name: "Voldebug Academy", adminId: admin.id } });

  // Teacher & 2 Classes
  const teacher = await prisma.user.create({
    data: { name: "Ms. Rivera", email: "rivera@voldebug.ai", passwordHash: await hashPassword("Teacher123!"), role: "TEACHER", onboardingStatus: "COMPLETED" },
  });
  const classA = await prisma.class.create({ data: { name: "Computer Science 101", teacherId: teacher.id, schoolId: school.id } });
  const classB = await prisma.class.create({ data: { name: "Philosophy & AI ethics", teacherId: teacher.id, schoolId: school.id } });

  // 20 Students
  const firstNames = ["Alex", "Jordan", "Taylor", "Sam", "Casey", "Riley", "Cameron", "Morgan", "Avery", "Skyler", "Drew", "Peyton", "Kendall", "Reese", "Rowan", "Hayden", "Quinn", "Parker", "Emerson", "Sawyer"];
  const students = [];
  for (const name of firstNames) {
    students.push(await prisma.user.create({
      data: {
        name: `${name} Smith`,
        email: `${name.toLowerCase()}@voldebug.ai`,
        passwordHash: await hashPassword("Student123!"),
        role: "STUDENT",
        onboardingStatus: "COMPLETED",
        gradeLevel: 10,
      },
    }));
  }

  console.log(`  Creating 20 fully populated students...`);

  // Assign classes randomly
  for (const student of students) {
    const isClassA = Math.random() > 0.3;
    const isClassB = Math.random() > 0.4;
    if (isClassA) await prisma.classMember.create({ data: { classId: classA.id, userId: student.id } });
    if (isClassB) await prisma.classMember.create({ data: { classId: classB.id, userId: student.id } });
    if (!isClassA && !isClassB) await prisma.classMember.create({ data: { classId: classA.id, userId: student.id } });
  }

  // Generate Assignments
  const assignments = [];
  for (const cls of [classA, classB]) {
    for (let i = 0; i < 4; i++) { // 4 assignments per class
      const daysOffset = randomInt(-10, 10); // Past and future due dates
      assignments.push(await prisma.assignment.create({
        data: {
          title: `Assignment ${i + 1} - ${cls.name.split(' ')[0]}`,
          description: "Complete this analytical assignment and submit a PDF.",
          classId: cls.id,
          creatorId: teacher.id,
          suggestedToolId: tools[0]!.id,
          dueDate: new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000),
          xpReward: randomInt(50, 200),
          earlyBonus: 25,
          status: "PUBLISHED",
          submissionFormats: ["PDF"],
        },
      }));
    }
  }

  // Iterate exactly like real usage: Submissions and XP logic!
  console.log(`  Creating randomized student submissions and evaluating Gamification constraints...`);
  const now = new Date();
  
  for (const asgn of assignments) {
    const members = await prisma.classMember.findMany({ where: { classId: asgn.classId } });
    for (const member of members) {
      if (Math.random() < 0.8) { // 80% submission rate
        const isEarly = Math.random() > 0.5; // Half submitted early
        const submittedAt = isEarly ? randomDate(new Date(now.getTime() - 14 * 86400000), new Date(asgn.dueDate.getTime() - 86400000)) : now;
        const isGraded = Math.random() > 0.2; // 80% of submissions are graded
        const score = randomInt(40, 100);
        let gradeLetter = "A";
        if (score < 90) gradeLetter = "B";
        if (score < 80) gradeLetter = "C";
        if (score < 70) gradeLetter = "D";

        const submission = await prisma.submission.create({
          data: {
            assignmentId: asgn.id,
            studentId: member.userId,
            fileUrls: ["/uploads/test.pdf"],
            status: isGraded ? "GRADED" : "SUBMITTED",
            submittedAt,
            score: isGraded ? score : null,
            grade: isGraded ? gradeLetter : null,
            xpAwarded: isGraded ? asgn.xpReward + (isEarly ? asgn.earlyBonus! : 0) : null,
          }
        });

        // XP Trace
        if (isGraded) {
          await prisma.xPTransaction.create({
            data: {
              userId: member.userId,
              amount: asgn.xpReward + (isEarly ? asgn.earlyBonus! : 0),
              source: "ASSIGNMENT_GRADE",
              assignmentId: asgn.id,
            }
          });
        }
      }
    }
  }

  // Generate Streaks & Badges
  for (const s of students) {
    await prisma.streak.create({
      data: {
        userId: s.id,
        currentStreak: randomInt(0, 14),
        longestStreak: randomInt(3, 30),
        lastActiveDate: now,
      },
    });

    // Random badges
    if (Math.random() > 0.3) {
      await prisma.userBadge.create({
        data: {
          userId: s.id,
          badgeId: badges[0]!.id,
          progressCount: 1
        }
      });
    }
  }
  // ─── Audit Logs (AI interaction records for Principal Dashboard) ──────
  console.log("  Seeding audit logs for Principal Dashboard...");

  const aiTools = ["ChatGPT", "Claude", "GitHub Copilot"];

  const safePrompts = [
    { prompt: "Explain the difference between mitosis and meiosis in simple terms.", response: "Mitosis produces two identical daughter cells for growth and repair, while meiosis produces four genetically unique cells for reproduction. In mitosis, there is one division; in meiosis, there are two successive divisions that halve the chromosome number." },
    { prompt: "Help me understand quadratic equations with examples.", response: "A quadratic equation has the form ax² + bx + c = 0. For example, x² - 5x + 6 = 0 can be factored as (x-2)(x-3) = 0, giving solutions x = 2 and x = 3." },
    { prompt: "What are the main causes of the French Revolution?", response: "The French Revolution (1789) was caused by financial crisis, social inequality under the Estates system, Enlightenment ideas about liberty and equality, food shortages, and weak leadership under Louis XVI." },
    { prompt: "Write a Python function to calculate the factorial of a number.", response: "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(5))  # Output: 120" },
    { prompt: "Summarize the water cycle for my geography project.", response: "The water cycle involves evaporation (water turning to vapor), condensation (vapor forming clouds), precipitation (rain/snow falling), and collection (water gathering in bodies of water). Solar energy drives this continuous cycle." },
    { prompt: "What is Newton's third law of motion? Give examples.", response: "Newton's Third Law states that for every action, there is an equal and opposite reaction. Examples: when you push a wall, the wall pushes back; a rocket expels gas downward and moves upward; when you swim, you push water backward and move forward." },
    { prompt: "Help me write an essay outline about climate change.", response: "I. Introduction: Define climate change and its significance\nII. Causes: Greenhouse gases, deforestation, industrial emissions\nIII. Effects: Rising temperatures, sea levels, extreme weather\nIV. Solutions: Renewable energy, conservation, policy changes\nV. Conclusion: Call to action for students" },
    { prompt: "Explain the concept of supply and demand in economics.", response: "Supply and demand is a fundamental economic model. When demand for a product increases and supply stays the same, prices rise. When supply increases and demand stays the same, prices fall. The equilibrium price is where supply meets demand." },
    { prompt: "What are the properties of acids and bases in chemistry?", response: "Acids have pH < 7, taste sour, turn blue litmus red, and release H+ ions. Bases have pH > 7, feel slippery, turn red litmus blue, and release OH- ions. When mixed, they neutralize each other to form salt and water." },
    { prompt: "Help me debug this JavaScript code that calculates average.", response: "The issue is that you're dividing before summing all elements. Move the division outside the loop: const avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;" },
  ];

  const flaggedPrompts = [
    { prompt: "Write my entire history essay for me. I need 2000 words about World War II and I'll submit it as my own work.", response: "[BLOCKED] This request was blocked by safety filters. AI tools should be used to help you learn and understand topics, not to generate complete assignments for submission. This would constitute academic dishonesty." },
    { prompt: "Give me all the answers to the CBSE Class 10 math board exam 2025.", response: "[BLOCKED] This request was blocked. Providing exam answers would be academic misconduct. Instead, I can help you understand concepts and practice with sample problems." },
    { prompt: "How do I hack into my school's grading portal to change my marks?", response: "[BLOCKED] This request has been flagged and blocked. Attempting to gain unauthorized access to school systems is illegal and against school policy. If you have concerns about your grades, please speak with your teacher." },
    { prompt: "Write a program to generate fake attendance records for my school account.", response: "[BLOCKED] This request was blocked by content safety filters. Generating fraudulent records is a violation of school policy and potentially illegal. Attendance tracking exists for your safety." },
    { prompt: "Tell me how to cheat on the upcoming online exam without getting caught.", response: "[BLOCKED] This request has been flagged. Academic integrity is fundamental to your education. Instead of cheating, consider using study techniques like spaced repetition, practice tests, and study groups." },
    { prompt: "Generate a fake medical certificate so I can skip the exam.", response: "[BLOCKED] This request was blocked. Creating forged documents is illegal and could result in serious disciplinary action. If you have genuine health concerns, please consult your school counselor." },
  ];

  // Create ~40 safe logs spread across students
  for (let i = 0; i < 40; i++) {
    const student = students[randomInt(0, students.length - 1)]!;
    const safe = safePrompts[randomInt(0, safePrompts.length - 1)]!;
    const tool = aiTools[randomInt(0, aiTools.length - 1)]!;
    const daysAgo = randomInt(0, 21);
    const hoursAgo = randomInt(0, 23);

    await prisma.auditLog.create({
      data: {
        studentId: student.id,
        promptText: safe.prompt,
        aiResponse: safe.response,
        toolUsed: tool,
        isFlagged: false,
        timestamp: new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000),
      },
    });
  }

  // Create ~12 flagged logs
  for (let i = 0; i < 12; i++) {
    const student = students[randomInt(0, students.length - 1)]!;
    const flagged = flaggedPrompts[randomInt(0, flaggedPrompts.length - 1)]!;
    const tool = aiTools[randomInt(0, aiTools.length - 1)]!;
    const daysAgo = randomInt(0, 14);
    const hoursAgo = randomInt(0, 23);

    await prisma.auditLog.create({
      data: {
        studentId: student.id,
        promptText: flagged.prompt,
        aiResponse: flagged.response,
        toolUsed: tool,
        isFlagged: true,
        timestamp: new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000),
      },
    });
  }

  console.log("  Created 40 safe + 12 flagged audit log entries.");

  console.log("Seed completely successful!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
