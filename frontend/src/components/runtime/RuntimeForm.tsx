import { memo, useState } from "react";
import type { Instance, InstanceFlavor } from "@/api/types";
import { Icons, ModalBase, NumberInput } from "@/components/ui";
import { useInstances } from "@/hooks/useInstances";
import { formatHourlyPrice, formatMonthlyPrice } from "@/lib/costCalculator";
import { useProjectAction } from "@/store";

const HOURS_PER_MONTH = 720; // 30j × 24h (standard Clever Cloud)

interface RuntimeFormProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
}

type Step = "runtime" | "flavor" | "scaling";

const STEPS: { id: Step; label: string; shortLabel: string }[] = [
  { id: "runtime", label: "Choisir le runtime", shortLabel: "Runtime" },
  { id: "flavor", label: "Configurer la taille", shortLabel: "Taille" },
  { id: "scaling", label: "Nombre d'instances", shortLabel: "Instances" },
];

const RuntimeForm = memo(function RuntimeForm({
  isOpen,
  projectId,
  onClose,
}: RuntimeFormProps) {
  const { data: instances, isLoading } = useInstances();
  const addRuntime = useProjectAction("addRuntime");

  const [currentStep, setCurrentStep] = useState<Step>("runtime");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [instanceCount, setInstanceCount] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedInstance = instances?.find(
    (i) => i.variant.id === selectedVariantId,
  );
  const selectedFlavorData = selectedInstance?.flavors.find(
    (f) => f.name === selectedFlavor,
  );

  // Grouper les instances par type de deploiement
  const groupedInstances = instances
    ? instances.reduce(
        (acc, instance) => {
          const deployType = instance.variant.deployType;
          if (!acc[deployType]) acc[deployType] = [];
          acc[deployType].push(instance);
          return acc;
        },
        {} as Record<string, Instance[]>,
      )
    : null;

  // Filtrer les instances par recherche
  const filteredGroups = (() => {
    if (!groupedInstances) return null;
    if (!searchQuery.trim()) return groupedInstances;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, Instance[]> = {};

    Object.entries(groupedInstances).forEach(([deployType, group]) => {
      const matches = group.filter(
        (instance) =>
          instance.name.toLowerCase().includes(query) ||
          instance.variant.name.toLowerCase().includes(query) ||
          instance.type.toLowerCase().includes(query),
      );
      if (matches.length > 0) {
        filtered[deployType] = matches;
      }
    });

    return filtered;
  })();

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
    const instance = instances?.find((i) => i.variant.id === variantId);
    if (instance) {
      setSelectedFlavor(instance.defaultFlavor.name);
    }
    setCurrentStep("flavor");
  };

  const handleFlavorSelect = (flavorName: string) => {
    setSelectedFlavor(flavorName);
    setCurrentStep("scaling");
  };

  const handleSubmit = () => {
    if (!selectedInstance) return;

    // Créer en mode fixe (sans scaling) - le scaling sera configuré après
    addRuntime(projectId, {
      instanceType: selectedInstance.type,
      instanceName: selectedInstance.name,
      variantLogo: selectedInstance.variant.logo,
      scalingEnabled: false,
      baselineConfig: {
        instances: instanceCount,
        flavorName: selectedFlavor,
      },
      scalingProfiles: [],
      weeklySchedule: undefined,
    });

    onClose();
  };

  const goToStep = (step: Step) => {
    // Only allow going to steps that are "unlocked"
    if (step === "runtime") {
      setCurrentStep(step);
    } else if (step === "flavor" && selectedVariantId) {
      setCurrentStep(step);
    } else if (step === "scaling" && selectedVariantId && selectedFlavor) {
      setCurrentStep(step);
    }
  };

  const goNext = () => {
    if (currentStep === "runtime" && selectedVariantId) {
      setCurrentStep("flavor");
    } else if (currentStep === "flavor" && selectedFlavor) {
      setCurrentStep("scaling");
    }
  };

  const goBack = () => {
    if (currentStep === "flavor") {
      setCurrentStep("runtime");
    } else if (currentStep === "scaling") {
      setCurrentStep("flavor");
    }
  };

  // Calcul du cout estimatif
  const estimatedCost = selectedFlavorData
    ? selectedFlavorData.price * HOURS_PER_MONTH * instanceCount
    : null;

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      className="max-h-[90vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300">
        <div>
          <h2 className="text-lg sm:text-xl font-bold">Ajouter un runtime</h2>
          <p className="text-sm text-base-content/60 mt-0.5 hidden sm:block">
            {STEPS[currentStepIndex].label}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square"
          onClick={onClose}
          aria-label="Fermer"
        >
          <Icons.X className="w-5 h-5" />
        </button>
      </div>

      {/* Stepper */}
      <div className="px-4 sm:px-6 py-3 bg-base-200 border-b border-base-300">
        <ul className="steps steps-horizontal w-full">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isClickable =
              index === 0 ||
              (index === 1 && selectedVariantId) ||
              (index === 2 && selectedVariantId && selectedFlavor);

            return (
              <li
                key={step.id}
                className={`step transition-colors ${
                  isCompleted || isCurrent ? "step-primary" : ""
                } ${isClickable ? "cursor-pointer hover:text-primary" : "opacity-50 cursor-not-allowed"}`}
                onClick={() => isClickable && goToStep(step.id)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && isClickable) {
                    e.preventDefault();
                    goToStep(step.id);
                  }
                }}
                data-content={isCompleted ? "\u2713" : index + 1}
              >
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden text-xs">{step.shortLabel}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-4 text-base-content/60">
              Chargement des runtimes...
            </p>
          </div>
        ) : (
          <>
            {/* Step 1: Runtime Selection */}
            {currentStep === "runtime" && (
              <div className="space-y-4">
                {/* Search */}
                <div className="form-control">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher un runtime..."
                      className="input input-bordered w-full pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Runtime Grid */}
                {filteredGroups && Object.entries(filteredGroups).length > 0 ? (
                  Object.entries(filteredGroups).map(([deployType, group]) => (
                    <div key={deployType}>
                      <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3">
                        {deployType}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                        {group.map((instance) => (
                          <RuntimeCard
                            key={instance.variant.id}
                            instance={instance}
                            isSelected={
                              selectedVariantId === instance.variant.id
                            }
                            onClick={() =>
                              handleVariantSelect(instance.variant.id)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-base-content/60">
                    <Icons.Server className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Aucun runtime trouve pour "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Flavor Selection */}
            {currentStep === "flavor" && selectedInstance && (
              <div className="space-y-6">
                {/* Selected Runtime Preview */}
                <div className="flex items-center gap-4 p-4 bg-base-200 border border-base-300">
                  {selectedInstance.variant.logo && (
                    <img
                      src={selectedInstance.variant.logo}
                      alt=""
                      className="w-12 h-12 object-contain"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">
                      {selectedInstance.name}
                    </h3>
                    <p className="text-sm text-base-content/60 truncate">
                      {selectedInstance.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setCurrentStep("runtime")}
                  >
                    Modifier
                  </button>
                </div>

                {/* Flavor Grid */}
                <div>
                  <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3">
                    Choisir une configuration
                  </h3>
                  <div className="grid gap-2">
                    {selectedInstance.flavors
                      .filter((f) => f.available)
                      .map((flavor) => (
                        <FlavorCard
                          key={flavor.name}
                          flavor={flavor}
                          isSelected={selectedFlavor === flavor.name}
                          isDefault={
                            selectedInstance.defaultFlavor.name === flavor.name
                          }
                          maxCpus={Math.max(
                            ...selectedInstance.flavors.map((f) => f.cpus),
                          )}
                          onClick={() => handleFlavorSelect(flavor.name)}
                        />
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Instance Count */}
            {currentStep === "scaling" &&
              selectedInstance &&
              selectedFlavorData && (
                <div className="space-y-6">
                  {/* Selected Runtime + Flavor Preview */}
                  <div className="flex items-center gap-4 p-4 bg-base-200 border border-base-300">
                    {selectedInstance.variant.logo && (
                      <img
                        src={selectedInstance.variant.logo}
                        alt=""
                        className="w-10 h-10 object-contain"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">
                        {selectedInstance.name}
                      </h3>
                      <p className="text-sm text-base-content/60">
                        {selectedFlavor} - {selectedFlavorData.memory.formatted}{" "}
                        / {selectedFlavorData.cpus} vCPU
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setCurrentStep("flavor")}
                    >
                      Modifier
                    </button>
                  </div>

                  {/* Instance Count Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider">
                      Nombre d'instances
                    </h3>

                    {/* Visual Instance Representation */}
                    <div className="p-4 bg-base-200 border border-base-300">
                      {/* Instance Blocks Visualization */}
                      <div className="flex items-center gap-1 mb-4">
                        {Array.from({
                          length: Math.min(instanceCount, 12),
                        }).map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 h-10 bg-primary text-primary-content transition-all duration-200 flex items-center justify-center text-sm font-bold"
                          >
                            {i + 1}
                          </div>
                        ))}
                        {instanceCount > 12 && (
                          <span className="text-sm text-base-content/50 ml-2">
                            +{instanceCount - 12}
                          </span>
                        )}
                      </div>

                      {/* Instance Count Control */}
                      <div className="flex items-center justify-center">
                        <NumberInput
                          label=""
                          value={instanceCount}
                          onChange={setInstanceCount}
                          min={1}
                          max={selectedInstance.maxInstances}
                          size="lg"
                        />
                      </div>
                    </div>

                    <p className="text-sm text-base-content/60 text-center">
                      Vous pourrez activer le scaling automatique après la
                      création du runtime.
                    </p>
                  </div>

                  {/* Cost Estimation */}
                  {estimatedCost !== null && (
                    <div className="p-4 bg-primary/5 border border-primary/20">
                      <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3">
                        Estimation mensuelle
                      </h3>
                      <div>
                        <p className="text-3xl font-bold text-primary">
                          {formatMonthlyPrice(estimatedCost)}
                        </p>
                        <p className="text-sm text-base-content/60 mt-1">
                          {instanceCount} instance
                          {instanceCount > 1 ? "s" : ""} ×{" "}
                          {formatHourlyPrice(selectedFlavorData.price)}/h × 720h
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 p-4 sm:p-6 bg-base-200 border-t border-base-300">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={currentStep === "runtime" ? onClose : goBack}
        >
          {currentStep === "runtime" ? "Annuler" : "Retour"}
        </button>

        <div className="flex items-center gap-2">
          {currentStep !== "scaling" ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={goNext}
              disabled={
                (currentStep === "runtime" && !selectedVariantId) ||
                (currentStep === "flavor" && !selectedFlavor)
              }
            >
              Continuer
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!selectedVariantId || !selectedFlavor}
            >
              <Icons.Plus className="w-4 h-4 mr-2" />
              Ajouter le runtime
            </button>
          )}
        </div>
      </div>
    </ModalBase>
  );
});

// Sub-component: Runtime Card
interface RuntimeCardProps {
  instance: Instance;
  isSelected: boolean;
  onClick: () => void;
}

function RuntimeCard({ instance, isSelected, onClick }: RuntimeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center p-3 sm:p-4 border-2 transition-all text-center cursor-pointer
        hover:border-primary/50 hover:bg-base-200
        ${isSelected ? "border-primary bg-primary/5" : "border-base-300"}
      `}
    >
      {instance.variant.logo ? (
        <img
          src={instance.variant.logo}
          alt=""
          className="w-10 h-10 sm:w-12 sm:h-12 object-contain mb-2"
        />
      ) : (
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-base-300 flex items-center justify-center mb-2">
          <Icons.Server className="w-5 h-5 sm:w-6 sm:h-6 text-base-content/40" />
        </div>
      )}
      <span className="text-xs sm:text-sm font-medium truncate w-full">
        {instance.name}
      </span>
      <span className="text-xs text-base-content/50 truncate w-full">
        {instance.type}
      </span>
    </button>
  );
}

// Sub-component: Flavor Card
interface FlavorCardProps {
  flavor: InstanceFlavor;
  isSelected: boolean;
  isDefault: boolean;
  maxCpus: number;
  onClick: () => void;
}

function FlavorCard({
  flavor,
  isSelected,
  isDefault,
  maxCpus,
  onClick,
}: FlavorCardProps) {
  const powerLevel = Math.ceil((flavor.cpus / maxCpus) * 5);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-between p-4 border-2 transition-all text-left w-full cursor-pointer
        hover:border-primary/50 hover:bg-base-200
        ${isSelected ? "border-primary bg-primary/5" : "border-base-300"}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Power Level Indicator */}
        <div className="flex gap-0.5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-6 transition-colors ${
                i < powerLevel ? "bg-primary" : "bg-base-300"
              }`}
            />
          ))}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{flavor.name}</span>
            {isDefault && (
              <span className="badge badge-sm badge-ghost">Recommande</span>
            )}
            {isSelected && <Icons.Check className="w-4 h-4 text-primary" />}
          </div>
          <div className="flex items-center gap-3 text-sm text-base-content/60 mt-0.5">
            <span>{flavor.memory.formatted} RAM</span>
            <span>{flavor.cpus} vCPU</span>
            {flavor.gpus > 0 && <span>{flavor.gpus} GPU</span>}
          </div>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="font-bold text-primary">
          {formatMonthlyPrice(flavor.price * HOURS_PER_MONTH)}
        </div>
        <div className="text-xs text-base-content/50">
          {formatHourlyPrice(flavor.price)}/h
        </div>
      </div>
    </button>
  );
}

export { RuntimeForm };
export default RuntimeForm;
