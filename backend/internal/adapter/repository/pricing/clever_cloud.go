package pricing

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/c18t-com/clever-pricing-calculator/backend/internal/config"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/repository"
)

// CleverCloudRepository implements PricingRepository by fetching data from Clever Cloud API.
type CleverCloudRepository struct {
	config     *config.CleverCloudConfig
	httpClient *http.Client
}

// Ensure CleverCloudRepository implements PricingRepository.
var _ repository.PricingRepository = (*CleverCloudRepository)(nil)

// NewCleverCloudRepository creates a new CleverCloudRepository.
func NewCleverCloudRepository(cfg *config.CleverCloudConfig) *CleverCloudRepository {
	return &CleverCloudRepository{
		config: cfg,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// APIProduct represents a product from the Clever Cloud API.
type APIProduct struct {
	Type    string      `json:"type"`
	Name    string      `json:"name"`
	Version string      `json:"version"`
	Flavors []APIFlavor `json:"flavors"`
}

// APIFlavor represents a flavor from the Clever Cloud API.
type APIFlavor struct {
	Name  string  `json:"name"`
	Mem   int32   `json:"mem"`
	CPUs  int32   `json:"cpus"`
	Price float64 `json:"price"`
}

// ListInstances returns all available instances for a given zone.
func (r *CleverCloudRepository) ListInstances(ctx context.Context, zoneID string) ([]*entity.Instance, error) {
	url := fmt.Sprintf("%s/products/instances?zone_id=%s", r.config.APIURL, zoneID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch instances: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var apiProducts []APIProduct
	if err := json.NewDecoder(resp.Body).Decode(&apiProducts); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	instances := make([]*entity.Instance, 0, len(apiProducts))
	for _, p := range apiProducts {
		instance := entity.NewInstance(p.Type, p.Name, p.Version)
		for _, f := range p.Flavors {
			flavor := entity.NewFlavor(f.Name, f.Mem, f.CPUs, f.Price, true)
			instance.AddFlavor(flavor)
		}
		instances = append(instances, instance)
	}

	return instances, nil
}

// GetInstanceByType returns an instance by its type.
func (r *CleverCloudRepository) GetInstanceByType(ctx context.Context, instanceType string) (*entity.Instance, error) {
	instances, err := r.ListInstances(ctx, "par")
	if err != nil {
		return nil, err
	}

	for _, inst := range instances {
		if inst.Type == instanceType {
			return inst, nil
		}
	}

	return nil, fmt.Errorf("instance type %s not found", instanceType)
}

// GetFlavorPrice returns the hourly price for a specific instance type and flavor.
func (r *CleverCloudRepository) GetFlavorPrice(ctx context.Context, instanceType, flavorName string) (float64, error) {
	instance, err := r.GetInstanceByType(ctx, instanceType)
	if err != nil {
		return 0, err
	}

	flavor := instance.FindFlavorByName(flavorName)
	if flavor == nil {
		return 0, fmt.Errorf("flavor %s not found for instance type %s", flavorName, instanceType)
	}

	return flavor.PricePerHour, nil
}
