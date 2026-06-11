import { initialFigurinhas } from "../data/initialFigurinhas";
import type { CartItem, Figurinha } from "../types/Figurinha";
import type { ConfiguracoesSistema } from "../types/ConfiguracoesSistema";
import { sortFigurinhasByAlbum } from "../utils/figurinhaSorting";

const FIGURINHAS_KEY = "figurinhas-da-copa:figurinhas";
const CART_KEY = "figurinhas-da-copa:carrinho";
const CONFIG_KEY = "figurinhas-da-copa:configuracoes";

export const defaultConfiguracoes: ConfiguracoesSistema = {
  whatsapp: "14998496036",
  senhaAdmin: "admin123",
  nomeSite: "Figurinhas da Copa",
};

export function normalizeFigurinha(figurinha: Partial<Figurinha> | null | undefined): Figurinha {
  const source = figurinha && typeof figurinha === "object" ? figurinha : {};
  const quantidade = Math.max(0, Number(source.quantidade) || 0);
  return {
    id: String(source.id || crypto.randomUUID()),
    numero: String(source.numero ?? "").trim(),
    nome: String(source.nome ?? "").trim(),
    pais: String(source.pais ?? "").trim(),
    categoria: String(source.categoria ?? "").trim(),
    imagemUrl: String(source.imagemUrl ?? "").trim(),
    preco: Math.max(0, Number(source.preco) || 0),
    quantidade,
    disponivel: quantidade > 0,
  };
}

export function normalizeFigurinhas(figurinhas: unknown): Figurinha[] {
  if (!Array.isArray(figurinhas)) return [];

  return sortFigurinhasByAlbum(
    figurinhas
      .map((figurinha) => normalizeFigurinha(figurinha as Partial<Figurinha>))
      .filter((figurinha) => figurinha.id && figurinha.numero),
  );
}

function normalizeCart(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];

  const byFigurinhaId = new Map<string, number>();
  items.forEach((item) => {
    const figurinhaId = String((item as Partial<CartItem> | null)?.figurinhaId ?? "");
    const quantidade = Math.max(0, Math.floor(Number((item as Partial<CartItem> | null)?.quantidade) || 0));
    if (!figurinhaId || quantidade <= 0) return;
    byFigurinhaId.set(figurinhaId, (byFigurinhaId.get(figurinhaId) ?? 0) + quantidade);
  });

  return Array.from(byFigurinhaId.entries()).map(([figurinhaId, quantidade]) => ({
    figurinhaId,
    quantidade,
  }));
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
    if (Array.isArray(saved)) return normalizeFigurinhas(saved);

    const normalizedInitial = normalizeFigurinhas(initialFigurinhas);
    writeJson(FIGURINHAS_KEY, normalizedInitial);
    return normalizedInitial;
  },

  saveFigurinhas(figurinhas: Figurinha[]) {
    writeJson(FIGURINHAS_KEY, normalizeFigurinhas(figurinhas));
  },

  getCart(): CartItem[] {
    const saved = readJson<CartItem[]>(CART_KEY, []);
    return normalizeCart(saved);
  },

  saveCart(items: CartItem[]) {
    writeJson(CART_KEY, normalizeCart(items));
  },

  clearCart() {
    localStorage.removeItem(CART_KEY);
  },

  getConfiguracoes(): ConfiguracoesSistema {
    const saved = readJson<ConfiguracoesSistema | null>(CONFIG_KEY, null);
    return {
      ...defaultConfiguracoes,
      ...(saved && typeof saved === "object" ? saved : {}),
    };
  },

  saveConfiguracoes(configuracoes: ConfiguracoesSistema) {
    writeJson(CONFIG_KEY, configuracoes);
  },
};
