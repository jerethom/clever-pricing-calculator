package pricing

import (
	"context"

	"connectrpc.com/connect"

	"github.com/c18t-com/clever-pricing-calculator/backend/gen/proto/pricing/v1"
	"github.com/c18t-com/clever-pricing-calculator/backend/gen/proto/pricing/v1/pricingv1connect"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/application/command"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/application/query"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
)

// Handler implements the PricingServiceHandler interface.
type Handler struct {
	listInstancesHandler  *query.ListInstancesHandler
	getEstimationHandler  *query.GetEstimationHandler
	calculateCostHandler  *command.CalculateCostHandler
	saveEstimationHandler *command.SaveEstimationHandler
}

// Ensure Handler implements the PricingServiceHandler interface.
var _ pricingv1connect.PricingServiceHandler = (*Handler)(nil)

// NewHandler creates a new Handler with the given CQS handlers.
func NewHandler(
	listInstancesHandler *query.ListInstancesHandler,
	getEstimationHandler *query.GetEstimationHandler,
	calculateCostHandler *command.CalculateCostHandler,
	saveEstimationHandler *command.SaveEstimationHandler,
) *Handler {
	return &Handler{
		listInstancesHandler:  listInstancesHandler,
		getEstimationHandler:  getEstimationHandler,
		calculateCostHandler:  calculateCostHandler,
		saveEstimationHandler: saveEstimationHandler,
	}
}

