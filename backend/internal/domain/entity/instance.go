package entity

// Instance represents a runtime instance type with its available flavors.
type Instance struct {
	Type    string
	Name    string
	Version string
	Flavors []*Flavor
}

// NewInstance creates a new Instance.
func NewInstance(instanceType, name, version string) *Instance {
	return &Instance{
		Type:    instanceType,
		Name:    name,
		Version: version,
		Flavors: make([]*Flavor, 0),
	}
}

// AddFlavor adds a flavor to the instance.
func (i *Instance) AddFlavor(flavor *Flavor) {
	i.Flavors = append(i.Flavors, flavor)
}

// GetAvailableFlavors returns only available flavors.
func (i *Instance) GetAvailableFlavors() []*Flavor {
	available := make([]*Flavor, 0, len(i.Flavors))
	for _, f := range i.Flavors {
		if f.Available {
			available = append(available, f)
		}
	}
	return available
}

// FindFlavorByName finds a flavor by its name.
func (i *Instance) FindFlavorByName(name string) *Flavor {
	for _, f := range i.Flavors {
		if f.Name == name {
			return f
		}
	}
	return nil
}

// MinPrice returns the minimum monthly price among all available flavors.
func (i *Instance) MinPrice() float64 {
	minPrice := -1.0
	for _, f := range i.GetAvailableFlavors() {
		monthlyPrice := f.MonthlyPrice()
		if minPrice < 0 || monthlyPrice < minPrice {
			minPrice = monthlyPrice
		}
	}
	if minPrice < 0 {
		return 0
	}
	return minPrice
}

// MaxPrice returns the maximum monthly price among all available flavors.
func (i *Instance) MaxPrice() float64 {
	maxPrice := 0.0
	for _, f := range i.GetAvailableFlavors() {
		monthlyPrice := f.MonthlyPrice()
		if monthlyPrice > maxPrice {
			maxPrice = monthlyPrice
		}
	}
	return maxPrice
}
