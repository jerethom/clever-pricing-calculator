import { BASELINE_PROFILE_ID } from './scaling'

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export const DAYS_OF_WEEK: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Lun',
  tue: 'Mar',
  wed: 'Mer',
  thu: 'Jeu',
  fri: 'Ven',
  sat: 'Sam',
  sun: 'Dim',
}

/**
 * Niveau de charge pour l'estimation du coût
 * 0 = baseline (pas de scaling)
 * 1-5 = niveaux croissants de charge
 */
export type LoadLevel = 0 | 1 | 2 | 3 | 4 | 5

export const LOAD_LEVELS: LoadLevel[] = [0, 1, 2, 3, 4, 5]

export const LOAD_LEVEL_LABELS: Record<LoadLevel, string> = {
  0: 'Baseline',
  1: 'Très faible',
  2: 'Faible',
  3: 'Modéré',
  4: 'Élevé',
  5: 'Maximum',
}

/**
 * Configuration de scaling pour une heure donnée
 */
export interface HourlyConfig {
  profileId: string // Référence au ScalingProfile (ou 'baseline')
  loadLevel: LoadLevel // Niveau de charge pour estimation
}

// Grille 7 jours × 24 heures avec configuration de scaling
export type HourlySchedule = HourlyConfig[] // 24 configs (0-23h)
export type WeeklySchedule = Record<DayOfWeek, HourlySchedule>

/**
 * Crée une configuration horaire baseline (pas de scaling)
 */
export function createBaselineConfig(): HourlyConfig {
  return {
    profileId: BASELINE_PROFILE_ID,
    loadLevel: 0,
  }
}

/**
 * Crée une configuration horaire avec un profil et niveau de charge
 */
export function createHourlyConfig(profileId: string, loadLevel: LoadLevel): HourlyConfig {
  return { profileId, loadLevel }
}

/**
 * Fonction utilitaire pour créer une grille vide (tout en baseline)
 */
export function createEmptySchedule(): WeeklySchedule {
  const emptyDay = (): HourlySchedule => Array(24).fill(null).map(() => createBaselineConfig())
  return {
    mon: emptyDay(),
    tue: emptyDay(),
    wed: emptyDay(),
    thu: emptyDay(),
    fri: emptyDay(),
    sat: emptyDay(),
    sun: emptyDay(),
  }
}

/**
 * Fonction utilitaire pour créer une grille remplie avec un profil et niveau spécifique
 */
export function createFilledSchedule(profileId: string, loadLevel: LoadLevel): WeeklySchedule {
  const filledDay = (): HourlySchedule => Array(24).fill(null).map(() => createHourlyConfig(profileId, loadLevel))
  return {
    mon: filledDay(),
    tue: filledDay(),
    wed: filledDay(),
    thu: filledDay(),
    fri: filledDay(),
    sat: filledDay(),
    sun: filledDay(),
  }
}
