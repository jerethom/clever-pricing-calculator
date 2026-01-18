package di

import (
	"github.com/samber/do/v2"

	"github.com/c18t-com/clever-pricing-calculator/backend/internal/adapter/handler/pricing"
	estimationrepo "github.com/c18t-com/clever-pricing-calculator/backend/internal/adapter/repository/estimation"
	pricingrepo "github.com/c18t-com/clever-pricing-calculator/backend/internal/adapter/repository/pricing"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/application/command"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/application/query"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/config"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/repository"
)

// NewContainer creates a new dependency injection container with all services registered.
func NewContainer(cfg *config.Config) *do.RootScope {
	injector := do.New()

	// Register config
	do.ProvideValue(injector, cfg)

	// Register repositories
	do.Provide(injector, func(i do.Injector) (repository.PricingRepository, error) {
		cfg := do.MustInvoke[*config.Config](i)
		return pricingrepo.NewCleverCloudRepository(&cfg.CleverCloud), nil
	})

	do.Provide(injector, func(i do.Injector) (repository.EstimationRepository, error) {
		return estimationrepo.NewMemoryRepository(), nil
	})

	// Register query handlers
	do.Provide(injector, func(i do.Injector) (*query.ListInstancesHandler, error) {
		pricingRepo := do.MustInvoke[repository.PricingRepository](i)
		return query.NewListInstancesHandler(pricingRepo), nil
	})

	do.Provide(injector, func(i do.Injector) (*query.GetEstimationHandler, error) {
		estimationRepo := do.MustInvoke[repository.EstimationRepository](i)
		return query.NewGetEstimationHandler(estimationRepo), nil
	})

	// Register command handlers
	do.Provide(injector, func(i do.Injector) (*command.CalculateCostHandler, error) {
		pricingRepo := do.MustInvoke[repository.PricingRepository](i)
		return command.NewCalculateCostHandler(pricingRepo), nil
	})

	do.Provide(injector, func(i do.Injector) (*command.SaveEstimationHandler, error) {
		estimationRepo := do.MustInvoke[repository.EstimationRepository](i)
		return command.NewSaveEstimationHandler(estimationRepo), nil
	})

	// Register gRPC-Connect handler
	do.Provide(injector, func(i do.Injector) (*pricing.Handler, error) {
		listInstancesHandler := do.MustInvoke[*query.ListInstancesHandler](i)
		getEstimationHandler := do.MustInvoke[*query.GetEstimationHandler](i)
		calculateCostHandler := do.MustInvoke[*command.CalculateCostHandler](i)
		saveEstimationHandler := do.MustInvoke[*command.SaveEstimationHandler](i)

		return pricing.NewHandler(
			listInstancesHandler,
			getEstimationHandler,
			calculateCostHandler,
			saveEstimationHandler,
		), nil
	})

	return injector
}
