import { memo } from "react";
import { Skeleton } from "./Skeleton";

/**
 * Skeleton pour le composant CostSummary.
 * Reproduit la structure visuelle du resume des couts pendant le chargement.
 */
export const CostSummarySkeleton = memo(function CostSummarySkeleton() {
	return (
		<div className="space-y-6">
			{/* Selecteur de duree */}
			<div className="card bg-base-100 border border-base-300">
				<div className="card-body p-4">
					<div className="flex flex-wrap gap-2">
						{[1, 3, 6, 12, 24].map((month) => (
							<Skeleton key={month} shape="rectangle" className="w-16 h-10" />
						))}
					</div>
				</div>
			</div>

			{/* Section Projection - Cartes Mensuel et Projection */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Carte Mensuel */}
				<div className="card bg-base-100 border border-base-300">
					<div className="card-body p-5">
						<div className="flex items-center gap-2 mb-3">
							<Skeleton shape="circle" className="w-5 h-5" />
							<Skeleton shape="text" className="w-32 h-4" />
						</div>
						<Skeleton shape="text" className="w-40 h-8" />
						<Skeleton shape="text" className="w-24 h-3 mt-2" />
					</div>
				</div>

				{/* Carte Projection */}
				<div className="card bg-base-100 border border-base-300">
					<div className="card-body p-5">
						<div className="flex items-center gap-2 mb-3">
							<Skeleton shape="circle" className="w-5 h-5" />
							<Skeleton shape="text" className="w-36 h-4" />
						</div>
						<Skeleton shape="text" className="w-44 h-8" />
						<Skeleton shape="text" className="w-28 h-3 mt-2" />
					</div>
				</div>
			</div>

			{/* Stats rapides et repartition */}
			<div className="card bg-base-100 border border-base-300">
				<div className="card-body p-5">
					{/* Stats rapides */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-center gap-6 mb-6">
						<div className="text-center space-y-2">
							<div className="flex items-center justify-center gap-1.5">
								<Skeleton shape="circle" className="w-4 h-4" />
								<Skeleton shape="text" className="w-16 h-3" />
							</div>
							<Skeleton shape="text" className="w-24 h-7 mx-auto" />
							<Skeleton shape="text" className="w-20 h-3 mx-auto" />
						</div>
						<div className="hidden sm:block w-px h-16 bg-base-300" />
						<div className="sm:hidden h-px w-full bg-base-300" />
						<div className="text-center space-y-2">
							<div className="flex items-center justify-center gap-1.5">
								<Skeleton shape="circle" className="w-4 h-4" />
								<Skeleton shape="text" className="w-16 h-3" />
							</div>
							<Skeleton shape="text" className="w-24 h-7 mx-auto" />
							<Skeleton shape="text" className="w-20 h-3 mx-auto" />
						</div>
					</div>

					{/* Barre de repartition */}
					<div className="h-px w-full bg-base-300 my-2" />
					<Skeleton shape="rectangle" className="w-full h-6 mt-4" />
				</div>
			</div>

			{/* Detail des runtimes */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Skeleton shape="circle" className="w-5 h-5" />
					<Skeleton shape="text" className="w-20 h-5" />
					<Skeleton shape="rectangle" className="w-6 h-5" />
				</div>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="card bg-base-100 border border-base-300">
							<div className="card-body p-4 space-y-3">
								<div className="flex items-center gap-3">
									<Skeleton shape="rectangle" className="w-8 h-8" />
									<div className="space-y-1 flex-1">
										<Skeleton shape="text" className="w-24 h-4" />
										<Skeleton shape="text" className="w-16 h-3" />
									</div>
								</div>
								<Skeleton shape="text" className="w-full h-4" />
								<Skeleton shape="text" className="w-28 h-5" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
});
