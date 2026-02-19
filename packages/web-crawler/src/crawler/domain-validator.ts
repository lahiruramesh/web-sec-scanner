export class DomainValidator {
  static getBaseDomain(url: string): string {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      return hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  static getHostname(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  static isSameDomain(
    url1: string,
    url2: string,
    includeSubdomains: boolean = false
  ): boolean {
    const domain1 = this.getBaseDomain(url1);
    const domain2 = this.getBaseDomain(url2);

    if (!domain1 || !domain2) {
      return false;
    }

    if (includeSubdomains) {
      return domain1.endsWith(domain2) || domain2.endsWith(domain1);
    } else {
      return domain1 === domain2;
    }
  }

  static isValidHttpUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
