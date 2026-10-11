import { z } from 'zod';

export const createMeetingSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100).trim(),
  description: z.string().max(500).optional(),
  passcode: z.string().min(4).max(20).optional(),
  isLocked: z.boolean().optional(),
});

export const joinMeetingSchema = z.object({
  passcode: z.string().optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  isLocked: z.boolean().optional(),
  passcode: z.string().min(4).max(20).optional().nullable(),
});
