// Maps the icon keys used in mock/API data to lucide-react icons, so data stays plain JSON.
import {
  Armchair, Car, CircleAlert, Clock, Dumbbell, Film, Gauge, Headphones, House, Info, Landmark, Laptop, Plane, ShoppingBag,
  ShoppingCart, Smartphone, Store, TrendingUp, TriangleAlert, Tv, Utensils, Wallet, Wrench, Zap,
} from 'lucide-react';

const ICONS = {
  home: House,
  tv: Tv,
  food: Utensils,
  shopping: ShoppingBag,
  grocery: ShoppingCart,
  store: Store,
  warning: TriangleAlert,
  clock: Clock,
  info: Info,
  alert: CircleAlert,
  bank: Landmark,
  wallet: Wallet,
  car: Car,
  bolt: Zap,
  trending: TrendingUp,
  phone: Smartphone,
  laptop: Laptop,
  travel: Plane,
  chair: Armchair,
  fitness: Dumbbell,
  movie: Film,
  headphones: Headphones,
  gauge: Gauge,
  wrench: Wrench,
};

export function iconFor(key) {
  return ICONS[key] || Info;
}
