import { Plus } from "lucide-react";
import type { Figurinha } from "../types/Figurinha";
import { formatCurrency } from "../utils/whatsapp";
import { HeaderPais } from "./HeaderPais";

type GrupoPaisFigurinhasProps = {
  color: string;
  expanded: boolean;
  figurinhas: Figurinha[];
  nome: string;
  pendingStockIds: Set<string>;
  onAddToCart: (figurinha: Figurinha) => void;
  onToggle: () => void;
};

export function GrupoPaisFigurinhas({
  color,
  expanded,
  figurinhas,
  nome,
  pendingStockIds,
  onAddToCart,
  onToggle,
}: GrupoPaisFigurinhasProps) {
  const disponiveis = figurinhas.filter((figurinha) => figurinha.disponivel && figurinha.quantidade > 0).length;
  const estoque = figurinhas.reduce((sum, figurinha) => sum + figurinha.quantidade, 0);

  return (
    <section className="country-group">
      <HeaderPais
        color={color}
        disponiveis={disponiveis}
        expanded={expanded}
        nome={nome}
        onToggle={onToggle}
        total={figurinhas.length}
        estoque={estoque}
      />

      {expanded ? (
        <div className="country-stickers">
          {figurinhas.map((figurinha) => {
            const isAvailable = figurinha.disponivel && figurinha.quantidade > 0;
            const isPending = pendingStockIds.has(figurinha.id);
            const title = figurinha.nome || figurinha.numero;

            return (
              <article className={isAvailable ? "country-sticker" : "country-sticker unavailable"} key={figurinha.id}>
                <div>
                  <span className="list-number">{figurinha.numero}</span>
                  <strong>{title}</strong>
                  <small>
                    {figurinha.categoria} · {formatCurrency(figurinha.preco)} ·{" "}
                    {isAvailable ? `${figurinha.quantidade} em estoque` : "Esgotada"}
                  </small>
                </div>
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
        </div>
      ) : null}
    </section>
  );
}
