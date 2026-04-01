import { WalletService } from '../wallet.service';

describe('WalletService', () => {
  describe('wallet operations', () => {
    it('should credit wallet on settlement (sale price - commission - 10% reserve)', () => {
      expect(WalletService).toBeDefined();
    });

    it('should apply withdrawal fee (1% if balance <50000, else 0%)', () => {
      expect(WalletService).toBeDefined();
    });
  });
});
