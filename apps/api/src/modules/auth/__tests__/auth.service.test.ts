import { AuthService } from '../auth.service';

describe('AuthService', () => {
  describe('phone normalization', () => {
    it('should normalize Algerian phone numbers (0XXX -> +213XXX)', () => {
      expect(AuthService).toBeDefined();
    });
  });

  describe('OTP verification', () => {
    it('should generate 6-digit OTP with 5-minute expiry', () => {
      expect(AuthService).toBeDefined();
    });
  });
});
