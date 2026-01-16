import { memo, useState, useCallback, useEffect } from 'react'
import { Icons, NumberInput } from '@/components/ui'
import { useRuntimeCardContext } from './RuntimeCardContext'
import type { RuntimeCardScalingProps } from './types'
import type { ScalingProfile } from '@/types'
import { toast } from '@/store/toastStore'

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

  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)

  // Au montage, ouvrir le profil 'default' en édition s'il existe
  useEffect(() => {
    const defaultProfile = activeScalingProfiles.find(p => p.id === 'default')
    if (defaultProfile && editingProfileId === null) {
      setEditingProfileId('default')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Exécuté uniquement au montage

  // Trouver l'index du flavor de base
  const baseFlavorIndex = availableFlavors.findIndex(
    f => f.name === baseConfig.flavorName
  )

  // Flavors disponibles pour le scaling (>= flavor de base)
  const scalingFlavors = availableFlavors.filter(
    (_, index) => index >= baseFlavorIndex
  )

  const handleAddProfile = useCallback(() => {
    const newId = crypto.randomUUID()
    const newProfile: ScalingProfile = {
      id: newId,
      name: `Profil ${activeScalingProfiles.length + 1}`,
      minInstances: baseConfig.instances,
      maxInstances: Math.min(baseConfig.instances * 2, instance?.maxInstances ?? 40),
      minFlavorName: baseConfig.flavorName,
      maxFlavorName: scalingFlavors[scalingFlavors.length - 1]?.name ?? baseConfig.flavorName,
      enabled: true,
    }
    onAddScalingProfile(newProfile)
    // Passer directement en mode édition du nouveau profil
    setEditingProfileId(newId)
  }, [activeScalingProfiles.length, baseConfig.instances, baseConfig.flavorName, instance?.maxInstances, scalingFlavors, onAddScalingProfile])

  return (
    <div className={`space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 ${className}`}>
      {/* Section: Profils de scaling */}
      <div>
        <div className="flex items-center justify-between">
          <label className="label py-1">
            <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/60">
              Profils de scaling
            </span>
          </label>
          <button
            className="btn btn-ghost btn-xs gap-1"
            onClick={handleAddProfile}
          >
            <Icons.Plus className="w-3 h-3" />
            Ajouter
          </button>
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
                canDelete={activeScalingProfiles.length > 1}
                onEdit={() => setEditingProfileId(profile.id)}
                onSave={() => {
                  setEditingProfileId(null)
                  toast.success(`Profil "${profile.name}" mis à jour`)
                }}
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
  canDelete: boolean
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
  canDelete,
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
            <button
              className="btn btn-ghost btn-xs text-error"
              onClick={onRemove}
              disabled={!canDelete}
              title={canDelete ? 'Supprimer' : 'Au moins un profil requis'}
            >
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
            onChange={value => {
              // Si min dépasse max, augmenter max pour suivre
              if (value > profile.maxInstances) {
                onUpdate({ minInstances: value, maxInstances: value })
              } else {
                onUpdate({ minInstances: value })
              }
            }}
            min={1}
            max={maxInstances}
            size="sm"
          />
          <NumberInput
            label="Max inst."
            labelPosition="top"
            value={profile.maxInstances}
            onChange={value => {
              // Si max descend sous min, diminuer min pour suivre
              if (value < profile.minInstances) {
                onUpdate({ maxInstances: value, minInstances: value })
              } else {
                onUpdate({ maxInstances: value })
              }
            }}
            min={1}
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
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          className="btn btn-ghost btn-xs focus:opacity-100"
          onClick={onEdit}
          title="Modifier"
        >
          <Icons.Edit className="w-3 h-3" />
        </button>
        <button
          className="btn btn-ghost btn-xs text-error focus:opacity-100"
          onClick={onRemove}
          disabled={!canDelete}
          title={canDelete ? 'Supprimer' : 'Au moins un profil requis'}
        >
          <Icons.Trash className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
