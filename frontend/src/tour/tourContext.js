// Lets any screen ask the tour whether it is running, replay it, and who the signed-in user is (for per-user tips).
import { createContext, useContext } from 'react';

export const TourContext = createContext({ running: false, replay: () => {}, userKey: '' });
export const useTour = () => useContext(TourContext);
