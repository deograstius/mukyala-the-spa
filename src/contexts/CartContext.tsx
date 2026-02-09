/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

export type CartItem = { slug: string; qty: number };
export type CartState = Record<string, CartItem>;

export type CartErrorCode =
  | 'general'
  | 'quantity'
  | 'checkout_disabled'
  | 'order_min'
  | 'subscription';

type Action =
  | { type: 'add'; slug: string; qty?: number }
  | { type: 'remove'; slug: string }
  | { type: 'set'; slug: string; qty: number }
  | { type: 'clear' };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'add': {
      const current = state[action.slug]?.qty ?? 0;
      const qty = current + (action.qty ?? 1);
      return { ...state, [action.slug]: { slug: action.slug, qty } };
    }
    case 'set': {
      const qty = Math.max(0, action.qty);
      if (qty === 0) {
        const rest = { ...state };
        delete rest[action.slug];
        return rest;
      }
      return { ...state, [action.slug]: { slug: action.slug, qty } };
    }
    case 'remove': {
      const rest = { ...state };
      delete rest[action.slug];
      return rest;
    }
    case 'clear':
      return {};
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartState;
  totalCount: number;
  addItem: (slug: string, qty?: number, opts?: { openCart?: boolean }) => void;
  removeItem: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  cartOpen: boolean;
  cartError: CartErrorCode | null;
  openCart: (opts?: { error?: CartErrorCode | null }) => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadInitial(): CartState {
  try {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('cart:v1') : null;
    return v ? (JSON.parse(v) as CartState) : {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(reducer, undefined, loadInitial);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [cartError, setCartError] = React.useState<CartErrorCode | null>(null);

  const openCart = useCallback((opts?: { error?: CartErrorCode | null }) => {
    setCartError(opts?.error ?? null);
    setCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setCartOpen(false);
    setCartError(null);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const totalCount = Object.values(items).reduce((sum, it) => sum + it.qty, 0);
    return {
      items,
      totalCount,
      addItem: (slug, qty = 1, opts) => {
        dispatch({ type: 'add', slug, qty });
        if (opts?.openCart !== false) openCart();
      },
      removeItem: (slug) => dispatch({ type: 'remove', slug }),
      setQty: (slug, qty) => dispatch({ type: 'set', slug, qty }),
      clear: () => dispatch({ type: 'clear' }),
      cartOpen,
      cartError,
      openCart,
      closeCart,
    };
  }, [items, cartError, cartOpen, closeCart, openCart]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('cart:v1', JSON.stringify(items));
      }
    } catch {
      // ignore persistence errors
    }
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (ctx) return ctx;
  // Safe fallback for tests or components rendered outside provider
  return {
    items: {},
    totalCount: 0,
    addItem: () => {},
    removeItem: () => {},
    setQty: () => {},
    clear: () => {},
    cartOpen: false,
    cartError: null,
    openCart: () => {},
    closeCart: () => {},
  };
}
