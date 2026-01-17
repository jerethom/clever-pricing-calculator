import type { ReactNode } from "react";
import { memo } from "react";
import { Icons } from "@/components/ui";

interface StatCardProps {
	icon: ReactNode;
	label: string;
	value: string | number;
	subValue?: string;
	colorClass: string;
	bgClass: string;
}

const StatCard = memo(function StatCard({
	icon,
	label,
	value,
	subValue,
	colorClass,
	bgClass,
}: StatCardProps) {
	return (
		<div className="card bg-base-100 border border-base-300 hover:border-primary/30 transition-all hover:shadow-md">
			<div className="card-body p-4">
				<div className="flex items-start gap-3">
					<div className={`p-2.5 rounded-lg ${bgClass}`}>{icon}</div>
					<div className="flex-1 min-w-0">
						<p className="text-xs font-medium text-base-content/60 uppercase tracking-wider">
							{label}
						</p>
						<p className={`text-2xl font-bold ${colorClass} mt-0.5`}>{value}</p>
						{subValue && (
							<p className="text-xs text-base-content/50 mt-0.5">{subValue}</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
});

interface OrganizationStatsProps {
	projectsCount: number;
	runtimesCount: number;
	addonsCount: number;
	totalMonthlyCost: number;
	minMonthlyCost: number;
	maxMonthlyCost: number;
}

export const OrganizationStats = memo(function OrganizationStats({
	projectsCount,
	runtimesCount,
	addonsCount,
}: OrganizationStatsProps) {
	return (
		<section
			className="grid grid-cols-3 gap-3 sm:gap-4"
			aria-label="Statistiques de l'organisation"
		>
			<StatCard
				icon={<Icons.Folder className="w-5 h-5 text-primary" />}
				label="Projets"
				value={projectsCount}
				subValue={
					projectsCount === 0
						? "Aucun projet"
						: projectsCount === 1
							? "1 projet actif"
							: `${projectsCount} projets actifs`
				}
				colorClass="text-primary"
				bgClass="bg-primary/10"
			/>

			<StatCard
				icon={<Icons.Server className="w-5 h-5 text-info" />}
				label="Runtimes"
				value={runtimesCount}
				subValue={
					runtimesCount === 0
						? "Aucune instance"
						: runtimesCount === 1
							? "1 instance"
							: `${runtimesCount} instances`
				}
				colorClass="text-info"
				bgClass="bg-info/10"
			/>

			<StatCard
				icon={<Icons.Puzzle className="w-5 h-5 text-secondary" />}
				label="Addons"
				value={addonsCount}
				subValue={
					addonsCount === 0
						? "Aucun service"
						: addonsCount === 1
							? "1 service"
							: `${addonsCount} services`
				}
				colorClass="text-secondary"
				bgClass="bg-secondary/10"
			/>
		</section>
	);
});
