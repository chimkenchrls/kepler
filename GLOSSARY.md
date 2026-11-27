# Kepler

A personal budget tracker for one person in the Philippines whose money sits in cash, e-wallets and bank accounts, and who wants to know how much they can spend today.

## Language

### Money places

**Account**:
A named place where the user's money sits, of one kind: Cash, GCash, Maya or Bank. The user can have several of each kind.
_Avoid_: Wallet (reserved for the physical cash wallet), user account, profile

**Starting balance**:
The amount in an Account when the user first added it to Kepler. It is not Income.
_Avoid_: Opening income, initial deposit

**Current balance**:
What an Account holds now: its Starting balance plus everything that has flowed in, minus everything that has flowed out. It can be negative, which hints at a missing entry.
_Avoid_: Saved balance

### Entries

**Entry**:
Anything the user logs: an Expense, an Income or a Transfer.
_Avoid_: Record, item, log

**Transaction**:
An Expense or an Income: money crossing the boundary of the user's Accounts. A Transfer is not a Transaction.
_Avoid_: Using it for Transfers

**Expense**:
A Transaction where money leaves one Account for good, such as pamasahe, ulam or padala sent to family.
_Avoid_: Spending entry, debit

**Income**:
A Transaction where money arrives in one Account from outside, such as salary or a gift.
_Avoid_: Earning, credit, deposit

**Transfer**:
Money moved between two of the user's own Accounts, such as a bank-to-GCash cash-in or an ATM withdrawal. It is neither an Expense nor an Income.
_Avoid_: Expense-and-income pair, cash-in (one kind of Transfer, not the general term)

**Fee**:
The optional charge on a Transfer, such as a ₱15 cash-in fee. It leaves the source Account and counts as spending under the Fees Category.
_Avoid_: Charge, service fee

**Padala**:
Money sent to family. Logged as an Expense, never a Transfer, because it leaves the user's Accounts.

### Categories

**Category**:
A label that says what a Transaction was for. Expense Categories and Income Categories are separate lists, one level deep, and the user can rename, add and reorder them.
_Avoid_: Tag, subcategory, type

**Fees Category**:
The built-in Expense Category that Transfer Fees count under. It cannot be archived or deleted.

**Refund**:
Money returned for an Expense. It is not its own kind of Entry: it is either a change to the original Expense, or an Income under the Refund Category when the Expense was in a past month.

### Budget

**Monthly budget**:
The most the user means to spend on Expenses in one calendar month. It repeats every month until changed, and Income never raises it.
_Avoid_: Allowance, spending plan, pay-cycle budget

**Category limit**:
An optional cap on one Expense Category within the Monthly budget. All Category limits together never exceed the Monthly budget.
_Avoid_: Category budget, envelope, sub-budget

**Everything else**:
The part of the Monthly budget left after all Category limits, shared by every Expense Category that has no limit.
_Avoid_: Other (that is a Category), unassigned, remainder

**Over budget**:
Spending past the Monthly budget or a Category limit. Kepler warns but never blocks the Expense, and nothing carries into the next month.
_Avoid_: Overdraft, deficit, rollover

### Lifecycle

**Archived**:
The state of an Account or Category the user no longer uses but which still has Entries. It is hidden when logging something new, and its past Entries keep it. The user can unarchive it to use it again.
_Avoid_: Deleted, hidden, inactive

### Backup

**Backup**:
A single file holding a copy of all of the user's Kepler data, made when they choose to back up and saved wherever they pick.
_Avoid_: Export (the spreadsheet file is a different thing), sync

**Restore**:
Replacing all of the user's Kepler data with the contents of a Backup. Nothing is merged.
_Avoid_: Import, merge
