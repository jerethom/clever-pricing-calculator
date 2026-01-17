import { typeid } from "typeid-js";

/**
 * Préfixes TypeID par entité
 */
export const TYPE_ID_PREFIXES = {
  organization: "org",
  project: "proj",
  runtime: "rt",
  addon: "addon",
  scalingProfile: "prof",
  toast: "toast",
} as const;

/**
 * Génère un TypeID pour une organisation
 */
export function generateOrganizationId(): string {
  return typeid(TYPE_ID_PREFIXES.organization).toString();
}

/**
 * Génère un TypeID pour un projet
 */
export function generateProjectId(): string {
  return typeid(TYPE_ID_PREFIXES.project).toString();
}

/**
 * Génère un TypeID pour un runtime
 */
export function generateRuntimeId(): string {
  return typeid(TYPE_ID_PREFIXES.runtime).toString();
}

/**
 * Génère un TypeID pour un addon
 */
export function generateAddonId(): string {
  return typeid(TYPE_ID_PREFIXES.addon).toString();
}

/**
 * Génère un TypeID pour un profil de scaling
 */
export function generateProfileId(): string {
  return typeid(TYPE_ID_PREFIXES.scalingProfile).toString();
}

/**
 * Génère un TypeID pour un toast
 */
export function generateToastId(): string {
  return typeid(TYPE_ID_PREFIXES.toast).toString();
}
