import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { Carrinho } from "./components/Carrinho";
import { Catalogo } from "./pages/Catalogo";
import { Admin } from "./pages/Admin";
import { useCartState, useConfiguracoesState, useFigurinhasState } from "./hooks/useLocalState";
import type { Figurinha } from "./types/Figurinha";
import { databaseService } from "./services/databaseService";
import { normalizeFigurinha } from "./services/storageService";

function getCurrentPath() {
  return window.location.pathname === "/admin" || window.location.pathname === "/cart"
    ? window.location.pathname
    : "/";
}

export default function App() {
  const [figurinhas, setFigurinhas] = useFigurinhasState();
  const [cart, setCart] = useCartState();
  const [configuracoes, setConfiguracoes] = useConfiguracoesState();
  const [path, setPath] = useState(getCurrentPath);
  const [notice, setNotice] = useState("");
  const [pendingStockIds, setPendingStockIds] = useState<Set<string>>(() => new Set());
  const pendingStockIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (window.location.search.includes("resetLocal=1")) {
      localStorage.removeItem("figurinhas-da-copa:figurinhas");
      localStorage.removeItem("figurinhas-da-copa:carrinho");
      sessionStorage.removeItem("figurinhas-admin");
      window.history.replaceState({}, "", window.location.pathname);
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (!databaseService.isEnabled) return;

    const resetKey = "figurinhas-da-copa:supabase-cache-reset-v1";
    if (localStorage.getItem(resetKey)) return;

    localStorage.removeItem("figurinhas-da-copa:figurinhas");
    localStorage.removeItem("figurinhas-da-copa:carrinho");
    sessionStorage.removeItem("figurinhas-admin");
    localStorage.setItem(resetKey, "true");
    setCart([]);
  }, [setCart]);

  useEffect(() => {
    const handlePopState = () => setPath(getCurrentPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const figurinhaIds = new Set(figurinhas.map((figurinha) => figurinha.id));
    const validCart = cart.filter((item) => figurinhaIds.has(item.figurinhaId) && item.quantidade > 0);

    if (validCart.length !== cart.length) {
      setCart(validCart);
    }
  }, [cart, figurinhas, setCart]);

  const cartCount = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const exists = figurinhas.some((figurinha) => figurinha.id === item.figurinhaId);
        return exists ? sum + item.quantidade : sum;
      }, 0),
    [cart, figurinhas],
  );

  function navigate(nextPath: string) {
    window.history.pushState({}, "", nextPath);
    setPath(getCurrentPath());
    setNotice("");
  }

  function replaceFigurinha(updatedFigurinha: Figurinha) {
    setFigurinhas((current) =>
      current.map((figurinha) => (figurinha.id === updatedFigurinha.id ? updatedFigurinha : figurinha)),
    );
  }

  function updateStockLocal(figurinhaId: string, delta: number) {
    setFigurinhas((current) =>
      current.map((figurinha) =>
        figurinha.id === figurinhaId
          ? normalizeFigurinha({ ...figurinha, quantidade: figurinha.quantidade + delta })
          : figurinha,
      ),
    );
  }

  async function reserveStock(figurinha: Figurinha, amount: number) {
    if (databaseService.isEnabled) {
      const updated = await databaseService.adjustFigurinhaStock(figurinha.id, -amount);
      if (!updated) return null;
      replaceFigurinha(updated);
      return updated;
    }

    updateStockLocal(figurinha.id, -amount);
    return normalizeFigurinha({ ...figurinha, quantidade: figurinha.quantidade - amount });
  }

  async function releaseStock(figurinhaId: string, amount: number) {
    if (databaseService.isEnabled) {
      const updated = await databaseService.adjustFigurinhaStock(figurinhaId, amount);
      if (updated) replaceFigurinha(updated);
      return;
    }

    updateStockLocal(figurinhaId, amount);
  }

  function markStockPending(figurinhaId: string) {
    pendingStockIdsRef.current.add(figurinhaId);
    setPendingStockIds(new Set(pendingStockIdsRef.current));
  }

  function clearStockPending(figurinhaId: string) {
    pendingStockIdsRef.current.delete(figurinhaId);
    setPendingStockIds(new Set(pendingStockIdsRef.current));
  }

  async function addToCart(figurinha: Figurinha) {
    if (pendingStockIdsRef.current.has(figurinha.id)) return;

    if (figurinha.quantidade <= 0) {
      setNotice(`${figurinha.numero} está esgotada.`);
      return;
    }

    markStockPending(figurinha.id);

    try {
      const updated = await reserveStock(figurinha, 1);
      if (!updated) {
        setNotice(`${figurinha.numero} acabou de esgotar.`);
        return;
      }

      setNotice(`${figurinha.numero} adicionada ao carrinho.`);
      setCart((current) => {
        const existing = current.find((item) => item.figurinhaId === figurinha.id);
        if (!existing) return [{ figurinhaId: figurinha.id, quantidade: 1 }, ...current];

        return current.map((item) =>
          item.figurinhaId === figurinha.id ? { ...item, quantidade: item.quantidade + 1 } : item,
        );
      });
    } catch (error) {
      console.error("Erro ao reservar estoque", error);
      setNotice("Não foi possível adicionar a figurinha agora. Tente novamente.");
    } finally {
      clearStockPending(figurinha.id);
    }
  }

  async function updateQuantity(figurinhaId: string, quantity: number) {
    if (pendingStockIdsRef.current.has(figurinhaId)) return;

    const figurinha = figurinhas.find((item) => item.id === figurinhaId);
    if (!figurinha) return;

    const cartItem = cart.find((item) => item.figurinhaId === figurinhaId);
    if (!cartItem) return;

    const difference = quantity - cartItem.quantidade;
    if (quantity <= 0) {
      await removeFromCart(figurinhaId);
      return;
    }

    if (difference > 0 && figurinha.quantidade < difference) {
      setNotice(`Estoque disponível para ${figurinha.numero}: ${figurinha.quantidade}.`);
      return;
    }

    markStockPending(figurinhaId);

    try {
      if (difference > 0) {
        const updated = await reserveStock(figurinha, difference);
        if (!updated) {
          setNotice(`${figurinha.numero} não possui estoque suficiente.`);
          return;
        }
      } else if (difference < 0) {
        await releaseStock(figurinhaId, Math.abs(difference));
      }

      setNotice("");
      setCart((current) =>
        current.map((item) =>
          item.figurinhaId === figurinhaId ? { ...item, quantidade: quantity } : item,
        ),
      );
    } catch (error) {
      console.error("Erro ao atualizar quantidade", error);
      setNotice("Não foi possível atualizar o carrinho agora. Tente novamente.");
    } finally {
      clearStockPending(figurinhaId);
    }
  }

  async function removeFromCart(figurinhaId: string) {
    if (pendingStockIdsRef.current.has(figurinhaId)) return;

    const cartItem = cart.find((item) => item.figurinhaId === figurinhaId);
    if (!cartItem) return;

    markStockPending(figurinhaId);

    try {
      await releaseStock(figurinhaId, cartItem.quantidade);
      setNotice("");
      setCart((current) => current.filter((item) => item.figurinhaId !== figurinhaId));
    } catch (error) {
      console.error("Erro ao remover item do carrinho", error);
      setNotice("Não foi possível remover o item agora. Tente novamente.");
    } finally {
      clearStockPending(figurinhaId);
    }
  }

  return (
    <>
      <Header currentPath={path} cartCount={cartCount} siteName={configuracoes.nomeSite} onNavigate={navigate} />
      {path === "/admin" ? (
        <Admin
          configuracoes={configuracoes}
          figurinhas={figurinhas}
          setConfiguracoes={setConfiguracoes}
          setFigurinhas={setFigurinhas}
        />
      ) : path === "/cart" ? (
        <Carrinho
          cart={cart}
          figurinhas={figurinhas}
          notice={notice}
          whatsapp={configuracoes.whatsapp}
          pendingStockIds={pendingStockIds}
          setNotice={setNotice}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
        />
      ) : (
        <Catalogo
          figurinhas={figurinhas}
          notice={notice}
          pendingStockIds={pendingStockIds}
          onAddToCart={addToCart}
        />
      )}
    </>
  );
}
