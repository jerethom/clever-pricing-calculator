package entity

// Flavor represents a runtime flavor configuration with resource specifications.
type Flavor struct {
	Name         string
	Mem          int32
	CPUs         int32
	PricePerHour float64
	Available    bool
}

// NewFlavor creates a new Flavor instance.
func NewFlavor(name string, mem, cpus int32, pricePerHour float64, available bool) *Flavor {
	return &Flavor{
		Name:         name,
		Mem:          mem,
		CPUs:         cpus,
		PricePerHour: pricePerHour,
		Available:    available,
	}
}

// MonthlyPrice calculates the monthly price for this flavor (730 hours/month).
func (f *Flavor) MonthlyPrice() float64 {
	const hoursPerMonth = 730
	return f.PricePerHour * hoursPerMonth
}

// IsHighMemory returns true if the flavor has more than 4GB of memory.
func (f *Flavor) IsHighMemory() bool {
	return f.Mem > 4096
}
