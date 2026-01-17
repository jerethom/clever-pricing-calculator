import { useNavigate } from "@tanstack/react-router";
import { memo, useCallback, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";
import { Icons } from "@/components/ui";
import { useActiveOrganizationCosts } from "@/hooks/useCostCalculation";
import {
	selectActiveOrganization,
	selectActiveOrganizationProjects,
	selectOrganizations,
	useProjectActions,
	useSelector,
} from "@/store";
import { useProjectStore } from "@/store/projectStore";
import { OrganizationBudgetGauge } from "./OrganizationBudgetGauge";
import { OrganizationCostBreakdown } from "./OrganizationCostBreakdown";
import { OrganizationHeader } from "./OrganizationHeader";
import { OrganizationProjections } from "./OrganizationProjections";
import { OrganizationProjectList } from "./OrganizationProjectList";
import { OrganizationStats } from "./OrganizationStats";

type TabType = "overview" | "projections";

export const OrganizationDashboard = memo(function OrganizationDashboard() {
	const [activeTab, setActiveTab] = useState<TabType>("overview");
	const navigate = useNavigate();
	const organization = useSelector(selectActiveOrganization);
	const organizations = useSelector(selectOrganizations);
	// Utiliser useShallow pour éviter les re-renders quand le tableau est recréé mais identique
	const projects = useProjectStore(
		useShallow(selectActiveOrganizationProjects),
	);
	const projectCosts = useActiveOrganizationCosts();
	const { updateOrganization, deleteOrganization, createProject } =
		useProjectActions();

	// Calculer les statistiques (une seule itération)
	const stats = useMemo(() => {
		let totalRuntimes = 0;
		let totalAddons = 0;
		let totalMonthlyCost = 0;
		let totalRuntimesCost = 0;
		let totalAddonsCost = 0;
		let totalMinCost = 0;
		let totalMaxCost = 0;
		let totalBaseCost = 0;
		let totalScalingCost = 0;

		for (const project of projects) {
			totalRuntimes += project.runtimes.length;
			totalAddons += project.addons.length;
			const cost = projectCosts.get(project.id);
			if (cost) {
				totalMonthlyCost += cost.totalMonthlyCost;
				totalRuntimesCost += cost.runtimesCost;
				totalAddonsCost += cost.addonsCost;
				// Calcul des plages min/max
				totalMinCost +=
					cost.runtimesDetail.reduce((s, r) => s + r.minMonthlyCost, 0) +
					cost.addonsCost;
				totalMaxCost +=
					cost.runtimesDetail.reduce((s, r) => s + r.maxMonthlyCost, 0) +
					cost.addonsCost;
				// Calcul des couts base/scaling
				totalBaseCost +=
					cost.runtimesDetail.reduce((s, r) => s + r.baseMonthlyCost, 0) +
					cost.addonsCost;
				totalScalingCost += cost.runtimesDetail.reduce(
					(s, r) => s + r.estimatedScalingCost,
					0,
				);
			}
		}

		return {
			projectsCount: projects.length,
			runtimesCount: totalRuntimes,
			addonsCount: totalAddons,
			totalMonthlyCost,
			totalRuntimesCost,
			totalAddonsCost,
			totalMinCost,
			totalMaxCost,
			totalBaseCost,
			totalScalingCost,
		};
	}, [projects, projectCosts]);

	// Handlers
	const handleUpdateName = useCallback(
		(name: string) => {
			if (organization) {
				updateOrganization(organization.id, { name });
			}
		},
		[organization, updateOrganization],
	);

	const handleDelete = useCallback(() => {
		if (organization) {
			// Trouver une autre organisation vers laquelle naviguer
			const otherOrg = organizations.find((o) => o.id !== organization.id);
			deleteOrganization(organization.id);
			if (otherOrg) {
				navigate({ to: "/org/$orgId", params: { orgId: otherOrg.id } });
			} else {
				navigate({ to: "/" });
			}
		}
	}, [organization, organizations, deleteOrganization, navigate]);

	const handleCreateProject = useCallback(() => {
		if (organization) {
			const name = `Projet ${projects.length + 1}`;
			const newProjectId = createProject(organization.id, name);
			navigate({
				to: "/org/$orgId/project/$projectId/runtimes",
				params: { orgId: organization.id, projectId: newProjectId },
			});
		}
	}, [organization, projects.length, createProject, navigate]);

	const handleUpdateBudget = useCallback(
		(budget: number | undefined) => {
			if (organization) {
				updateOrganization(organization.id, { budgetTarget: budget });
			}
		},
		[organization, updateOrganization],
	);

	if (!organization) {
		return null;
	}

	const tabs = [
		{ key: "overview", icon: Icons.Chart, label: "Vue d'ensemble" },
		{ key: "projections", icon: Icons.TrendingUp, label: "Projections" },
	] as const;

	return (
		<div className="space-y-6 animate-in fade-in duration-300">
			<OrganizationHeader
				organization={organization}
				projects={projects}
				projectCosts={projectCosts}
				onUpdateName={handleUpdateName}
				onDelete={handleDelete}
			/>

			<div
				role="tablist"
				aria-label="Sections de l'organisation"
				className="flex bg-base-200 p-1 gap-1"
			>
				{tabs.map(({ key, icon: Icon, label }) => {
					const isActive = activeTab === key;
					return (
						<button
							key={key}
							type="button"
							role="tab"
							id={`tab-org-${key}`}
							aria-selected={isActive}
							aria-controls={`tabpanel-org-${key}`}
							className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                font-medium text-sm transition-all duration-200
                ${
									isActive
										? "bg-base-100 shadow-sm text-base-content"
										: "text-base-content/60 hover:text-base-content hover:bg-base-100/50"
								}
              `}
							onClick={() => setActiveTab(key)}
						>
							<Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
							<span>{label}</span>
						</button>
					);
				})}
			</div>

			<div className="mt-2">
				<div
					role="tabpanel"
					id="tabpanel-org-overview"
					aria-labelledby="tab-org-overview"
					hidden={activeTab !== "overview"}
				>
					{activeTab === "overview" && (
						<div className="space-y-6">
							<OrganizationBudgetGauge
								currentCost={stats.totalMonthlyCost}
								minCost={stats.totalMinCost}
								maxCost={stats.totalMaxCost}
								budgetTarget={organization.budgetTarget}
								onUpdateBudget={handleUpdateBudget}
							/>
							<OrganizationStats
								projectsCount={stats.projectsCount}
								runtimesCount={stats.runtimesCount}
								addonsCount={stats.addonsCount}
								totalMonthlyCost={stats.totalMonthlyCost}
								minMonthlyCost={stats.totalMinCost}
								maxMonthlyCost={stats.totalMaxCost}
							/>
							<OrganizationCostBreakdown
								totalRuntimesCost={stats.totalRuntimesCost}
								totalAddonsCost={stats.totalAddonsCost}
								totalMonthlyCost={stats.totalMonthlyCost}
								totalBaseCost={stats.totalBaseCost}
								totalScalingCost={stats.totalScalingCost}
								projects={projects}
								projectCosts={projectCosts}
							/>
							<OrganizationProjectList
								projects={projects}
								projectCosts={projectCosts}
								orgId={organization.id}
								onCreateProject={handleCreateProject}
							/>
						</div>
					)}
				</div>

				<div
					role="tabpanel"
					id="tabpanel-org-projections"
					aria-labelledby="tab-org-projections"
					hidden={activeTab !== "projections"}
				>
					{activeTab === "projections" && (
						<OrganizationProjections
							projects={projects}
							projectCosts={projectCosts}
							budgetTarget={organization.budgetTarget}
						/>
					)}
				</div>
			</div>
		</div>
	);
});
