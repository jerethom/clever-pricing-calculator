package estimation

import (
	"context"
	"sync"

	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/repository"
)

// MemoryRepository implements EstimationRepository with in-memory storage.
type MemoryRepository struct {
	mu          sync.RWMutex
	estimations map[string]*entity.CostEstimation
}

// Ensure MemoryRepository implements EstimationRepository.
var _ repository.EstimationRepository = (*MemoryRepository)(nil)

// NewMemoryRepository creates a new MemoryRepository.
func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		estimations: make(map[string]*entity.CostEstimation),
	}
}

// Save stores a cost estimation and returns its ID.
func (r *MemoryRepository) Save(ctx context.Context, estimation *entity.CostEstimation) (string, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Create a deep copy to prevent external modifications
	copy := r.deepCopy(estimation)
	r.estimations[copy.ID] = copy

	return copy.ID, nil
}

// FindByID retrieves a cost estimation by its ID.
func (r *MemoryRepository) FindByID(ctx context.Context, id string) (*entity.CostEstimation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	estimation, exists := r.estimations[id]
	if !exists {
		return nil, nil
	}

	// Return a deep copy to prevent external modifications
	return r.deepCopy(estimation), nil
}

// FindByProjectID retrieves all estimations for a project.
func (r *MemoryRepository) FindByProjectID(ctx context.Context, projectID string) ([]*entity.CostEstimation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var results []*entity.CostEstimation
	for _, est := range r.estimations {
		if est.ProjectID == projectID {
			results = append(results, r.deepCopy(est))
		}
	}

	return results, nil
}

// Delete removes a cost estimation by its ID.
func (r *MemoryRepository) Delete(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.estimations, id)
	return nil
}

// deepCopy creates a deep copy of a CostEstimation.
func (r *MemoryRepository) deepCopy(est *entity.CostEstimation) *entity.CostEstimation {
	if est == nil {
		return nil
	}

	copy := &entity.CostEstimation{
		ID:             est.ID,
		ProjectID:      est.ProjectID,
		MinMonthlyCost: est.MinMonthlyCost,
		MaxMonthlyCost: est.MaxMonthlyCost,
		RuntimeCosts:   make([]*entity.RuntimeCost, len(est.RuntimeCosts)),
		AddonCosts:     make([]*entity.AddonCost, len(est.AddonCosts)),
	}

	for i, rc := range est.RuntimeCosts {
		copy.RuntimeCosts[i] = &entity.RuntimeCost{
			RuntimeID: rc.RuntimeID,
			Name:      rc.Name,
			MinCost:   rc.MinCost,
			MaxCost:   rc.MaxCost,
		}
	}

	for i, ac := range est.AddonCosts {
		copy.AddonCosts[i] = &entity.AddonCost{
			AddonID: ac.AddonID,
			Name:    ac.Name,
			Cost:    ac.Cost,
		}
	}

	return copy
}
