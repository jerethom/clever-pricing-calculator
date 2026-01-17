/**
 * Constantes globales de l'application
 */

// Constantes de temps
/** Nombre d'heures par mois (30j x 24h, standard Clever Cloud) */
export const HOURS_PER_MONTH = 720;

/** Nombre moyen de semaines par mois */
export const WEEKS_PER_MONTH = 4.33;

// Constantes d'affichage
/** Lettres des jours de la semaine (Lundi a Dimanche) */
export const DAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"] as const;

// Constantes de tri
/** Features prioritaires pour l'affichage des addons (par ordre de priorite) */
export const PRIORITY_FEATURES = [
  "memory",
  "max_db_size",
  "disk",
  "vcpus",
  "cpu",
  "storage",
  "max_connection_limit",
] as const;

// Couleurs des profils de scaling
export * from "./profileColors";
