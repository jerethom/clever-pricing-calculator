import { Icons } from "@/components/ui";

interface PaintToolbarProps {
  paintValue: number;
  onChange: (value: number) => void;
  maxValue: number;
  onReset: () => void;
}

export function PaintToolbar({
  paintValue,
  onChange,
  maxValue,
  onReset,
}: PaintToolbarProps) {
  // Générer les options : 0 (effacer) + 1 à maxValue
  const options = Array.from({ length: maxValue + 1 }, (_, i) => i);

  return (
    <div className="bg-base-200 border border-base-300 p-3">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Label explicatif */}
        <div className="flex items-center gap-2 text-sm font-medium text-base-content/80">
          <Icons.Edit className="w-4 h-4" />
          <span>Pinceau</span>
        </div>

        {/* Sélecteur de valeur visuel */}
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Valeur du pinceau"
        >
          {options.map((value) => {
            const isSelected = paintValue === value;
            const isEraser = value === 0;

            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChange(value)}
                className={`
                  relative flex items-center justify-center
                  w-10 h-10 border-2 transition-all cursor-pointer
                  font-bold text-sm
                  ${
                    isSelected
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-base-300 bg-base-100 hover:border-primary/50"
                  }
                  ${isEraser && !isSelected ? "bg-base-200" : ""}
                `}
                title={
                  isEraser
                    ? "Effacer (0 instance)"
                    : `+${value} instance${value > 1 ? "s" : ""}`
                }
              >
                {isEraser ? (
                  <Icons.X className="w-4 h-4 text-error" />
                ) : (
                  <span>+{value}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Séparateur */}
        <div className="w-px h-8 bg-base-300" />

        {/* Bouton reset */}
        <button
          type="button"
          onClick={onReset}
          className="btn btn-ghost btn-sm gap-2"
        >
          <Icons.Trash className="w-4 h-4" />
          <span className="hidden sm:inline">Tout effacer</span>
        </button>
      </div>

      {/* Indication du mode actif */}
      <div className="mt-2 text-xs text-base-content/60">
        {paintValue === 0 ? (
          <span className="text-error">
            Mode effacement : cliquez pour supprimer les instances
            supplémentaires
          </span>
        ) : (
          <span>
            Cliquez et glissez pour ajouter <strong>+{paintValue}</strong>{" "}
            instance{paintValue > 1 ? "s" : ""} aux créneaux
          </span>
        )}
      </div>
    </div>
  );
}
