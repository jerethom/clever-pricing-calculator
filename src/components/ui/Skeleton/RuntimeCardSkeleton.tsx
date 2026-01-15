import { memo } from 'react'
import { Skeleton } from './Skeleton'

/**
 * Skeleton pour le composant RuntimeCard.
 * Reproduit la structure visuelle de la carte pendant le chargement.
 */
export const RuntimeCardSkeleton = memo(function RuntimeCardSkeleton() {
  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4 sm:p-6">
        {/* Header avec logo, nom et badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <Skeleton shape="rectangle" className="w-10 h-10" />
            {/* Nom et type */}
            <div className="space-y-2">
              <Skeleton shape="text" className="w-32 h-5" />
              <Skeleton shape="text" className="w-24 h-3" />
            </div>
          </div>
          {/* Badges */}
          <div className="flex gap-2">
            <Skeleton shape="rectangle" className="w-16 h-6" />
            <Skeleton shape="rectangle" className="w-20 h-6" />
          </div>
        </div>

        {/* Configuration du flavor */}
        <div className="mt-4 space-y-2">
          <Skeleton shape="text" className="w-20 h-3" />
          <div className="flex items-center gap-3">
            <Skeleton shape="rectangle" className="flex-1 h-10" />
            <Skeleton shape="rectangle" className="w-24 h-10" />
          </div>
        </div>

        {/* Configuration de la scalabilite */}
        <div className="mt-4 space-y-2">
          <Skeleton shape="text" className="w-28 h-3" />
          <div className="flex gap-4">
            <Skeleton shape="rectangle" className="flex-1 h-10" />
            <Skeleton shape="rectangle" className="flex-1 h-10" />
          </div>
        </div>

        {/* Planning hebdomadaire */}
        <div className="mt-4 space-y-2">
          <Skeleton shape="text" className="w-36 h-3" />
          <Skeleton shape="rectangle" className="w-full h-12" />
        </div>

        {/* Section couts */}
        <div className="mt-4 pt-4 border-t border-base-200">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <Skeleton shape="text" className="w-24 h-3" />
              <Skeleton shape="text" className="w-32 h-6" />
            </div>
            <Skeleton shape="rectangle" className="w-28 h-8" />
          </div>
        </div>
      </div>
    </div>
  )
})
