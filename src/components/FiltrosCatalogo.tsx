import type { SortKey } from "../types/Figurinha";

type FiltrosCatalogoProps = {
  busca: string;
  pais: string;
  categoria: string;
  ordenacao: SortKey;
  paises: string[];
  categorias: string[];
  onBuscaChange: (value: string) => void;
  onPaisChange: (value: string) => void;
  onCategoriaChange: (value: string) => void;
  onOrdenacaoChange: (value: SortKey) => void;
};

export function FiltrosCatalogo({
  busca,
  pais,
  categoria,
  ordenacao,
  paises,
  categorias,
  onBuscaChange,
  onPaisChange,
  onCategoriaChange,
  onOrdenacaoChange,
}: FiltrosCatalogoProps) {
  return (
    <details className="filters-panel" open>
      <summary>Filtros</summary>
      <section className="filters" aria-label="Filtros do cat\u00e1logo">
        <label>
          Busca
          <input
            value={busca}
            onChange={(event) => onBuscaChange(event.target.value)}
            placeholder="Nome ou n\u00famero"
          />
        </label>

        <label>
          Pa\u00eds
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
          Ordenar por
          <select value={ordenacao} onChange={(event) => onOrdenacaoChange(event.target.value as SortKey)}>
            <option value="numero">N\u00famero</option>
            <option value="nome">Nome</option>
            <option value="pais">Pa\u00eds</option>
            <option value="preco">Pre\u00e7o</option>
          </select>
        </label>
      </section>
    </details>
  );
}
