/**
 * Constantes de couleurs pour les profils de scaling
 *
 * Chaque profil a sa propre couleur de base.
 * L'opacité est utilisée pour indiquer le niveau de charge (0-5).
 */

export interface ProfileColorConfig {
  name: string
  /** Couleur hex pour les styles inline */
  hex: string
  /** Classes Tailwind pour le fond (sans opacité) */
  bgClass: string
}

/**
 * Palette de 8 couleurs distinctes pour les profils
 */
export const PROFILE_COLORS: ProfileColorConfig[] = [
  { name: 'blue', hex: '#3b82f6', bgClass: 'bg-blue-500' },
  { name: 'emerald', hex: '#10b981', bgClass: 'bg-emerald-500' },
  { name: 'amber', hex: '#f59e0b', bgClass: 'bg-amber-500' },
  { name: 'rose', hex: '#f43f5e', bgClass: 'bg-rose-500' },
  { name: 'cyan', hex: '#06b6d4', bgClass: 'bg-cyan-500' },
  { name: 'violet', hex: '#8b5cf6', bgClass: 'bg-violet-500' },
  { name: 'lime', hex: '#84cc16', bgClass: 'bg-lime-500' },
  { name: 'fuchsia', hex: '#d946ef', bgClass: 'bg-fuchsia-500' },
]

/**
 * Opacités par niveau de charge
 * Niveau 0 = pas de couleur (gris neutre)
 */
export const LOAD_LEVEL_OPACITIES: Record<number, number> = {
  0: 0, // Pas utilisé (bg-base-200)
  1: 0.3,
  2: 0.5,
  3: 0.65,
  4: 0.8,
  5: 1.0,
}

/**
 * Récupère la couleur d'un profil par son index
 */
export function getProfileColorByIndex(index: number): ProfileColorConfig {
  return PROFILE_COLORS[index % PROFILE_COLORS.length]
}

/**
 * Génère le style CSS inline pour une cellule avec couleur de profil et opacité de niveau
 */
export function getProfileCellStyle(
  profileColorIndex: number,
  loadLevel: number
): React.CSSProperties {
  if (loadLevel === 0) {
    return {}
  }

  const color = PROFILE_COLORS[profileColorIndex % PROFILE_COLORS.length]
  const opacity = LOAD_LEVEL_OPACITIES[loadLevel] ?? 1

  return {
    backgroundColor: hexToRgba(color.hex, opacity),
  }
}

/**
 * Convertit une couleur hex en rgba avec opacité
 */
export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Détermine si le texte doit être blanc ou noir selon le fond
 * Utilise la formule de luminosité relative
 */
export function shouldUseWhiteText(hex: string, opacity: number): boolean {
  if (opacity < 0.5) {
    return false // Fond trop clair, utiliser texte sombre
  }

  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  // Formule de luminosité relative (seuil ajusté pour l'opacité)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const effectiveLuminance = luminance * opacity + (1 - opacity) // Blend avec fond blanc

  return effectiveLuminance < 0.6
}