// ListInstances handles the ListInstances RPC.
func (h *Handler) ListInstances(
	ctx context.Context,
	req *connect.Request[pricingv1.ListInstancesRequest],
) (*connect.Response[pricingv1.ListInstancesResponse], error) {
	result, err := h.listInstancesHandler.Handle(ctx, &query.ListInstancesQuery{
		ZoneID: req.Msg.GetZoneId(),
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	protoInstances := make([]*pricingv1.Instance, 0, len(result.Instances))
	for _, inst := range result.Instances {
		protoInstances = append(protoInstances, instanceToProto(inst))
	}

	return connect.NewResponse(&pricingv1.ListInstancesResponse{
		Instances: protoInstances,
	}), nil
}

// GetEstimation handles the GetEstimation RPC.
func (h *Handler) GetEstimation(
	ctx context.Context,
	req *connect.Request[pricingv1.GetEstimationRequest],
) (*connect.Response[pricingv1.GetEstimationResponse], error) {
	result, err := h.getEstimationHandler.Handle(ctx, &query.GetEstimationQuery{
		EstimationID: req.Msg.GetEstimationId(),
	})
	if err != nil {
		if err == query.ErrEstimationNotFound {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(&pricingv1.GetEstimationResponse{
		Estimation: estimationToProto(result.Estimation),
	}), nil
}

// CalculateCost handles the CalculateCost RPC.
func (h *Handler) CalculateCost(
	ctx context.Context,
	req *connect.Request[pricingv1.CalculateCostRequest],
) (*connect.Response[pricingv1.CalculateCostResponse], error) {
	runtimeSpecs := make([]*command.RuntimeSpec, 0, len(req.Msg.GetRuntimeSpecs()))
	for _, spec := range req.Msg.GetRuntimeSpecs() {
		runtimeSpecs = append(runtimeSpecs, &command.RuntimeSpec{
			InstanceType: spec.GetInstanceType(),
			FlavorName:   spec.GetFlavorName(),
			MinInstances: spec.GetMinInstances(),
			MaxInstances: spec.GetMaxInstances(),
		})
	}

	addonSpecs := make([]*command.AddonSpec, 0, len(req.Msg.GetAddonSpecs()))
	for _, spec := range req.Msg.GetAddonSpecs() {
		addonSpecs = append(addonSpecs, &command.AddonSpec{
			ProviderID: spec.GetProviderId(),
			PlanID:     spec.GetPlanId(),
		})
	}

	estimation, err := h.calculateCostHandler.Handle(ctx, &command.CalculateCostCommand{
		ProjectID:    req.Msg.GetProjectId(),
		RuntimeSpecs: runtimeSpecs,
		AddonSpecs:   addonSpecs,
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(&pricingv1.CalculateCostResponse{
		Estimation: estimationToProto(estimation),
	}), nil
}

// SaveEstimation handles the SaveEstimation RPC.
func (h *Handler) SaveEstimation(
	ctx context.Context,
	req *connect.Request[pricingv1.SaveEstimationRequest],
) (*connect.Response[pricingv1.SaveEstimationResponse], error) {
	estimation := protoToEstimation(req.Msg.GetEstimation())

	id, err := h.saveEstimationHandler.Handle(ctx, &command.SaveEstimationCommand{
		Estimation: estimation,
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(&pricingv1.SaveEstimationResponse{
		EstimationId: id,
	}), nil
}

// Conversion helpers

func instanceToProto(inst *entity.Instance) *pricingv1.Instance {
	flavors := make([]*pricingv1.Flavor, 0, len(inst.Flavors))
	for _, f := range inst.Flavors {
		flavors = append(flavors, &pricingv1.Flavor{
			Name:         f.Name,
			Mem:          f.Mem,
			Cpus:         f.CPUs,
			PricePerHour: f.PricePerHour,
			Available:    f.Available,
		})
	}

	return &pricingv1.Instance{
		Type:    inst.Type,
		Name:    inst.Name,
		Version: inst.Version,
		Flavors: flavors,
	}
}

func estimationToProto(est *entity.CostEstimation) *pricingv1.CostEstimation {
	runtimeCosts := make([]*pricingv1.RuntimeCost, 0, len(est.RuntimeCosts))
	for _, rc := range est.RuntimeCosts {
		runtimeCosts = append(runtimeCosts, &pricingv1.RuntimeCost{
			RuntimeId: rc.RuntimeID,
			Name:      rc.Name,
			MinCost:   rc.MinCost,
			MaxCost:   rc.MaxCost,
		})
	}

	addonCosts := make([]*pricingv1.AddonCost, 0, len(est.AddonCosts))
	for _, ac := range est.AddonCosts {
		addonCosts = append(addonCosts, &pricingv1.AddonCost{
			AddonId: ac.AddonID,
			Name:    ac.Name,
			Cost:    ac.Cost,
		})
	}

	return &pricingv1.CostEstimation{
		Id:             est.ID,
		ProjectId:      est.ProjectID,
		MinMonthlyCost: est.MinMonthlyCost,
		MaxMonthlyCost: est.MaxMonthlyCost,
		RuntimeCosts:   runtimeCosts,
		AddonCosts:     addonCosts,
	}
}

func protoToEstimation(proto *pricingv1.CostEstimation) *entity.CostEstimation {
	if proto == nil {
		return nil
	}

	estimation := &entity.CostEstimation{
		ID:             proto.GetId(),
		ProjectID:      proto.GetProjectId(),
		MinMonthlyCost: proto.GetMinMonthlyCost(),
		MaxMonthlyCost: proto.GetMaxMonthlyCost(),
		RuntimeCosts:   make([]*entity.RuntimeCost, 0, len(proto.GetRuntimeCosts())),
		AddonCosts:     make([]*entity.AddonCost, 0, len(proto.GetAddonCosts())),
	}

	for _, rc := range proto.GetRuntimeCosts() {
		estimation.RuntimeCosts = append(estimation.RuntimeCosts, &entity.RuntimeCost{
			RuntimeID: rc.GetRuntimeId(),
			Name:      rc.GetName(),
			MinCost:   rc.GetMinCost(),
			MaxCost:   rc.GetMaxCost(),
		})
	}

	for _, ac := range proto.GetAddonCosts() {
		estimation.AddonCosts = append(estimation.AddonCosts, &entity.AddonCost{
			AddonID: ac.GetAddonId(),
			Name:    ac.GetName(),
			Cost:    ac.GetCost(),
		})
	}

	return estimation
}
