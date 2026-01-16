import { useState, useEffect } from 'react'
import type { RuntimeConfig, WeeklySchedule, LoadLevel } from '@/types'
import { createEmptySchedule, LOAD_LEVELS, LOAD_LEVEL_LABELS, LOAD_LEVEL_DESCRIPTIONS, BASELINE_PROFILE_ID } from '@/types'
import { useProjectAction } from '@/store'
import { WeeklyCalendar } from './WeeklyCalendar'
import { SchedulePresets } from './SchedulePresets'
import { ScheduleLegend } from './ScheduleLegend'
import type { Instance } from '@/api/types'
import { Icons } from '@/components/ui'

interface TimeSlotEditorProps {
  projectId: string
  runtimeId: string
  runtime: RuntimeConfig
  instance?: Instance
}

function TimeSlotEditor({
  projectId,
  runtimeId,
  runtime,
  instance: _instance,
}: TimeSlotEditorProps) {
  const updateRuntime = useProjectAction('updateRuntime')
  const [showPresets, setShowPresets] = useState(true)
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    (runtime.scalingProfiles ?? []).find(p => p.enabled && p.id !== BASELINE_PROFILE_ID)?.id ?? 'default'
  )
  const [loadLevel, setLoadLevel] = useState<LoadLevel>(3)

  // Profils de scaling disponibles (sans baseline)
  const scalingProfiles = (runtime.scalingProfiles ?? []).filter(p => p.enabled && p.id !== BASELINE_PROFILE_ID)

  // Mettre à jour selectedProfileId si le profil sélectionné n'existe plus
  useEffect(() => {
    const profileExists = scalingProfiles.some(p => p.id === selectedProfileId)
    if (!profileExists && scalingProfiles.length > 0) {
      setSelectedProfileId(scalingProfiles[0].id)
    }
  }, [scalingProfiles, selectedProfileId])

  const handleScheduleChange = (newSchedule: WeeklySchedule) => {
    updateRuntime(projectId, runtimeId, { weeklySchedule: newSchedule })
  }

  const handleReset = () => {
    handleScheduleChange(createEmptySchedule())
  }

  const selectedProfile = scalingProfiles.find(p => p.id === selectedProfileId) ?? scalingProfiles[0]

  const schedule = runtime.weeklySchedule ?? createEmptySchedule()

  // Calcul du nombre d'heures de scaling configurées
  const scalingHoursCount = Object.values(schedule).reduce((total, day) => {
    return total + day.filter(config => config.loadLevel > 0).length
  }, 0)

  // Détecter les créneaux orphelins (profil supprimé)
  const allProfileIds = new Set((runtime.scalingProfiles ?? []).map(p => p.id))
  const orphanedSlotsCount = Object.values(schedule).reduce((total, day) => {
    return total + day.filter(config =>
      config.profileId !== BASELINE_PROFILE_ID && !allProfileIds.has(config.profileId)
    ).length
  }, 0)

  const hasScaling = scalingProfiles.length > 0

  return (
    <div className="space-y-4">
      {/* Header avec infos */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h4 className="font-semibold flex items-center gap-2">
            <Icons.Clock className="w-4 h-4 text-primary" />
            Planning hebdomadaire
          </h4>
          <p className="text-sm text-base-content/60 mt-1">
            Définissez quand et comment le scaling doit s'activer
          </p>
        </div>

        {/* Légende contextuelle */}
        <ScheduleLegend />
      </div>

      {/* Info baseline */}
      <div className="flex items-center gap-4 p-3 bg-base-200 border border-base-300 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base-content/60">Baseline :</span>
          <span className="font-semibold">
            Configuration de base
          </span>
        </div>
        {hasScaling && selectedProfile && (
          <>
            <div className="w-px h-4 bg-base-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-base-content/60">Profil :</span>
              <span className="font-semibold">{selectedProfile.name}</span>
            </div>
            <div className="w-px h-4 bg-base-300 hidden sm:block" />
            <div className="flex items-center gap-2 text-primary">
              <span>
                {selectedProfile.minInstances}-{selectedProfile.maxInstances} instances,{' '}
                {selectedProfile.minFlavorName}-{selectedProfile.maxFlavorName}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Presets toggle */}
      {hasScaling && (
        <div>
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="btn btn-ghost btn-sm gap-2"
          >
            <span>
              {showPresets ? 'Masquer' : 'Afficher'} les configurations rapides
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showPresets && (
            <div className="mt-2 animate-in">
              <SchedulePresets
                profileId={selectedProfileId}
                loadLevel={loadLevel}
                scalingProfiles={scalingProfiles}
                onApply={handleScheduleChange}
              />
            </div>
          )}
        </div>
      )}

      {/* Toolbar sticky compacte */}
      {hasScaling && (
        <div className="sticky top-0 z-10 bg-base-100 border border-base-300 shadow-sm rounded-lg p-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Sélecteur de profil */}
            {scalingProfiles.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-base-content/70 whitespace-nowrap">Profil :</label>
                <select
                  className="select select-sm select-bordered"
                  value={selectedProfileId}
                  onChange={e => setSelectedProfileId(e.target.value)}
                >
                  {scalingProfiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Séparateur */}
            {scalingProfiles.length > 1 && (
              <div className="w-px h-6 bg-base-300 hidden sm:block" />
            )}

            {/* Boutons de niveau de charge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/70 whitespace-nowrap">Niveau :</span>
              <div className="flex items-center gap-0.5">
                {LOAD_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setLoadLevel(level)}
                    className={`
                      btn btn-sm w-8 h-8 min-h-0 p-0
                      ${loadLevel === level
                        ? 'btn-primary'
                        : 'btn-ghost border border-base-300'}
                    `}
                    title={`${LOAD_LEVEL_LABELS[level]} - ${LOAD_LEVEL_DESCRIPTIONS[level]}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Séparateur */}
            <div className="w-px h-6 bg-base-300 hidden sm:block" />

            {/* Indicateur du mode actuel */}
            <div className="flex items-center gap-2">
              <span className={`badge ${loadLevel === 0 ? 'badge-ghost' : 'badge-primary'} gap-1`}>
                <Icons.Edit className="w-3 h-3" />
                {loadLevel}
              </span>
              <span className="text-sm font-medium">
                {LOAD_LEVEL_LABELS[loadLevel]}
              </span>
            </div>

            {/* Spacer pour pousser le bouton Reset à droite */}
            <div className="flex-1" />

            {/* Bouton Reset */}
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-ghost btn-sm text-error gap-1"
            >
              <Icons.Refresh className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Calendrier */}
      <WeeklyCalendar
        schedule={schedule}
        onChange={handleScheduleChange}
        profileId={selectedProfileId}
        loadLevel={loadLevel}
        scalingProfiles={scalingProfiles}
      />

      {/* Résumé */}
      {hasScaling && (
        <div className="text-sm text-base-content/60">
          {scalingHoursCount > 0 ? (
            <span>
              {scalingHoursCount} heure(s) de scaling configurée(s) par semaine
            </span>
          ) : (
            <span>Aucune heure de scaling configurée (baseline 24/7)</span>
          )}
        </div>
      )}

      {/* Avertissement créneaux orphelins */}
      {orphanedSlotsCount > 0 && (
        <div className="p-4 bg-warning/10 border border-warning/30 text-sm">
          <div className="flex items-start gap-3">
            <Icons.Warning className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Créneaux non assignés</div>
              <div className="text-base-content/70 mt-1">
                {orphanedSlotsCount} créneau(x) référence(nt) un profil qui n'existe plus.
                Sélectionnez un profil et repeignez ces créneaux pour les réassigner.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message si pas de scaling possible */}
      {!hasScaling && (
        <div className="p-4 bg-warning/10 border border-warning/30 text-sm">
          <div className="flex items-start gap-3">
            <Icons.Warning className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Scaling non disponible</div>
              <div className="text-base-content/70 mt-1">
                Aucun profil de scaling n'est configuré pour ce runtime.
                Ajoutez un profil de scaling pour activer le planning.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { TimeSlotEditor }
export default TimeSlotEditor
