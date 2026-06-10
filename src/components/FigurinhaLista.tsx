import { Plus } from "lucide-react";
import type { Figurinha } from "../types/Figurinha";
import { formatCurrency } from "../utils/whatsapp";

type FigurinhaListaProps = {
  figurinhas: Figurinha[];
  pendingStockIds: Set<string>;
  onAddToCart: (figurinha: Figurinha) => void;
};

export function FigurinhaLista({ figurinhas, pendingStockIds, onAddToCart }: FigurinhaListaProps) {
  return (
    <section className="sticker-list" aria-label="Lista compacta de figurinhas">
      <div className="sticker-list-header" aria-hidden="true">
        <span>Número</span>
        <span>Nome</span>
        <span>País</span>
        <span>Categoria</span>
        <span>Preço</span>
        <span>Estoque</span>
        <span>Ação</span>
      </div>

      {figurinhas.map((figurinha) => {
        const isAvailable = figurinha.disponivel && figurinha.quantidade > 0;
        const isPending = pendingStockIds.has(figurinha.id);
        const title = figurinha.nome || figurinha.numero;

        return (
          <article className={isAvailable ? "sticker-list-row" : "sticker-list-row unavailable"} key={figurinha.id}>
            <span className="list-number">{figurinha.numero}</span>
            <strong>{title}</strong>
            <span>{figurinha.pais.trim() || "Sem país informado"}</span>
            <span>{figurinha.categoria}</span>
            <strong className="list-price">{formatCurrency(figurinha.preco)}</strong>
            <span className={isAvailable ? "stock-chip" : "stock-chip off"}>
              {isAvailable ? `${figurinha.quantidade} un.` : "Esgotada"}
            </span>
            <button
              className="primary-button compact-action"
              disabled={!isAvailable || isPending}
              onClick={() => onAddToCart(figurinha)}
              type="button"
            >
              <Plus size={16} aria-hidden="true" />
              Adicionar
            </button>
          </article>
        );
      })}
    </section>
  );
}
