/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

type CartItem = { slug: string; qty: number };
type CartState = Record<string, CartItem>;

type Action =
  | { type: 'add'; slug: string; qty?: number }
  | { type: 'remove'; slug: string }
  | { type: 'set'; slug: string; qty: number };

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
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartState;
  totalCount: number;
  addItem: (slug: string, qty?: number) => void;
  removeItem: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
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

  const value = useMemo<CartContextValue>(() => {
    const totalCount = Object.values(items).reduce((sum, it) => sum + it.qty, 0);
    return {
      items,
      totalCount,
      addItem: (slug, qty = 1) => dispatch({ type: 'add', slug, qty }),
      removeItem: (slug) => dispatch({ type: 'remove', slug }),
      setQty: (slug, qty) => dispatch({ type: 'set', slug, qty }),
    };
  }, [items]);

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
  };
}
