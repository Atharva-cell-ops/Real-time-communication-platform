import crypto from 'crypto';

/**
 * Generates a clean, readable meeting code formatted like: abc-defg-hij
 */
export const generateMeetingCode = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const getRandomChars = (len: number) => {
    let result = '';
    const bytes = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  };

  return `${getRandomChars(3)}-${getRandomChars(4)}-${getRandomChars(3)}`;
};
