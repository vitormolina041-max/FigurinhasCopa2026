import { useEffect, useState } from "react";
import type { CartItem, Figurinha } from "../types/Figurinha";
import type { ConfiguracoesSistema } from "../types/ConfiguracoesSistema";
import { storageService } from "../services/storageService";
import { databaseService } from "../services/databaseService";

export function useFigurinhasState() {
  const [figurinhas, setFigurinhas] = useState<Figurinha[]>(() =>
    databaseService.isEnabled ? [] : storageService.getFigurinhas(),
  );
  const [remoteReady, setRemoteReady] = useState(!databaseService.isEnabled);

  useEffect(() => {
    if (!databaseService.isEnabled) return;

    let isMounted = true;
    databaseService
      .getFigurinhas()
      .then((remoteFigurinhas) => {
        if (!isMounted) return;
        setFigurinhas(remoteFigurinhas);
      })
      .catch((error) => {
        console.error("Erro ao carregar figurinhas do Supabase", error);
      })
      .finally(() => {
        if (isMounted) setRemoteReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!remoteReady) return;
    if (!databaseService.isEnabled) {
      storageService.saveFigurinhas(figurinhas);
    }
  }, [figurinhas, remoteReady]);

  return [figurinhas, setFigurinhas] as const;
}

export function useCartState() {
  const [cart, setCart] = useState<CartItem[]>(() => storageService.getCart());

  useEffect(() => {
    storageService.saveCart(cart);
  }, [cart]);

  return [cart, setCart] as const;
}

export function useConfiguracoesState() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesSistema>(() =>
    storageService.getConfiguracoes(),
  );
  const [remoteReady, setRemoteReady] = useState(!databaseService.isEnabled);

  useEffect(() => {
    if (!databaseService.isEnabled) return;

    let isMounted = true;
    databaseService
      .getConfiguracoes()
      .then((remoteConfiguracoes) => {
        if (isMounted) setConfiguracoes(remoteConfiguracoes);
      })
      .catch((error) => {
        console.error("Erro ao carregar configurações do Supabase", error);
      })
      .finally(() => {
        if (isMounted) setRemoteReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!remoteReady) return;
    storageService.saveConfiguracoes(configuracoes);
  }, [configuracoes, remoteReady]);

  return [configuracoes, setConfiguracoes] as const;
}
