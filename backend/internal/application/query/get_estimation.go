package query

import (
	"context"
	"errors"

	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/repository"
)

// ErrEstimationNotFound is returned when an estimation is not found.
var ErrEstimationNotFound = errors.New("estimation not found")

// GetEstimationQuery represents a query to get an estimation by ID.
type GetEstimationQuery struct {
	EstimationID string
}

// GetEstimationResult represents the result of a GetEstimationQuery.
type GetEstimationResult struct {
	Estimation *entity.CostEstimation
}

// GetEstimationHandler handles GetEstimationQuery.
type GetEstimationHandler struct {
	estimationRepo repository.EstimationRepository
}

// NewGetEstimationHandler creates a new GetEstimationHandler.
func NewGetEstimationHandler(estimationRepo repository.EstimationRepository) *GetEstimationHandler {
	return &GetEstimationHandler{
		estimationRepo: estimationRepo,
	}
}

// Handle executes the GetEstimationQuery.
func (h *GetEstimationHandler) Handle(ctx context.Context, query *GetEstimationQuery) (*GetEstimationResult, error) {
	if query.EstimationID == "" {
		return nil, errors.New("estimation ID is required")
	}

	estimation, err := h.estimationRepo.FindByID(ctx, query.EstimationID)
	if err != nil {
		return nil, err
	}

	if estimation == nil {
		return nil, ErrEstimationNotFound
	}

	return &GetEstimationResult{
		Estimation: estimation,
	}, nil
}
