package entity

import (
	"github.com/google/uuid"
)

// CostEstimation represents a cost estimation for a project.
type CostEstimation struct {
	ID             string
	ProjectID      string
	MinMonthlyCost float64
	MaxMonthlyCost float64
	RuntimeCosts   []*RuntimeCost
	AddonCosts     []*AddonCost
}

// RuntimeCost represents the cost breakdown for a runtime.
type RuntimeCost struct {
	RuntimeID string
	Name      string
	MinCost   float64
	MaxCost   float64
}

// AddonCost represents the cost for an addon.
type AddonCost struct {
	AddonID string
	Name    string
	Cost    float64
}

// NewCostEstimation creates a new CostEstimation with a generated ID.
func NewCostEstimation(projectID string) *CostEstimation {
	return &CostEstimation{
		ID:           uuid.New().String(),
		ProjectID:    projectID,
		RuntimeCosts: make([]*RuntimeCost, 0),
		AddonCosts:   make([]*AddonCost, 0),
	}
}

// AddRuntimeCost adds a runtime cost to the estimation.
func (e *CostEstimation) AddRuntimeCost(cost *RuntimeCost) {
	e.RuntimeCosts = append(e.RuntimeCosts, cost)
	e.recalculateTotals()
}

// AddAddonCost adds an addon cost to the estimation.
func (e *CostEstimation) AddAddonCost(cost *AddonCost) {
	e.AddonCosts = append(e.AddonCosts, cost)
	e.recalculateTotals()
}

// recalculateTotals recalculates the min and max monthly costs.
func (e *CostEstimation) recalculateTotals() {
	e.MinMonthlyCost = 0
	e.MaxMonthlyCost = 0

	for _, rc := range e.RuntimeCosts {
		e.MinMonthlyCost += rc.MinCost
		e.MaxMonthlyCost += rc.MaxCost
	}

	for _, ac := range e.AddonCosts {
		e.MinMonthlyCost += ac.Cost
		e.MaxMonthlyCost += ac.Cost
	}
}

// NewRuntimeCost creates a new RuntimeCost.
func NewRuntimeCost(runtimeID, name string, minCost, maxCost float64) *RuntimeCost {
	return &RuntimeCost{
		RuntimeID: runtimeID,
		Name:      name,
		MinCost:   minCost,
		MaxCost:   maxCost,
	}
}

// NewAddonCost creates a new AddonCost.
func NewAddonCost(addonID, name string, cost float64) *AddonCost {
	return &AddonCost{
		AddonID: addonID,
		Name:    name,
		Cost:    cost,
	}
}

// TotalRuntimeMinCost returns the total minimum cost of all runtimes.
func (e *CostEstimation) TotalRuntimeMinCost() float64 {
	total := 0.0
	for _, rc := range e.RuntimeCosts {
		total += rc.MinCost
	}
	return total
}

// TotalRuntimeMaxCost returns the total maximum cost of all runtimes.
func (e *CostEstimation) TotalRuntimeMaxCost() float64 {
	total := 0.0
	for _, rc := range e.RuntimeCosts {
		total += rc.MaxCost
	}
	return total
}

// TotalAddonCost returns the total cost of all addons.
func (e *CostEstimation) TotalAddonCost() float64 {
	total := 0.0
	for _, ac := range e.AddonCosts {
		total += ac.Cost
	}
	return total
}
