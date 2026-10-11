import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seed...');

  // Clean old data if exists
  await prisma.message.deleteMany();
  await prisma.fileAttachment.deleteMany();
  await prisma.whiteboardSession.deleteMany();
  await prisma.meetingParticipant.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const user1 = await prisma.user.create({
    data: {
      email: 'alex@connectx.io',
      name: 'Alex Rivera',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'sarah@connectx.io',
      name: 'Sarah Chen',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'david@connectx.io',
      name: 'David Kim',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log(`[Seed] Created ${user1.name}, ${user2.name}, ${user3.name}`);

  // Create a demo meeting
  const demoMeeting = await prisma.meeting.create({
    data: {
      code: 'team-sync-now',
      title: 'CONNECTX Product Design & Engineering Sync',
      description: 'Weekly team collaboration, WebRTC review, and architecture sprint.',
      hostId: user1.id,
      whiteboard: {
        create: {
          drawData: '[]',
        },
      },
      participants: {
        create: [
          { userId: user1.id, role: 'HOST' },
          { userId: user2.id, role: 'PARTICIPANT' },
        ],
      },
    },
  });

  console.log(`[Seed] Created demo meeting: ${demoMeeting.title} (Code: ${demoMeeting.code})`);
  console.log('[Seed] Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
