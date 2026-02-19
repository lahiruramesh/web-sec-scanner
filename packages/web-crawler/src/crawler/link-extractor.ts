import type { Page } from 'playwright';

export class LinkExtractor {
  static async extractLinks(page: Page, baseUrl: string): Promise<string[]> {
    try {
      const hrefs = await page.$$eval('a[href]', (anchors) =>
        anchors.map((a) => a.getAttribute('href')).filter((href): href is string => href !== null)
      );

      const links: string[] = [];
      const base = new URL(baseUrl);

      for (const href of hrefs) {
        try {
          const absolute = new URL(href, base).href;

          if (!this.isValidLink(absolute)) {
            continue;
          }

          links.push(absolute);
        } catch {
          continue;
        }
      }

      return Array.from(new Set(links));
    } catch (error) {
      return [];
    }
  }

  private static isValidLink(url: string): boolean {
    try {
      const parsed = new URL(url);

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}
