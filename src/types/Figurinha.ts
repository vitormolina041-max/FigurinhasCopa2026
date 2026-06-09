export type Figurinha = {
  id: string;
  numero: string;
  nome: string;
  pais: string;
  categoria: string;
  preco: number;
  quantidade: number;
  imagemUrl?: string;
  disponivel: boolean;
};

export type CartItem = {
  figurinhaId: string;
  quantidade: number;
};

export type SortKey = "nome" | "numero" | "pais" | "preco";

export type AvailabilityFilter = "todas" | "disponiveis" | "esgotadas";
