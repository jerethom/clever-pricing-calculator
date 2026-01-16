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

      {/* Sélection du profil et niveau de charge */}
      {hasScaling && (
        <div className="p-4 border border-base-300 bg-base-100 space-y-4">
          {/* Sélecteur de profil */}
          {scalingProfiles.length > 1 && (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-medium">Profil de scaling</div>
                <div className="text-xs text-base-content/60">
                  Configuration utilisée pour les créneaux sélectionnés
                </div>
              </div>
              <select
                className="select select-bordered select-sm w-48"
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

          {/* Sélecteur de niveau de charge */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-medium">Niveau de charge</div>
                <div className="text-xs text-base-content/60">
                  Intensité du scaling attendu sur les créneaux sélectionnés
                </div>
              </div>
              <div className="flex items-center gap-1">
                {LOAD_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setLoadLevel(level)}
                    className={`
                      w-10 h-10 flex flex-col items-center justify-center text-xs font-medium
                      border transition-all rounded
                      ${loadLevel === level
                        ? 'bg-primary text-primary-content border-primary ring-2 ring-primary/30'
                        : 'bg-base-100 border-base-300 hover:border-primary hover:bg-base-200'}
                    `}
                    title={`${LOAD_LEVEL_LABELS[level]} - ${LOAD_LEVEL_DESCRIPTIONS[level]}`}
                  >
                    <span className="font-bold">{level}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Explication détaillée du niveau sélectionné */}
            <div className={`p-3 rounded border ${loadLevel === 0 ? 'bg-base-200 border-base-300' : 'bg-primary/10 border-primary/30'}`}>
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 flex items-center justify-center rounded font-bold ${loadLevel === 0 ? 'bg-base-300 text-base-content' : 'bg-primary text-primary-content'}`}>
                  {loadLevel}
                </span>
                <div>
                  <div className="font-medium text-sm">{LOAD_LEVEL_LABELS[loadLevel]}</div>
                  <div className="text-xs text-base-content/70">{LOAD_LEVEL_DESCRIPTIONS[loadLevel]}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                onApply={handleScheduleChange}
              />
            </div>
          )}
        </div>
      )}

      {/* Barre d'outils - Mode peinture */}
      {hasScaling && (
        <div className={`flex items-center justify-between gap-4 p-3 rounded border-2 ${loadLevel === 0 ? 'bg-base-200 border-base-300' : 'bg-primary/5 border-primary/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded ${loadLevel === 0 ? 'bg-base-300' : 'bg-primary text-primary-content'}`}>
              <Icons.Edit className="w-4 h-4" />
              <span className="font-semibold text-sm">
                {loadLevel === 0 ? 'Baseline' : `Niveau ${loadLevel}`}
              </span>
            </div>
            <div className="text-sm text-base-content/70 hidden sm:block">
              {selectedProfile?.name && loadLevel > 0 && (
                <span>Profil : <strong>{selectedProfile.name}</strong></span>
              )}
              {loadLevel === 0 && <span>Retour à la configuration de base</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-ghost btn-sm text-error gap-1"
          >
            <Icons.Refresh className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
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
