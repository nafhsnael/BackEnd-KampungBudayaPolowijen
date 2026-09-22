import bcrypt from 'bcryptjs';

export class PasswordUtil {
  static async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async compare(plainText: string, hashedText: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  }
}
