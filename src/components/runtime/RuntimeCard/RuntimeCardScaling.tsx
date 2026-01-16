import { memo, useState, useCallback } from 'react'
import { Icons, NumberInput } from '@/components/ui'
import { useRuntimeCardContext } from './RuntimeCardContext'
import type { RuntimeCardScalingProps } from './types'
import type { ScalingProfile } from '@/types'

export const RuntimeCardScaling = memo(function RuntimeCardScaling({
  className = '',
}: RuntimeCardScalingProps) {
  const {
    runtime,
    instance,
    availableFlavors,
    activeScalingProfiles,
    baseConfig,
    onUpdateScalingProfile,
    onAddScalingProfile,
    onRemoveScalingProfile,
  } = useRuntimeCardContext()

  // Ne pas afficher si le scaling n'est pas activé
  if (!runtime.scalingEnabled) {
    return null
  }

  const [isAddingProfile, setIsAddingProfile] = useState(false)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)

  // Trouver l'index du flavor de base
  const baseFlavorIndex = availableFlavors.findIndex(
    f => f.name === baseConfig.flavorName
  )

  // Flavors disponibles pour le scaling (>= flavor de base)
  const scalingFlavors = availableFlavors.filter(
    (_, index) => index >= baseFlavorIndex
  )

  const handleAddProfile = useCallback(() => {
    const newProfile: ScalingProfile = {
      id: crypto.randomUUID(),
      name: `Profil ${activeScalingProfiles.length + 1}`,
      minInstances: baseConfig.instances,
      maxInstances: Math.min(baseConfig.instances * 2, instance?.maxInstances ?? 40),
      minFlavorName: baseConfig.flavorName,
      maxFlavorName: scalingFlavors[scalingFlavors.length - 1]?.name ?? baseConfig.flavorName,
      enabled: true,
    }
    onAddScalingProfile(newProfile)
    setIsAddingProfile(false)
  }, [activeScalingProfiles.length, baseConfig.instances, baseConfig.flavorName, instance?.maxInstances, scalingFlavors, onAddScalingProfile])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section: Profils de scaling */}
      <div>
        <div className="flex items-center justify-between">
          <label className="label py-1">
            <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/60">
              Profils de scaling
            </span>
          </label>
          {!isAddingProfile && (
            <button
              className="btn btn-ghost btn-xs gap-1"
              onClick={() => setIsAddingProfile(true)}
            >
              <Icons.Plus className="w-3 h-3" />
              Ajouter
            </button>
          )}
        </div>

        {/* Liste des profils existants */}
        {activeScalingProfiles.length > 0 ? (
          <div className="space-y-2">
            {activeScalingProfiles.map(profile => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isEditing={editingProfileId === profile.id}
                scalingFlavors={scalingFlavors}
                maxInstances={instance?.maxInstances ?? 40}
                onEdit={() => setEditingProfileId(profile.id)}
                onSave={() => setEditingProfileId(null)}
                onUpdate={updates => onUpdateScalingProfile(profile.id, updates)}
                onRemove={() => onRemoveScalingProfile(profile.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-sm text-base-content/50 p-3 bg-base-200 border border-base-300">
            Aucun profil de scaling configuré.
            Le runtime reste sur la configuration de base 24/7.
          </div>
        )}

        {/* Formulaire d'ajout */}
        {isAddingProfile && (
          <div className="mt-2 p-3 border border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Nouveau profil</span>
              <div className="flex gap-1">
                <button
                  className="btn btn-ghost btn-xs text-success"
                  onClick={handleAddProfile}
                >
                  <Icons.Check className="w-3 h-3" />
                </button>
                <button
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => setIsAddingProfile(false)}
                >
                  <Icons.X className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-xs text-base-content/60">
              Un profil avec les paramètres par défaut sera créé.
              Vous pourrez le modifier ensuite.
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

// Sous-composant pour afficher un profil
interface ProfileCardProps {
  profile: ScalingProfile
  isEditing: boolean
  scalingFlavors: { name: string }[]
  maxInstances: number
  onEdit: () => void
  onSave: () => void
  onUpdate: (updates: Partial<ScalingProfile>) => void
  onRemove: () => void
}

function ProfileCard({
  profile,
  isEditing,
  scalingFlavors,
  maxInstances,
  onEdit,
  onSave,
  onUpdate,
  onRemove,
}: ProfileCardProps) {
  if (isEditing) {
    return (
      <div className="p-3 border border-primary/30 bg-base-100 space-y-3">
        <div className="flex items-center justify-between">
          <input
            type="text"
            className="input input-bordered input-sm flex-1 mr-2"
            value={profile.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder="Nom du profil"
          />
          <div className="flex gap-1">
            <button className="btn btn-ghost btn-xs text-success" onClick={onSave}>
              <Icons.Check className="w-3 h-3" />
            </button>
            <button className="btn btn-ghost btn-xs text-error" onClick={onRemove}>
              <Icons.Trash className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Instances min/max */}
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Min inst."
            labelPosition="top"
            value={profile.minInstances}
            onChange={value => onUpdate({ minInstances: value })}
            min={1}
            max={maxInstances}
            size="sm"
          />
          <NumberInput
            label="Max inst."
            labelPosition="top"
            value={profile.maxInstances}
            onChange={value => onUpdate({ maxInstances: value })}
            min={profile.minInstances}
            max={maxInstances}
            size="sm"
          />
        </div>

        {/* Flavors min/max */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-base-content/60">Flavor min</label>
            <select
              className="select select-bordered select-sm w-full"
              value={profile.minFlavorName}
              onChange={e => onUpdate({ minFlavorName: e.target.value })}
            >
              {scalingFlavors.map(f => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-base-content/60">Flavor max</label>
            <select
              className="select select-bordered select-sm w-full"
              value={profile.maxFlavorName}
              onChange={e => onUpdate({ maxFlavorName: e.target.value })}
            >
              {scalingFlavors.map(f => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-3 border border-base-300 bg-base-100 hover:border-primary/30 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{profile.name}</div>
        <div className="text-xs text-base-content/60">
          {profile.minInstances}-{profile.maxInstances} inst. •{' '}
          {profile.minFlavorName}-{profile.maxFlavorName}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="btn btn-ghost btn-xs"
          onClick={onEdit}
          title="Modifier"
        >
          <Icons.Edit className="w-3 h-3" />
        </button>
        <button
          className="btn btn-ghost btn-xs text-error"
          onClick={onRemove}
          title="Supprimer"
        >
          <Icons.Trash className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
