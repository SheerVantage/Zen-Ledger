export function parseRelativeDate(input: string): string {
    const text = input.toLowerCase();
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (text.includes('today')) {
        // Already set to today
    } else if (text.includes('yesterday')) {
        date.setDate(date.getDate() - 1);
    } else if (text.includes('day before yesterday')) {
        date.setDate(date.getDate() - 2);
    } else {
        const daysBackMatch = text.match(/(\d+)\s*days?\s*back/);
        if (daysBackMatch) {
            const days = parseInt(daysBackMatch[1]);
            date.setDate(date.getDate() - days);
        }
    }

    return date.toISOString().split('T')[0];
}
