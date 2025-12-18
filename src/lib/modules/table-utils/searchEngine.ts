export interface SearchConfig<T> {
  fields: (keyof T)[];
  caseSensitive?: boolean;
  fuzzySearch?: boolean;
  fuzzyThreshold?: number; // 0-1, lower = more strict
  highlightMatches?: boolean;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: string;
  value: string;
  highlightedValue?: string;
  matchIndices?: [number, number][];
}

export class SearchEngine<T> {
  private data: T[];
  private config: SearchConfig<T>;

  constructor(data: T[], config: SearchConfig<T>) {
    this.data = data;
    this.config = {
      caseSensitive: false,
      fuzzySearch: false,
      fuzzyThreshold: 0.6,
      highlightMatches: false,
      ...config
    };
  }

  setData(data: T[]): void {
    this.data = data;
  }

  updateConfig(config: Partial<SearchConfig<T>>): void {
    this.config = { ...this.config, ...config };
  }

  search(query: string): SearchResult<T>[] {
    if (!query.trim()) {
      return this.data.map(item => ({
        item,
        score: 1,
        matches: []
      }));
    }

    const results: SearchResult<T>[] = [];
    const normalizedQuery = this.config.caseSensitive ? query : query.toLowerCase();

    for (const item of this.data) {
      const matches: SearchMatch[] = [];
      let totalScore = 0;
      let matchCount = 0;

      for (const field of this.config.fields) {
        const value = String(item[field] || '');
        const normalizedValue = this.config.caseSensitive ? value : value.toLowerCase();

        if (this.config.fuzzySearch) {
          const fuzzyResult = this.fuzzyMatch(normalizedQuery, normalizedValue);
          if (fuzzyResult.score >= (this.config.fuzzyThreshold || 0.6)) {
            matches.push({
              field: String(field),
              value,
              highlightedValue: this.config.highlightMatches 
                ? this.highlightText(value, fuzzyResult.matchIndices)
                : undefined,
              matchIndices: fuzzyResult.matchIndices
            });
            totalScore += fuzzyResult.score;
            matchCount++;
          }
        } else {
          const exactResult = this.exactMatch(normalizedQuery, normalizedValue);
          if (exactResult.isMatch) {
            matches.push({
              field: String(field),
              value,
              highlightedValue: this.config.highlightMatches 
                ? this.highlightText(value, exactResult.matchIndices)
                : undefined,
              matchIndices: exactResult.matchIndices
            });
            totalScore += exactResult.score;
            matchCount++;
          }
        }
      }

      if (matches.length > 0) {
        results.push({
          item,
          score: totalScore / matchCount,
          matches
        });
      }
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  private exactMatch(query: string, text: string): { isMatch: boolean; score: number; matchIndices: [number, number][] } {
    const matchIndices: [number, number][] = [];
    let score = 0;

    if (text.includes(query)) {
      let startIndex = 0;
      while (true) {
        const index = text.indexOf(query, startIndex);
        if (index === -1) break;
        
        matchIndices.push([index, index + query.length - 1]);
        startIndex = index + 1;
      }

      // Calculate score based on match quality
      if (text === query) {
        score = 1.0; // Perfect match
      } else if (text.startsWith(query)) {
        score = 0.9; // Starts with query
      } else if (text.endsWith(query)) {
        score = 0.8; // Ends with query
      } else {
        score = 0.7; // Contains query
      }

      return { isMatch: true, score, matchIndices };
    }

    return { isMatch: false, score: 0, matchIndices: [] };
  }

  private fuzzyMatch(query: string, text: string): { score: number; matchIndices: [number, number][] } {
    if (query.length === 0) return { score: 0, matchIndices: [] };
    if (text.length === 0) return { score: 0, matchIndices: [] };

    const matchIndices: [number, number][] = [];
    let queryIndex = 0;
    let textIndex = 0;
    let matches = 0;
    let consecutiveMatches = 0;
    let maxConsecutiveMatches = 0;

    while (queryIndex < query.length && textIndex < text.length) {
      if (query[queryIndex] === text[textIndex]) {
        matchIndices.push([textIndex, textIndex]);
        matches++;
        consecutiveMatches++;
        maxConsecutiveMatches = Math.max(maxConsecutiveMatches, consecutiveMatches);
        queryIndex++;
      } else {
        consecutiveMatches = 0;
      }
      textIndex++;
    }

    if (matches === 0) {
      return { score: 0, matchIndices: [] };
    }

    // Calculate score based on various factors
    const matchRatio = matches / query.length;
    const consecutiveBonus = maxConsecutiveMatches / query.length;
    const lengthPenalty = Math.max(0, 1 - (text.length - query.length) / text.length);

    const score = (matchRatio * 0.6) + (consecutiveBonus * 0.3) + (lengthPenalty * 0.1);

    return { score, matchIndices };
  }

  private highlightText(text: string, matchIndices: [number, number][]): string {
    if (!matchIndices.length) return text;

    let result = '';
    let lastIndex = 0;

    // Sort indices to handle overlapping matches
    const sortedIndices = matchIndices.sort((a, b) => a[0] - b[0]);

    for (const [start, end] of sortedIndices) {
      // Add text before match
      result += text.slice(lastIndex, start);
      // Add highlighted match
      result += `<mark>${text.slice(start, end + 1)}</mark>`;
      lastIndex = end + 1;
    }

    // Add remaining text
    result += text.slice(lastIndex);

    return result;
  }

  // Utility methods for common search patterns
  static createBasicSearch<T>(fields: (keyof T)[]): SearchConfig<T> {
    return {
      fields,
      caseSensitive: false,
      fuzzySearch: false,
      highlightMatches: false
    };
  }

  static createFuzzySearch<T>(fields: (keyof T)[], threshold: number = 0.6): SearchConfig<T> {
    return {
      fields,
      caseSensitive: false,
      fuzzySearch: true,
      fuzzyThreshold: threshold,
      highlightMatches: true
    };
  }

  static createHighlightSearch<T>(fields: (keyof T)[]): SearchConfig<T> {
    return {
      fields,
      caseSensitive: false,
      fuzzySearch: false,
      highlightMatches: true
    };
  }

  // Method to get just the filtered items without search metadata
  getFilteredItems(query: string): T[] {
    return this.search(query).map(result => result.item);
  }

  // Method to get search suggestions based on existing data
  getSuggestions(query: string, maxSuggestions: number = 5): string[] {
    const suggestions = new Set<string>();
    const normalizedQuery = this.config.caseSensitive ? query : query.toLowerCase();

    for (const item of this.data) {
      for (const field of this.config.fields) {
        const value = String(item[field] || '');
        const normalizedValue = this.config.caseSensitive ? value : value.toLowerCase();

        if (normalizedValue.includes(normalizedQuery) && value !== query) {
          suggestions.add(value);
          if (suggestions.size >= maxSuggestions) {
            return Array.from(suggestions);
          }
        }
      }
    }

    return Array.from(suggestions);
  }
}