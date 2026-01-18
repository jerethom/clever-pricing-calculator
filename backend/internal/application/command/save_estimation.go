package command

import (
	"context"
	"errors"

	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/repository"
)

// SaveEstimationCommand represents a command to save a cost estimation.
type SaveEstimationCommand struct {
	Estimation *entity.CostEstimation
}

// SaveEstimationHandler handles SaveEstimationCommand.
type SaveEstimationHandler struct {
	estimationRepo repository.EstimationRepository
}

// NewSaveEstimationHandler creates a new SaveEstimationHandler.
func NewSaveEstimationHandler(estimationRepo repository.EstimationRepository) *SaveEstimationHandler {
	return &SaveEstimationHandler{
		estimationRepo: estimationRepo,
	}
}

// Handle executes the SaveEstimationCommand and returns the saved estimation ID.
func (h *SaveEstimationHandler) Handle(ctx context.Context, cmd *SaveEstimationCommand) (string, error) {
	if cmd.Estimation == nil {
		return "", errors.New("estimation is required")
	}

	id, err := h.estimationRepo.Save(ctx, cmd.Estimation)
	if err != nil {
		return "", err
	}

	return id, nil
}
