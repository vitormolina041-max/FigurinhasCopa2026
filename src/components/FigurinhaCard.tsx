import { Plus, ShieldCheck } from "lucide-react";
import type { Figurinha } from "../types/Figurinha";
import { formatCurrency } from "../utils/whatsapp";

type FigurinhaCardProps = {
  figurinha: Figurinha;
  onAddToCart: (figurinha: Figurinha) => void;
};

export function FigurinhaCard({ figurinha, onAddToCart }: FigurinhaCardProps) {
  const isAvailable = figurinha.disponivel && figurinha.quantidade > 0;

  return (
    <article className={isAvailable ? "sticker-card" : "sticker-card unavailable"}>
      <div className="sticker-image" aria-label={`Imagem da figurinha ${figurinha.nome}`}>
        {figurinha.imagemUrl ? (
          <img src={figurinha.imagemUrl} alt={figurinha.nome} />
        ) : (
          <span>{figurinha.numero}</span>
        )}
      </div>

      <div className="sticker-content">
        <div className="sticker-title-row">
          <div>
            <p className="sticker-number">{figurinha.numero}</p>
            <h2>{figurinha.nome}</h2>
          </div>
          <span className={isAvailable ? "status-pill" : "status-pill off"}>
            {isAvailable ? "Disponível" : "Esgotada"}
          </span>
        </div>

        <div className="sticker-meta">
          <span>{figurinha.pais}</span>
          <span>{figurinha.categoria}</span>
          <span>
            <ShieldCheck size={15} aria-hidden="true" />
            {figurinha.quantidade} em estoque
          </span>
        </div>

        <div className="sticker-footer">
          <strong>{formatCurrency(figurinha.preco)}</strong>
          <button
            className="primary-button"
            disabled={!isAvailable}
            onClick={() => onAddToCart(figurinha)}
            type="button"
          >
            <Plus size={18} aria-hidden="true" />
            {isAvailable ? "Adicionar" : "Esgotada"}
          </button>
        </div>
      </div>
    </article>
  );
}
