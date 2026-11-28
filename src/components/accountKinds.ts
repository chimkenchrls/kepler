import type MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';

import type { AccountKind } from '../db/accounts';

// The kind only sets the label and icon (spec story 3).
export const ACCOUNT_KINDS: Record<AccountKind, { label: string; icon: ComponentProps<typeof MaterialIcons>['name'] }> = {
  cash: { label: 'Cash', icon: 'payments' },
  gcash: { label: 'GCash', icon: 'smartphone' },
  maya: { label: 'Maya', icon: 'account-balance-wallet' },
  bank: { label: 'Bank', icon: 'account-balance' },
};
