import { initialFigurinhas } from "../data/initialFigurinhas";
import type { CartItem, Figurinha } from "../types/Figurinha";
import type { ConfiguracoesSistema } from "../types/ConfiguracoesSistema";

const FIGURINHAS_KEY = "figurinhas-da-copa:figurinhas";
const CART_KEY = "figurinhas-da-copa:carrinho";
const CONFIG_KEY = "figurinhas-da-copa:configuracoes";

export const defaultConfiguracoes: ConfiguracoesSistema = {
  whatsapp: "14998496036",
  senhaAdmin: "admin123",
  nomeSite: "Figurinhas da Copa",
};

export function normalizeFigurinha(figurinha: Figurinha): Figurinha {
  const quantidade = Math.max(0, Number(figurinha.quantidade) || 0);
  return {
    ...figurinha,
    preco: Math.max(0, Number(figurinha.preco) || 0),
    quantidade,
    disponivel: quantidade > 0,
  };
}

export function normalizeFigurinhas(figurinhas: Figurinha[]): Figurinha[] {
  return figurinhas.map(normalizeFigurinha);
}

function readJson<T>(key: string, fallback: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storageService = {
  getFigurinhas(): Figurinha[] {
    const saved = readJson<Figurinha[] | null>(FIGURINHAS_KEY, null);
    if (saved) return normalizeFigurinhas(saved);

    const normalizedInitial = normalizeFigurinhas(initialFigurinhas);
    writeJson(FIGURINHAS_KEY, normalizedInitial);
    return normalizedInitial;
  },

  saveFigurinhas(figurinhas: Figurinha[]) {
    writeJson(FIGURINHAS_KEY, normalizeFigurinhas(figurinhas));
  },

  getCart(): CartItem[] {
    return readJson<CartItem[]>(CART_KEY, []);
  },

  saveCart(items: CartItem[]) {
    writeJson(CART_KEY, items);
  },

  clearCart() {
    localStorage.removeItem(CART_KEY);
  },

  getConfiguracoes(): ConfiguracoesSistema {
    const saved = readJson<ConfiguracoesSistema | null>(CONFIG_KEY, null);
    return {
      ...defaultConfiguracoes,
      ...saved,
    };
  },

  saveConfiguracoes(configuracoes: ConfiguracoesSistema) {
    writeJson(CONFIG_KEY, configuracoes);
  },
};
