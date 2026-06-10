import { useEffect, useState } from "react";
import { Flag, Plus, ShieldCheck, Trophy } from "lucide-react";
import type { Figurinha } from "../types/Figurinha";
import { formatCurrency } from "../utils/whatsapp";

type FigurinhaCardProps = {
  figurinha: Figurinha;
  isPending: boolean;
  onAddToCart: (figurinha: Figurinha) => void;
};

export function FigurinhaCard({ figurinha, isPending, onAddToCart }: FigurinhaCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const isAvailable = figurinha.disponivel && figurinha.quantidade > 0;
  const title = figurinha.nome || figurinha.numero;
  const pais = figurinha.pais.trim() || "Sem país informado";
  const showImage = Boolean(figurinha.imagemUrl) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [figurinha.imagemUrl]);

  return (
    <article className={isAvailable ? "sticker-card" : "sticker-card unavailable"}>
      <div className="sticker-image" aria-label={`Imagem da figurinha ${title}`}>
        {showImage ? (
          <img src={figurinha.imagemUrl} alt={title} onError={() => setImageFailed(true)} />
        ) : (
          <div className="sticker-placeholder">
            <Trophy size={34} aria-hidden="true" />
            <span>{figurinha.numero}</span>
          </div>
        )}
      </div>

      <div className="sticker-content">
        <div className="sticker-title-row">
          <div>
            <p className="sticker-number">{figurinha.numero}</p>
            <h2>{title}</h2>
          </div>
          <span className={isAvailable ? "status-pill" : "status-pill off"}>
            {isAvailable ? "Disponível" : "Esgotada"}
          </span>
        </div>

        <div className="sticker-meta">
          <span>
            <Flag size={14} aria-hidden="true" />
            {pais}
          </span>
          <span>{figurinha.categoria}</span>
          <span className={isAvailable ? "" : "muted-chip"}>
            <ShieldCheck size={15} aria-hidden="true" />
            {isAvailable ? `${figurinha.quantidade} em estoque` : "Sem estoque"}
          </span>
        </div>

        <div className="sticker-footer">
          <strong>{formatCurrency(figurinha.preco)}</strong>
          <button
            aria-label={isAvailable ? `Adicionar ${title} ao carrinho` : `${title} esgotada`}
            className="primary-button card-cart-button"
            disabled={!isAvailable || isPending}
            onClick={() => onAddToCart(figurinha)}
            type="button"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
