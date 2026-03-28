/**
 * Simple fuzzy matching utility to check if two names are similar.
 * Ignores generic words and case.
 */
export function isSimilar(name1: string, name2: string): boolean {
    const n1 = normalize(name1);
    const n2 = normalize(name2);

    if (!n1 || !n2) return false;

    // Exact match
    if (n1 === n2) return true;

    // One contains the other (e.g., "John Doe" and "John")
    if (n1.includes(n2) || n2.includes(n1)) return true;

    // Levenshtein distance or simple character overlap could be added here
    // For now, let's stick to normalized substring match as requested
    return false;
}

function normalize(name: string): string {
    const genericWords = ['the', 'and', 'with', 'for', 'from', 'to', 'a', 'an'];
    return name.toLowerCase()
        .replace(/[^\w\s]/gi, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => !genericWords.includes(word))
        .join(' ')
        .trim();
}
