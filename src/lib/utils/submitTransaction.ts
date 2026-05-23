import { addTransaction, type Transaction } from '$lib/stores/transactions';
import { showCaptureSuccess } from '$lib/stores/feedback';
import { parseTransaction, type ParsedTransactionDraft } from './transactionParser';
import { assessParseConfidence, type ParseAssessment } from './parseConfidence';

export interface TransactionSubmitOverrides {
    partyId?: string;
    purposeId?: string;
    account?: string;
    toAccount?: string;
    isPassthrough?: boolean;
    confidence?: 'high' | 'medium' | 'low';
    expectedDate?: string;
    prospectType?: Transaction['prospectType'];
    narration?: string;
    amount?: number;
    date?: string;
    status?: Transaction['status'];
}

export type SubmitCaptureResult =
    | { status: 'saved'; id: string }
    | {
          status: 'review';
          draft: ParsedTransactionDraft;
          assessment: ParseAssessment;
          originalText: string;
      };

export function commitParsedTransaction(
    draft: ParsedTransactionDraft,
    overrides?: TransactionSubmitOverrides,
): string {
    const { id: _omitId, prospectType: parsedProspectType, parseMeta: _omitMeta, ...parsedFields } =
        draft;

    const id = addTransaction({
        ...parsedFields,
        narration: overrides?.narration ?? parsedFields.narration,
        amount: overrides?.amount ?? parsedFields.amount,
        date: overrides?.date ?? parsedFields.date,
        status: overrides?.status ?? parsedFields.status,
        ...(overrides?.partyId ? { partyId: overrides.partyId } : {}),
        ...(overrides?.purposeId ? { purposeId: overrides.purposeId } : {}),
        ...(overrides?.account ? { account: overrides.account } : {}),
        ...(overrides?.toAccount ? { toAccount: overrides.toAccount } : {}),
        ...(overrides?.isPassthrough !== undefined ? { isPassthrough: overrides.isPassthrough } : {}),
        ...(overrides?.confidence ? { confidence: overrides.confidence } : {}),
        ...(overrides?.expectedDate ? { expectedDate: overrides.expectedDate } : {}),
        ...(overrides?.prospectType
            ? { prospectType: overrides.prospectType }
            : parsedProspectType
              ? { prospectType: parsedProspectType as Transaction['prospectType'] }
              : {}),
    });

    showCaptureSuccess(id);
    return id;
}

export function submitCapture(
    text: string,
    overrides?: TransactionSubmitOverrides,
): SubmitCaptureResult {
    const draft = parseTransaction(text);
    const assessment = assessParseConfidence(text, draft);

    if (assessment.needsReview) {
        return {
            status: 'review',
            draft,
            assessment,
            originalText: text,
        };
    }

    const id = commitParsedTransaction(draft, overrides);
    return { status: 'saved', id };
}

/** Fast-path save only. Use submitCapture when review may be needed. */
export function submitTransaction(text: string, overrides?: TransactionSubmitOverrides): string {
    const result = submitCapture(text, overrides);
    if (result.status === 'review') {
        throw new Error('Transaction requires review — use submitCapture in the capture flow');
    }
    return result.id;
}
