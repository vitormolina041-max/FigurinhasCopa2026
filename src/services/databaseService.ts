import type { ConfiguracoesSistema } from "../types/ConfiguracoesSistema";
import type { Figurinha } from "../types/Figurinha";
import { defaultConfiguracoes, normalizeFigurinha, normalizeFigurinhas } from "./storageService";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

type FigurinhaRow = {
  id: string;
  numero: string;
  nome: string;
  pais: string;
  categoria: string;
  preco: number | string;
  quantidade: number;
  imagem_url: string | null;
  disponivel: boolean;
};

type ConfiguracoesRow = {
  whatsapp: string;
  senha_admin: string;
  nome_site: string;
};

function ensureSupabase() {
  if (!supabase) throw new Error("Supabase não configurado.");
  return supabase;
}

function fromFigurinhaRow(row: FigurinhaRow): Figurinha {
  return normalizeFigurinha({
    id: row.id,
    numero: row.numero,
    nome: row.nome,
    pais: row.pais,
    categoria: row.categoria,
    preco: Number(row.preco),
    quantidade: row.quantidade,
    imagemUrl: row.imagem_url ?? "",
    disponivel: row.disponivel,
  });
}

function toFigurinhaRow(figurinha: Figurinha) {
  const normalized = normalizeFigurinha(figurinha);
  return {
    id: normalized.id,
    numero: normalized.numero,
    nome: normalized.nome,
    pais: normalized.pais,
    categoria: normalized.categoria,
    preco: normalized.preco,
    quantidade: normalized.quantidade,
    imagem_url: normalized.imagemUrl || null,
  };
}

function fromConfiguracoesRow(row: ConfiguracoesRow): ConfiguracoesSistema {
  return {
    whatsapp: row.whatsapp,
    senhaAdmin: row.senha_admin,
    nomeSite: row.nome_site,
  };
}

function toConfiguracoesRow(configuracoes: ConfiguracoesSistema) {
  return {
    id: "default",
    whatsapp: configuracoes.whatsapp,
    senha_admin: configuracoes.senhaAdmin,
    nome_site: configuracoes.nomeSite,
  };
}

export const databaseService = {
  isEnabled: isSupabaseConfigured,

  async getFigurinhas() {
    const client = ensureSupabase();
    const { data, error } = await client
      .from("figurinhas")
      .select("id, numero, nome, pais, categoria, preco, quantidade, imagem_url, disponivel")
      .order("numero", { ascending: true });

    if (error) throw error;
    return normalizeFigurinhas((data ?? []).map((row) => fromFigurinhaRow(row as FigurinhaRow)));
  },

  async saveFigurinhas(figurinhas: Figurinha[]) {
    const client = ensureSupabase();
    const normalized = normalizeFigurinhas(figurinhas);
    if (normalized.length === 0) {
      const { error: deleteError } = await client.from("figurinhas").delete().neq("id", crypto.randomUUID());
      if (deleteError) throw deleteError;
      return;
    }

    const { error } = await client.from("figurinhas").upsert(normalized.map(toFigurinhaRow), {
      onConflict: "id",
    });

    if (error) throw error;

    const ids = normalized.map((figurinha) => figurinha.id);
    const { error: deleteError } = await client.from("figurinhas").delete().not("id", "in", `(${ids.join(",")})`);
    if (deleteError) throw deleteError;
  },

  async deleteFigurinha(id: string) {
    const client = ensureSupabase();
    const { error } = await client.from("figurinhas").delete().eq("id", id);
    if (error) throw error;
  },

  async adjustFigurinhaStock(id: string, delta: number) {
    const client = ensureSupabase();
    const { data, error } = await client
      .rpc("ajustar_estoque_figurinha", { p_id: id, p_delta: delta })
      .maybeSingle();

    if (error) throw error;
    return data ? fromFigurinhaRow(data as FigurinhaRow) : null;
  },

  async getConfiguracoes() {
    const client = ensureSupabase();
    const { data, error } = await client
      .from("configuracoes_sistema")
      .select("whatsapp, senha_admin, nome_site")
      .eq("id", "default")
      .maybeSingle();

    if (error) throw error;
    return data ? fromConfiguracoesRow(data as ConfiguracoesRow) : defaultConfiguracoes;
  },

  async saveConfiguracoes(configuracoes: ConfiguracoesSistema) {
    const client = ensureSupabase();
    const { error } = await client
      .from("configuracoes_sistema")
      .upsert(toConfiguracoesRow(configuracoes), { onConflict: "id" });

    if (error) throw error;
  },
};
