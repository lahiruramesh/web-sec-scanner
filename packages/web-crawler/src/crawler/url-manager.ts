import type { QueueItem } from '../types/index';
import { DomainValidator } from './domain-validator';

export class UrlManager {
  private queue: QueueItem[] = [];
  private visited: Set<string> = new Set();
  private startUrl: string;
  private includeSubdomains: boolean;

  constructor(startUrl: string, includeSubdomains: boolean = false) {
    this.startUrl = startUrl;
    this.includeSubdomains = includeSubdomains;
    this.enqueue(startUrl, 0);
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);

      parsed.hash = '';

      if (parsed.pathname.endsWith('/') && parsed.pathname.length > 1) {
        parsed.pathname = parsed.pathname.slice(0, -1);
      }

      const params = Array.from(parsed.searchParams.entries()).sort(
        ([a], [b]) => a.localeCompare(b)
      );
      parsed.search = '';
      params.forEach(([key, value]) => {
        parsed.searchParams.append(key, value);
      });

      return parsed.href;
    } catch {
      return url;
    }
  }

  isVisited(url: string): boolean {
    const normalized = this.normalizeUrl(url);
    return this.visited.has(normalized);
  }

  markVisited(url: string): void {
    const normalized = this.normalizeUrl(url);
    this.visited.add(normalized);
  }

  enqueue(url: string, depth: number): boolean {
    if (!DomainValidator.isValidHttpUrl(url)) {
      return false;
    }

    if (!DomainValidator.isSameDomain(url, this.startUrl, this.includeSubdomains)) {
      return false;
    }

    if (this.isVisited(url)) {
      return false;
    }

    this.queue.push({ url, depth });
    return true;
  }

  dequeue(): QueueItem | undefined {
    return this.queue.shift();
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getVisitedCount(): number {
    return this.visited.size;
  }

  getVisitedUrls(): string[] {
    return Array.from(this.visited);
  }
}
