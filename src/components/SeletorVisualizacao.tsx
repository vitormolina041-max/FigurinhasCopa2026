import { Grid2X2, List, Rows3 } from "lucide-react";

export type CatalogViewMode = "cards" | "lista" | "pais";

type SeletorVisualizacaoProps = {
  mode: CatalogViewMode;
  onModeChange: (mode: CatalogViewMode) => void;
};

const options = [
  { value: "cards", label: "Cards", icon: Grid2X2 },
  { value: "lista", label: "Lista compacta", icon: List },
  { value: "pais", label: "Por país/time", icon: Rows3 },
] satisfies Array<{ value: CatalogViewMode; label: string; icon: typeof Grid2X2 }>;

export function SeletorVisualizacao({ mode, onModeChange }: SeletorVisualizacaoProps) {
  return (
    <div className="view-switcher" role="group" aria-label="Modo de visualização">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          className={mode === value ? "view-option active" : "view-option"}
          key={value}
          onClick={() => onModeChange(value)}
          type="button"
        >
          <Icon size={17} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
