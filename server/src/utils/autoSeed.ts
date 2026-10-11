import { prisma } from '../config/prisma.js';
import bcrypt from 'bcryptjs';

/**
 * Automatically seeds the database with demo accounts if empty.
 * Ensures zero-configuration demo logins for live deployments.
 */
export async function autoSeedDatabase(): Promise<void> {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return; // Already populated
    }

    console.log('[Auto-Seed] Empty database detected. Populating demo accounts...');
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

    // Create default meeting
    await prisma.meeting.create({
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

    console.log('[Auto-Seed] Demo accounts ready: alex@connectx.io, sarah@connectx.io, david@connectx.io');
  } catch (error) {
    console.error('[Auto-Seed Error]:', error);
  }
}
