import { memo, useState, useCallback } from 'react'
import { Icons, NumberInput } from '@/components/ui'
import { useRuntimeCardContext } from './RuntimeCardContext'
import { formatPrice } from '@/lib/costCalculator'
import { generateProfileId } from '@/lib/typeid'
import type { RuntimeCardScalingProps } from './types'
import type { ScalingProfile } from '@/types'
import type { InstanceFlavor } from '@/api/types'

const HOURS_PER_MONTH = 730

const formatFlavorOption = (f: InstanceFlavor) =>
  `${f.name} (${f.memory.formatted}, ${f.cpus} vCPU) - ${formatPrice(f.price * HOURS_PER_MONTH)}/mois`

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

  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)

  const handleAddProfile = useCallback(() => {
    const newId = generateProfileId()
    const maxInst = instance?.maxInstances ?? 40
    const lastFlavor = availableFlavors[availableFlavors.length - 1]?.name ?? baseConfig.flavorName

    onAddScalingProfile({
      id: newId,
      name: `Profil ${activeScalingProfiles.length + 1}`,
      minInstances: baseConfig.instances,
      maxInstances: Math.min(baseConfig.instances * 2, maxInst),
      minFlavorName: baseConfig.flavorName,
      maxFlavorName: lastFlavor,
      enabled: true,
    })
    setEditingProfileId(newId)
  }, [activeScalingProfiles.length, baseConfig, instance?.maxInstances, availableFlavors, onAddScalingProfile])

  if (!runtime.scalingEnabled) return null

  const maxInst = instance?.maxInstances ?? 40
  const canDelete = activeScalingProfiles.length > 1

  return (
    <div className={`space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 ${className}`}>
      <div>
        <div className="flex items-center justify-between">
          <label className="label py-1">
            <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/60">
              Profils de scaling
            </span>
          </label>
          <button className="btn btn-ghost btn-xs gap-1" onClick={handleAddProfile}>
            <Icons.Plus className="w-3 h-3" />
            Ajouter
          </button>
        </div>

        {activeScalingProfiles.length > 0 ? (
          <div className="space-y-2">
            {activeScalingProfiles.map(profile => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isEditing={editingProfileId === profile.id}
                flavors={availableFlavors}
                maxInstances={maxInst}
                canDelete={canDelete}
                onToggleEdit={() => setEditingProfileId(
                  editingProfileId === profile.id ? null : profile.id
                )}
                onUpdate={updates => onUpdateScalingProfile(profile.id, updates)}
                onRemove={() => onRemoveScalingProfile(profile.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-sm text-base-content/50 p-3 bg-base-200 border border-base-300">
            Aucun profil de scaling configure. Le runtime reste sur la configuration de base 24/7.
          </div>
        )}
      </div>
    </div>
  )
})

interface ProfileCardProps {
  profile: ScalingProfile
  isEditing: boolean
  flavors: InstanceFlavor[]
  maxInstances: number
  canDelete: boolean
  onToggleEdit: () => void
  onUpdate: (updates: Partial<ScalingProfile>) => void
  onRemove: () => void
}

function ProfileCard({
  profile,
  isEditing,
  flavors,
  maxInstances,
  canDelete,
  onToggleEdit,
  onUpdate,
  onRemove,
}: ProfileCardProps) {
  const deleteTitle = canDelete ? 'Supprimer' : 'Au moins un profil requis'

  const handleMinChange = (value: number) => {
    onUpdate(value > profile.maxInstances
      ? { minInstances: value, maxInstances: value }
      : { minInstances: value })
  }

  const handleMaxChange = (value: number) => {
    onUpdate(value < profile.minInstances
      ? { maxInstances: value, minInstances: value }
      : { maxInstances: value })
  }

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
            <button
              className="btn btn-ghost btn-xs"
              onClick={onToggleEdit}
              title="Replier"
            >
              <Icons.ChevronUp className="w-3 h-3" />
            </button>
            <button
              className="btn btn-ghost btn-xs text-error"
              onClick={onRemove}
              disabled={!canDelete}
              title={deleteTitle}
            >
              <Icons.Trash className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Min inst."
            labelPosition="top"
            value={profile.minInstances}
            onChange={handleMinChange}
            min={1}
            max={maxInstances}
            size="sm"
          />
          <NumberInput
            label="Max inst."
            labelPosition="top"
            value={profile.maxInstances}
            onChange={handleMaxChange}
            min={1}
            max={maxInstances}
            size="sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FlavorSelect
            label="Flavor min"
            value={profile.minFlavorName}
            flavors={flavors}
            onChange={v => onUpdate({ minFlavorName: v })}
          />
          <FlavorSelect
            label="Flavor max"
            value={profile.maxFlavorName}
            flavors={flavors}
            onChange={v => onUpdate({ maxFlavorName: v })}
          />
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="flex items-center justify-between p-3 border border-base-300 bg-base-100 hover:border-primary/30 transition-colors w-full text-left cursor-pointer"
      onClick={onToggleEdit}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{profile.name}</div>
        <div className="text-xs text-base-content/60">
          {profile.minInstances}-{profile.maxInstances} inst. • {profile.minFlavorName}-{profile.maxFlavorName}
        </div>
      </div>
      <div className="flex gap-1">
        <span className="btn btn-ghost btn-xs">
          <Icons.ChevronDown className="w-3 h-3" />
        </span>
        <span
          className={`btn btn-ghost btn-xs text-error ${!canDelete ? 'btn-disabled' : ''}`}
          onClick={e => { e.stopPropagation(); if (canDelete) onRemove() }}
          title={deleteTitle}
        >
          <Icons.Trash className="w-3 h-3" />
        </span>
      </div>
    </button>
  )
}

interface FlavorSelectProps {
  label: string
  value: string
  flavors: InstanceFlavor[]
  onChange: (value: string) => void
}

function FlavorSelect({ label, value, flavors, onChange }: FlavorSelectProps) {
  return (
    <div>
      <label className="text-xs text-base-content/60">{label}</label>
      <select
        className="select select-bordered select-sm w-full"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {flavors.map(f => (
          <option key={f.name} value={f.name}>{formatFlavorOption(f)}</option>
        ))}
      </select>
    </div>
  )
}
