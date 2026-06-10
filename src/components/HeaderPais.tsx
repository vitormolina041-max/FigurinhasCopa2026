import { ChevronDown, Shield } from "lucide-react";
import type { CSSProperties } from "react";

type HeaderPaisProps = {
  color: string;
  disponiveis: number;
  expanded: boolean;
  nome: string;
  onToggle: () => void;
  total: number;
  estoque: number;
};

export function HeaderPais({ color, disponiveis, expanded, nome, onToggle, total, estoque }: HeaderPaisProps) {
  const esgotado = disponiveis === 0;

  return (
    <button
      className="country-header"
      onClick={onToggle}
      style={{ "--country-color": color } as CSSProperties}
      type="button"
    >
      <span className="country-emblem">
        <Shield size={20} aria-hidden="true" />
      </span>
      <span className="country-title">
        <strong>{nome}</strong>
        <small>
          {disponiveis} disponíveis de {total} figurinhas · {estoque} em estoque
        </small>
      </span>
      {esgotado ? <span className="soldout-badge">Tudo esgotado</span> : null}
      <ChevronDown className={expanded ? "chevron open" : "chevron"} size={20} aria-hidden="true" />
    </button>
  );
}
