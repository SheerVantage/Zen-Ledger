import { get } from 'svelte/store';
import { purposes } from '../stores/purposes';
import { parties } from '../stores/parties';
import { parseRelativeDate } from './dateParser';

export interface ParseMeta {
    amountFound: boolean;
    purposeMatched: boolean;
    partyMatched: boolean;
    purposeMatchCount: number;
    usedPurposeFallback: boolean;
    categoryHint: string | null;
    atMention?: string;
    hashMention?: string;
}

export interface ParsedTransactionDraft {
    id: string;
    narration: string;
    amount: number;
    date: string;
    purposeId: string;
    partyId: string;
    fundId: string;
    fromFundId?: string;
    toFundId?: string;
    status: 'completed' | 'pending' | 'partial';
    isPassthrough: boolean;
    confidence: 'high' | 'medium' | 'low';
    prospectType: string;
    expectedDate?: string;
    parseMeta: ParseMeta;
}

function matchesEntityName(text: string, name: string, aliases?: string[]): boolean {
    const lower = text.toLowerCase();
    if (lower.includes(name.toLowerCase())) return true;
    return aliases?.some((alias) => lower.includes(alias.toLowerCase())) ?? false;
}

export function parseTransaction(input: string): ParsedTransactionDraft {
    const allPurposes = get(purposes);
    const allParties = get(parties);

    let amount = 0;
    let date = new Date().toISOString().split('T')[0];
    let purposeId = '';
    let partyId = '';
    let fundId = 'cash';
    let status: 'completed' | 'pending' | 'partial' = 'completed';
    let isPassthrough = false;
    let categoryHint: string | null = null;
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    let prospectType = 'pipeline';
    let expectedDate: string | undefined;

    const lowerInput = input.toLowerCase();
    const atMatch = input.match(/@([^\s#]+)/);
    const hashMatch = input.match(/#([^\s@]+)/);
    const atMention = atMatch?.[1];
    const hashMention = hashMatch?.[1];

    const amountMatch = input.match(/(\d+(\.\d{1,2})?)/);
    const amountFound = Boolean(amountMatch);
    if (amountMatch) {
        amount = parseFloat(amountMatch[0]);
    }

    const relativeDate = parseRelativeDate(input);
    if (relativeDate) {
        date = relativeDate;
    }

    if (lowerInput.match(/\bbank\b|\bcheque\b|\batm\b|\bdepo/)) fundId = 'bank';
    else if (lowerInput.match(/\bbkash\b/)) fundId = 'bkash';
    else if (lowerInput.match(/\bnagad\b/)) fundId = 'bkash'; // Default nagad to bkash since it's a mobile wallet

    if (lowerInput.match(/pending|accrued|due|to be paid|owed|receive/)) status = 'pending';
    else if (lowerInput.match(/partial|partially/)) status = 'partial';

    if (lowerInput.match(/plan to|expected|next month|next week|future|possible/)) {
        categoryHint = 'prospect';
        if (lowerInput.match(/next month|future/)) {
            prospectType = 'pipeline';
            confidence = 'medium';
        }
    } else if (lowerInput.match(/loan to|lent|gave as loan|invoiced|receivable|bill/)) {
        categoryHint = 'receivable';
        if (lowerInput.includes('invoiced')) prospectType = 'expected_income';
    } else if (lowerInput.match(/borrowed|loan from|took loan|owe|payable/)) {
        categoryHint = 'payable';
    } else if (lowerInput.match(/passthrough|on behalf of|to give away|charity/)) {
        isPassthrough = true;
    } else if (lowerInput.match(/transfer|deposited|moved|bank to|cash to|withdrawal/)) {
        categoryHint = 'transfer';
        if (lowerInput.match(/deposited/)) fundId = 'bank';
    }

    const matchedPurposeIds: string[] = [];
    for (const purpose of allPurposes) {
        if (matchesEntityName(lowerInput, purpose.name, purpose.aliases)) {
            matchedPurposeIds.push(purpose.id);
        }
    }

    if (hashMention) {
        const token = hashMention.toLowerCase();
        for (const purpose of allPurposes) {
            if (
                purpose.name.toLowerCase() === token ||
                purpose.aliases?.some((alias) => alias.toLowerCase() === token)
            ) {
                if (!matchedPurposeIds.includes(purpose.id)) {
                    matchedPurposeIds.push(purpose.id);
                }
            }
        }
    }

    let purposeMatched = false;
    if (matchedPurposeIds.length === 1) {
        purposeId = matchedPurposeIds[0];
        purposeMatched = true;
    } else if (matchedPurposeIds.length > 1) {
        purposeId = matchedPurposeIds[0];
        purposeMatched = true;
    }

    if (!purposeId && categoryHint) {
        const matchingPurpose = allPurposes.find((p) => p.accountType === categoryHint);
        if (matchingPurpose) {
            purposeId = matchingPurpose.id;
            purposeMatched = true;
        }
    }

    let partyMatched = false;
    if (atMention) {
        const token = atMention.toLowerCase();
        for (const party of allParties) {
            if (
                party.name.toLowerCase() === token ||
                party.aliases?.some((alias) => alias.toLowerCase() === token) ||
                matchesEntityName(token, party.name, party.aliases)
            ) {
                partyId = party.id;
                partyMatched = true;
                break;
            }
        }
    }

    if (!partyMatched) {
        for (const party of allParties) {
            if (matchesEntityName(lowerInput, party.name, party.aliases)) {
                partyId = party.id;
                partyMatched = true;
                break;
            }
        }
    }

    let usedPurposeFallback = false;
    if (!purposeId) {
        purposeId = '1';
        usedPurposeFallback = true;
    }

    const purpose = allPurposes.find((p) => p.id === purposeId);
    if (purpose && ['receivable', 'payable', 'prospect'].includes(purpose.accountType)) {
        if (status === 'completed') status = 'pending';
    }

    let finalAmount = amount;
    const isOutflowKeywords = lowerInput.match(/paid|spent|gave|lent|bought|to be paid/);
    const isInflowKeywords = lowerInput.match(/received|got|earning|income|invoiced|salary/);

    if (isOutflowKeywords && !isInflowKeywords) finalAmount = -Math.abs(amount);
    else if (isInflowKeywords) finalAmount = Math.abs(amount);
    else if (purpose?.accountType === 'expense' || purpose?.accountType === 'payable') {
        finalAmount = amount > 0 ? -Math.abs(amount) : finalAmount;
    } else if (purpose?.accountType === 'earning' || purpose?.accountType === 'receivable') {
        finalAmount = Math.abs(amount);
    }

    return {
        id: Math.random().toString(36).substring(2, 9),
        narration: input,
        amount: finalAmount,
        date,
        purposeId,
        partyId,
        fundId,
        status,
        isPassthrough,
        confidence,
        prospectType,
        expectedDate,
        parseMeta: {
            amountFound,
            purposeMatched,
            partyMatched,
            purposeMatchCount: matchedPurposeIds.length,
            usedPurposeFallback,
            categoryHint,
            atMention,
            hashMention,
        },
    };
}
