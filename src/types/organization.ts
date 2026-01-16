export interface Organization {
  id: string
  name: string
  budgetTarget?: number  // Budget mensuel cible en euros
  createdAt: string
  updatedAt: string
}

export const DEFAULT_ORGANIZATION_NAME = 'Mon Organisation'
