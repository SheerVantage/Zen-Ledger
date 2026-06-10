import type { ParseMeta, ParsedTransactionDraft } from './transactionParser';

export type ReviewField = 'amount' | 'date' | 'purpose' | 'party' | 'account' | 'status';

export interface ReviewReason {
    id: string;
    field: ReviewField;
    message: string;
}

export interface ParseAssessment {
    needsReview: boolean;
    reasons: ReviewReason[];
    flaggedFields: ReviewField[];
}

const COMPLEX_HINTS = new Set(['receivable', 'payable', 'transfer', 'prospect']);

export function assessParseConfidence(
    input: string,
    draft: ParsedTransactionDraft,
): ParseAssessment {
    const meta = draft.parseMeta;
    const lowerInput = input.toLowerCase();
    const reasons: ReviewReason[] = [];

    if (!meta.amountFound) {
        reasons.push({ id: 'R1', field: 'amount', message: 'Amount missing' });
    } else if (draft.amount === 0) {
        reasons.push({ id: 'R2', field: 'amount', message: 'Amount looks like zero' });
    }

    if (meta.usedPurposeFallback) {
        reasons.push({ id: 'R3', field: 'purpose', message: 'Category unclear' });
    }

    if (meta.atMention && !meta.partyMatched) {
        reasons.push({ id: 'R4', field: 'party', message: 'Party not recognized' });
    }

    if (meta.hashMention && !meta.purposeMatched) {
        reasons.push({ id: 'R5', field: 'purpose', message: 'Purpose not recognized' });
    }

    if (meta.purposeMatchCount > 1) {
        reasons.push({ id: 'R6', field: 'purpose', message: 'Multiple types possible' });
    }

    if (meta.categoryHint && COMPLEX_HINTS.has(meta.categoryHint)) {
        reasons.push({
            id: 'R7',
            field: 'status',
            message: 'Complex transaction — please confirm',
        });
    }

    if (/\bapple\b/.test(lowerInput)) {
        reasons.push({ id: 'R8', field: 'purpose', message: 'Could mean more than one thing' });
    }

    const flaggedFields = [...new Set(reasons.map((reason) => reason.field))];

    return {
        needsReview: reasons.length > 0,
        reasons,
        flaggedFields,
    };
}
