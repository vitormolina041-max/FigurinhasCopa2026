import type { AvailabilityFilter, SortKey } from "../types/Figurinha";

type FiltrosCatalogoProps = {
  busca: string;
  pais: string;
  categoria: string;
  disponibilidade: AvailabilityFilter;
  ordenacao: SortKey;
  paises: string[];
  categorias: string[];
  onBuscaChange: (value: string) => void;
  onPaisChange: (value: string) => void;
  onCategoriaChange: (value: string) => void;
  onDisponibilidadeChange: (value: AvailabilityFilter) => void;
  onOrdenacaoChange: (value: SortKey) => void;
};

export function FiltrosCatalogo({
  busca,
  pais,
  categoria,
  disponibilidade,
  ordenacao,
  paises,
  categorias,
  onBuscaChange,
  onPaisChange,
  onCategoriaChange,
  onDisponibilidadeChange,
  onOrdenacaoChange,
}: FiltrosCatalogoProps) {
  return (
    <details className="filters-panel" open>
      <summary>Filtros</summary>
      <section className="filters" aria-label="Filtros do catálogo">
        <label>
          Busca
          <input
            value={busca}
            onChange={(event) => onBuscaChange(event.target.value)}
            placeholder="Nome ou número"
          />
        </label>

        <label>
          País
          <select value={pais} onChange={(event) => onPaisChange(event.target.value)}>
            <option value="">Todos</option>
            {paises.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Categoria
          <select value={categoria} onChange={(event) => onCategoriaChange(event.target.value)}>
            <option value="">Todas</option>
            {categorias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Disponibilidade
          <select
            value={disponibilidade}
            onChange={(event) => onDisponibilidadeChange(event.target.value as AvailabilityFilter)}
          >
            <option value="todas">Todas</option>
            <option value="disponiveis">Disponíveis</option>
            <option value="esgotadas">Esgotadas</option>
          </select>
        </label>

        <label>
          Ordenar por
          <select value={ordenacao} onChange={(event) => onOrdenacaoChange(event.target.value as SortKey)}>
            <option value="numero">Número</option>
            <option value="nome">Nome</option>
            <option value="pais">País</option>
            <option value="preco">Preço</option>
          </select>
        </label>
      </section>
    </details>
  );
}
