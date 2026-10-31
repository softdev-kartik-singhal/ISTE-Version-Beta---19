// Kinds of cash received; ids match CASH_SOURCES in the backend config.
import { Briefcase, Gift, HandCoins, Laptop } from 'lucide-react';

export const SOURCES = [
  { id: 'gift', label: 'Gift', icon: Gift },
  { id: 'salary in cash', label: 'Salary in cash', icon: Briefcase },
  { id: 'freelance', label: 'Freelance', icon: Laptop },
  { id: 'other', label: 'Other', icon: HandCoins },
];
