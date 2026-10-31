// Lets any screen open the "+ Cash" sheet: openCash() to add, openCash({ entry }) to edit, openCash({ amountPaise }) to prefill.
import { createContext, useContext } from 'react';

export const CashContext = createContext({ openCash: () => {} });
export const useCash = () => useContext(CashContext);
