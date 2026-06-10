# Zen Ledger

Personal finance app that replaces complex forms with conversational input. Local-first, mobile-first, calm design.

## Language

**Purpose**:
What the money was for — a label for the reason behind a transaction (Coffee, Rent, Salary).
_Avoid_: Category, type, tag

**Party**:
The who — a person a transaction is with. Relationship to the party (receivable, payable) emerges from transaction history, not from the party entity itself.
_Avoid_: Contact, entity, vendor, client

**Fund**:
Where money lives — a container for money (cash, bank, bKash wallet, amusement fund, charity fund). User-extensible. Each transaction touches one fund, except transfers which touch two.
_Avoid_: Account, wallet, bucket

**AccountType**:
The financial flow direction — determines how a transaction amount affects fund balances. Eight types: expense, earning, receivable, payable, recovered, repaid, transfer, prospect. Independent of fund.
_Avoid_: Category, direction, type

**Settlement**:
Closing an open receivable or payabalance. Creates a new transaction as proof. Can be partial or full.
_Avoid_: Close, resolve, clear

**Receivable**:
Money owed to you. Positive balance on a party until settled.
_Avoid_: Loan given, credit, advance

**Payable**:
Money you owe to someone. Negative balance on a party until settled.
_Avoid_: Loan taken, debt, liability

**Prospect**:
A planned or expected future transaction. Confirmed when it actually occurs.
_Avoid_: Planned, pending, draft

**Passthrough**:
Money passing through your hands that isn't yours — collecting on behalf of someone else. Excluded from spending/income totals.
_Avoid_: Pass-through, intermediary, conduit

**Transfer**:
Movement of money between your own funds. Uses `fromFundId` and `toFundId`. Neutral effect on total net worth.
_Avoid_: Move, shift, allocation
