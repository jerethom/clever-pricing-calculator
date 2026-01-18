package repository

import (
	"context"

	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
)

// PricingRepository defines the interface for fetching pricing data.
type PricingRepository interface {
	// ListInstances returns all available instances for a given zone.
	ListInstances(ctx context.Context, zoneID string) ([]*entity.Instance, error)

	// GetInstanceByType returns an instance by its type.
	GetInstanceByType(ctx context.Context, instanceType string) (*entity.Instance, error)

	// GetFlavorPrice returns the hourly price for a specific instance type and flavor.
	GetFlavorPrice(ctx context.Context, instanceType, flavorName string) (float64, error)
}

// EstimationRepository defines the interface for storing and retrieving estimations.
type EstimationRepository interface {
	// Save stores a cost estimation and returns its ID.
	Save(ctx context.Context, estimation *entity.CostEstimation) (string, error)

	// FindByID retrieves a cost estimation by its ID.
	FindByID(ctx context.Context, id string) (*entity.CostEstimation, error)

	// FindByProjectID retrieves all estimations for a project.
	FindByProjectID(ctx context.Context, projectID string) ([]*entity.CostEstimation, error)

	// Delete removes a cost estimation by its ID.
	Delete(ctx context.Context, id string) error
}
