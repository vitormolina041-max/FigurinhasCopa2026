import { Boxes, CircleSlash, Flag, PackageCheck, Trophy } from "lucide-react";
import type { Figurinha } from "../types/Figurinha";

type CatalogoResumoProps = {
  figurinhas: Figurinha[];
};

function getPais(figurinha: Figurinha) {
  return figurinha.pais.trim() || "Sem país informado";
}

export function CatalogoResumo({ figurinhas }: CatalogoResumoProps) {
  const total = figurinhas.length;
  const paises = new Set(figurinhas.map(getPais)).size;
  const disponiveis = figurinhas.filter((figurinha) => figurinha.disponivel && figurinha.quantidade > 0).length;
  const esgotadas = total - disponiveis;
  const estoque = figurinhas.reduce((sum, figurinha) => sum + figurinha.quantidade, 0);

  const items = [
    { label: "Figurinhas", value: total, icon: Boxes },
    { label: "Países/times", value: paises, icon: Flag },
    { label: "Disponíveis", value: disponiveis, icon: PackageCheck },
    { label: "Esgotadas", value: esgotadas, icon: CircleSlash },
    { label: "Em estoque", value: estoque, icon: Trophy },
  ];

  return (
    <section className="catalog-summary" aria-label="Resumo do catálogo">
      {items.map(({ label, value, icon: Icon }) => (
        <article className="summary-tile" key={label}>
          <Icon size={18} aria-hidden="true" />
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}
