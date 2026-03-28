import { get } from 'svelte/store';
import { purposes } from '../stores/purposes';
import { parties } from '../stores/parties';
import { parseRelativeDate } from './dateParser';

export function parseTransaction(input: string) {
    const allPurposes = get(purposes);
    const allParties = get(parties);
    
    // Default values
    let amount = 0;
    let date = new Date().toISOString().split('T')[0];
    let purposeId = ""; 
    let partyId = "";
    let account = "cash";
    let status: 'completed' | 'pending' | 'partial' = 'completed';
    let isPassthrough = false;
    let categoryHint: string | null = null;
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    let prospectType: string = 'pipeline';

    const lowerInput = input.toLowerCase();

    // 1. Extract Amount
    const amountMatch = input.match(/(\d+(\.\d{1,2})?)/);
    if (amountMatch) {
        amount = parseFloat(amountMatch[0]);
    }

    // 2. Extract Date (Relative)
    const relativeDate = parseRelativeDate(input);
    if (relativeDate) {
        date = relativeDate;
    }

    // 3. Detect Account (Bank, BKash, Nagad)
    if (lowerInput.match(/\bbank\b|\bcheque\b|\batm\b|\bdepo/)) account = 'bank';
    else if (lowerInput.match(/\bbkash\b/)) account = 'bkash';
    else if (lowerInput.match(/\bnagad\b/)) account = 'nagad';

    // 4. Detect Status & Intent
    if (lowerInput.match(/pending|accrued|due|to be paid|owed|receive/)) status = 'pending';
    else if (lowerInput.match(/partial|partially/)) status = 'partial';

    // 5. Detect Category Hints / Special Flags
    if (lowerInput.match(/plan to|expected|next month|next week|future|possible/)) {
        categoryHint = 'prospect';
        if (lowerInput.match(/next month|future/)) {
            prospectType = 'pipeline';
            confidence = 'medium';
        }
    }
    else if (lowerInput.match(/loan to|lent|gave as loan|invoiced|receivable|bill/)) {
        categoryHint = 'receivable';
        if (lowerInput.includes('invoiced')) prospectType = 'expected_income';
    }
    else if (lowerInput.match(/borrowed|loan from|took loan|owe|payable/)) {
        categoryHint = 'payable';
    }
    else if (lowerInput.match(/passthrough|on behalf of|to give away|charity/)) {
        isPassthrough = true;
    }
    else if (lowerInput.match(/transfer|deposited|moved|bank to|cash to|withdrawal/)) {
        categoryHint = 'transfer';
        if (lowerInput.match(/deposited/)) account = 'bank';
    }

    // 6. Match Purpose by Name/Alias
    for (const p of allPurposes) {
        if (lowerInput.includes(p.name.toLowerCase()) || 
            p.aliases?.some(alias => lowerInput.includes(alias.toLowerCase()))) {
            purposeId = p.id;
            break;
        }
    }

    // 7. If no specific purpose, find one by Category Hint (e.g. any 'receivable' or 'prospect' or 'transfer' purpose)
    if (!purposeId && categoryHint) {
        const matchingPurpose = allPurposes.find(p => p.accountType === categoryHint);
        if (matchingPurpose) purposeId = matchingPurpose.id;
    }

    // 8. Match Party
    for (const p of allParties) {
        if (lowerInput.includes(p.name.toLowerCase()) || 
            p.aliases?.some(alias => lowerInput.includes(alias.toLowerCase()))) {
            partyId = p.id;
            break;
        }
    }

    // 9. Fallback if still no purpose
    if (!purposeId) purposeId = "1"; // Fallback to 'Coffee' or similar general expense

    const purpose = allPurposes.find(p => p.id === purposeId);
    if (purpose && ['receivable', 'payable', 'prospect'].includes(purpose.accountType)) {
        if (status === 'completed') status = 'pending'; // Force pending for these types if not specified otherwise
    }

    // 8. Calculate Sign and Direction
    let finalAmount = amount;
    const isOutflowKeywords = lowerInput.match(/paid|spent|gave|lent|bought|to be paid/);
    const isInflowKeywords = lowerInput.match(/received|got|earning|income|invoiced/);

    if (isOutflowKeywords && !isInflowKeywords) finalAmount = -amount;
    else if (isInflowKeywords) finalAmount = Math.abs(amount);

    return {
        id: Math.random().toString(36).substring(2, 9),
        narration: input,
        amount: finalAmount,
        date,
        purposeId,
        partyId,
        account,
        status,
        isPassthrough,
        confidence,
        prospectType
    };
}
