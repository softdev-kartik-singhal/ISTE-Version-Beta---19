// The app's navigation in one place: four main tabs, and everything else under "More".
import { ArrowLeftRight, ChartLine, House, ListChecks, Menu, PiggyBank, ReceiptText, Shield, ShoppingBag, Sparkles, Wallet } from 'lucide-react';

export const MAIN_TABS = [
  { to: '/dashboard', icon: House, label: 'Home' },
  { to: '/ask', icon: Sparkles, label: 'Ask' },
  { to: '/spending', icon: ShoppingBag, label: 'Spending' },
  { to: '/plan', icon: PiggyBank, label: 'Plan' },
];

export const MORE_ITEMS = [
  { to: '/statements', icon: ReceiptText, label: 'Statements' },
  { to: '/transactions', icon: Wallet, label: 'Transactions' },
  { to: '/flags', icon: ListChecks, label: 'Things to check', badgeKey: 'flagCount' },
  { to: '/money-flow', icon: ArrowLeftRight, label: 'Money Flow' },
  { to: '/track-record', icon: ChartLine, label: 'Track Record' },
  { to: '/privacy', icon: Shield, label: 'Privacy & Data' },
];

export const MORE_ICON = Menu;

// Detail pages opened from a main tab count as that tab when highlighting the navigation.
export const PARENT_TAB = { '/trends': '/spending', '/goals': '/plan', '/surplus-plan': '/plan' };
