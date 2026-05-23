import { Injectable } from '@nestjs/common';

export interface SanitisationResult {
  sanitisedText: string;
  patternsMatched: {
    emails: number;
    phones: number;
    ibans: number;
    accounts: number;
  };
  sanitisationApplied: boolean;
}

@Injectable()
export class SanitisationService {
  private readonly patterns = {
    email: /[\w.\-]+@[\w.\-]+\.\w+/g,
    phone: /(\+\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{2,4}[\s\-.]?\d{2,9}/g,
    iban: /\b[A-Z]{2}\d{2}[\sA-Z0-9]{11,30}\b/g,
    account: /\b\d{8,12}\b/g,
  };

  sanitise(text: string): SanitisationResult {
    let sanitisedText = text;
    let emails = 0;
    let phones = 0;
    let ibans = 0;
    let accounts = 0;

    sanitisedText = sanitisedText.replace(this.patterns.email, () => {
      emails++;
      return '[EMAIL]';
    });

    // IBAN and account before phone: phone regex matches digit runs, so
    // replace structured numeric formats first to avoid false positives.
    sanitisedText = sanitisedText.replace(this.patterns.iban, () => {
      ibans++;
      return '[IBAN]';
    });

    sanitisedText = sanitisedText.replace(this.patterns.account, () => {
      accounts++;
      return '[ACCOUNT]';
    });

    sanitisedText = sanitisedText.replace(this.patterns.phone, () => {
      phones++;
      return '[PHONE]';
    });

    const sanitisationApplied = emails + phones + ibans + accounts > 0;

    return {
      sanitisedText,
      patternsMatched: { emails, phones, ibans, accounts },
      sanitisationApplied,
    };
  }
}
