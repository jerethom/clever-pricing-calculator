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

// Grille 7 jours × 24 heures
// Chaque valeur = nombre d'instances supplémentaires (au-delà de minInstances)
// 0 = baseline (minInstances), n = minInstances + n
export type HourlySchedule = number[] // 24 valeurs (0-23h)
export type WeeklySchedule = Record<DayOfWeek, HourlySchedule>

// Fonction utilitaire pour créer une grille vide (tout à 0 = baseline)
export function createEmptySchedule(): WeeklySchedule {
  const emptyDay = (): HourlySchedule => Array(24).fill(0)
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
