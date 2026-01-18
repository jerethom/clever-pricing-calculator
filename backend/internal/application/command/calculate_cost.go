package command

import (
	"context"
	"fmt"

	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/repository"
)

const hoursPerMonth = 730

// RuntimeSpec represents the specification for a runtime cost calculation.
type RuntimeSpec struct {
	InstanceType string
	FlavorName   string
	MinInstances int32
	MaxInstances int32
}

// AddonSpec represents the specification for an addon cost calculation.
type AddonSpec struct {
	ProviderID string
	PlanID     string
}

// CalculateCostCommand represents a command to calculate costs for a project.
type CalculateCostCommand struct {
	ProjectID    string
	RuntimeSpecs []*RuntimeSpec
	AddonSpecs   []*AddonSpec
}

// CalculateCostHandler handles CalculateCostCommand.
type CalculateCostHandler struct {
	pricingRepo repository.PricingRepository
}

// NewCalculateCostHandler creates a new CalculateCostHandler.
func NewCalculateCostHandler(pricingRepo repository.PricingRepository) *CalculateCostHandler {
	return &CalculateCostHandler{
		pricingRepo: pricingRepo,
	}
}

// Handle executes the CalculateCostCommand and returns a CostEstimation.
func (h *CalculateCostHandler) Handle(ctx context.Context, cmd *CalculateCostCommand) (*entity.CostEstimation, error) {
	estimation := entity.NewCostEstimation(cmd.ProjectID)

	// Calculate runtime costs
	for _, spec := range cmd.RuntimeSpecs {
		runtimeCost, err := h.calculateRuntimeCost(ctx, spec)
		if err != nil {
			return nil, fmt.Errorf("failed to calculate runtime cost for %s: %w", spec.InstanceType, err)
		}
		estimation.AddRuntimeCost(runtimeCost)
	}

	// Calculate addon costs
	for _, spec := range cmd.AddonSpecs {
		addonCost, err := h.calculateAddonCost(ctx, spec)
		if err != nil {
			return nil, fmt.Errorf("failed to calculate addon cost for %s: %w", spec.ProviderID, err)
		}
		estimation.AddAddonCost(addonCost)
	}

	return estimation, nil
}

func (h *CalculateCostHandler) calculateRuntimeCost(ctx context.Context, spec *RuntimeSpec) (*entity.RuntimeCost, error) {
	hourlyPrice, err := h.pricingRepo.GetFlavorPrice(ctx, spec.InstanceType, spec.FlavorName)
	if err != nil {
		return nil, err
	}

	monthlyPrice := hourlyPrice * hoursPerMonth
	minCost := monthlyPrice * float64(spec.MinInstances)
	maxCost := monthlyPrice * float64(spec.MaxInstances)

	return entity.NewRuntimeCost(
		fmt.Sprintf("%s-%s", spec.InstanceType, spec.FlavorName),
		fmt.Sprintf("%s (%s)", spec.InstanceType, spec.FlavorName),
		minCost,
		maxCost,
	), nil
}

func (h *CalculateCostHandler) calculateAddonCost(ctx context.Context, spec *AddonSpec) (*entity.AddonCost, error) {
	// For now, return a placeholder cost
	// In a real implementation, this would fetch the addon price from an API
	return entity.NewAddonCost(
		fmt.Sprintf("%s-%s", spec.ProviderID, spec.PlanID),
		fmt.Sprintf("%s (%s)", spec.ProviderID, spec.PlanID),
		0, // Placeholder cost
	), nil
}
