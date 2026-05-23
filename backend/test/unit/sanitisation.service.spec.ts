import { SanitisationService } from '../../src/documents/sanitisation.service';

describe('SanitisationService', () => {
  let service: SanitisationService;

  beforeEach(() => {
    service = new SanitisationService();
  });

  describe('email sanitisation', () => {
    it('replaces an email address with [EMAIL]', () => {
      const result = service.sanitise('Contact john.doe@example.com for details.');
      expect(result.sanitisedText).not.toContain('john.doe@example.com');
      expect(result.sanitisedText).toContain('[EMAIL]');
      expect(result.patternsMatched.emails).toBe(1);
      expect(result.sanitisationApplied).toBe(true);
    });

    it('replaces multiple email addresses', () => {
      const result = service.sanitise('Email a@b.com or c@d.org for help.');
      expect(result.patternsMatched.emails).toBe(2);
      expect(result.sanitisedText).not.toMatch(/\S+@\S+\.\S+/);
    });
  });

  describe('IBAN sanitisation', () => {
    it('replaces a German IBAN with [IBAN]', () => {
      const result = service.sanitise('Bank account DE89370400440532013000 is used.');
      expect(result.sanitisedText).not.toContain('DE89370400440532013000');
      expect(result.sanitisedText).toContain('[IBAN]');
      expect(result.patternsMatched.ibans).toBe(1);
    });
  });

  describe('phone number sanitisation', () => {
    it('replaces an international phone number with [PHONE]', () => {
      const result = service.sanitise('Call us at +1 800 555 0199 for support.');
      expect(result.sanitisedText).not.toContain('+1 800 555 0199');
      expect(result.sanitisedText).toContain('[PHONE]');
      expect(result.patternsMatched.phones).toBe(1);
      expect(result.sanitisationApplied).toBe(true);
    });
  });

  describe('account number sanitisation', () => {
    it('replaces 8+ digit account numbers with [ACCOUNT]', () => {
      const result = service.sanitise('Account number 12345678 was debited.');
      expect(result.sanitisedText).not.toContain('12345678');
      expect(result.sanitisedText).toContain('[ACCOUNT]');
      expect(result.patternsMatched.accounts).toBe(1);
    });

    it('does not replace numbers shorter than 8 digits', () => {
      const result = service.sanitise('There were 5 items and 12 units.');
      expect(result.patternsMatched.accounts).toBe(0);
      expect(result.sanitisationApplied).toBe(false);
    });
  });

  describe('clean text', () => {
    it('returns text unchanged when no PII is present', () => {
      const text = 'The disbursement process requires dual approval from the committee.';
      const result = service.sanitise(text);
      expect(result.sanitisedText).toBe(text);
      expect(result.sanitisationApplied).toBe(false);
      expect(result.patternsMatched).toEqual({ emails: 0, phones: 0, ibans: 0, accounts: 0 });
    });

    it('handles empty string', () => {
      const result = service.sanitise('');
      expect(result.sanitisedText).toBe('');
      expect(result.sanitisationApplied).toBe(false);
    });
  });

  describe('mixed PII types', () => {
    it('sanitises multiple PII types in one pass', () => {
      const text = 'Contact admin@church.org, account 87654321, IBAN DE89370400440532013000.';
      const result = service.sanitise(text);
      expect(result.sanitisedText).not.toContain('admin@church.org');
      expect(result.sanitisedText).not.toContain('87654321');
      expect(result.patternsMatched.emails).toBe(1);
      expect(result.patternsMatched.ibans).toBe(1);
      expect(result.sanitisationApplied).toBe(true);
    });
  });
});
