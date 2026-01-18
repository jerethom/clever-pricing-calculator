package query

import (
	"context"

	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/repository"
)

// ListInstancesQuery represents a query to list all available instances.
type ListInstancesQuery struct {
	ZoneID string
}

// ListInstancesResult represents the result of a ListInstancesQuery.
type ListInstancesResult struct {
	Instances []*entity.Instance
}

// ListInstancesHandler handles ListInstancesQuery.
type ListInstancesHandler struct {
	pricingRepo repository.PricingRepository
}

// NewListInstancesHandler creates a new ListInstancesHandler.
func NewListInstancesHandler(pricingRepo repository.PricingRepository) *ListInstancesHandler {
	return &ListInstancesHandler{
		pricingRepo: pricingRepo,
	}
}

// Handle executes the ListInstancesQuery.
func (h *ListInstancesHandler) Handle(ctx context.Context, query *ListInstancesQuery) (*ListInstancesResult, error) {
	zoneID := query.ZoneID
	if zoneID == "" {
		zoneID = "par" // Default to Paris zone
	}

	instances, err := h.pricingRepo.ListInstances(ctx, zoneID)
	if err != nil {
		return nil, err
	}

	return &ListInstancesResult{
		Instances: instances,
	}, nil
}
