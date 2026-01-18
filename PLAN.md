# Plan : Ajout Backend Go avec gRPC-Connect (Frontend Embarqué)

## Objectif
Créer un backend Go avec gRPC-Connect qui sert également le frontend React en production. Un seul binaire pour tout déployer.

## Dépendances Clés
- **gRPC-Connect** (`connectrpc.com/connect`) - Communication client-serveur
- **samber/do** (`github.com/samber/do/v2`) - Injection de dépendances
- **ozzo-validation** (`github.com/go-ozzo/ozzo-validation/v4`) - Validation de la configuration

## Architecture

```
Production:  Backend Go → Sert les fichiers statiques + API gRPC-Connect
Développement: Vite (HMR) ←proxy /api→ Backend Go (API)
```

## Structure Proposée (Clean Architecture + CQS)

```
/
├── frontend/                         # Frontend React
│   ├── src/
│   │   ├── gen/proto/                # Code TS généré par buf
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── store/
│   │   ├── types/
│   │   └── ...
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
│
├── backend/                          # Backend Go (Clean Architecture + CQS)
│   ├── cmd/
│   │   └── server/
│   │       ├── main.go               # Point d'entrée
│   │       └── web/                  # Frontend embedé (généré)
│   │
│   ├── internal/
│   │   ├── di/                       # Injection de dépendances (samber/do)
│   │   │   └── container.go          # Configuration du conteneur DI
│   │   │
│   │   ├── config/                   # Configuration & env vars
│   │   │   ├── config.go
│   │   │   └── env.go
│   │   │
│   │   ├── domain/                   # Couche Domain
│   │   │   ├── entity/               # Entités métier
│   │   │   │   ├── flavor.go
│   │   │   │   ├── instance.go
│   │   │   │   └── estimation.go
│   │   │   └── repository/           # Interfaces des repositories
│   │   │       └── pricing.go
│   │   │
│   │   ├── application/              # Couche Application (CQS - handlers typés)
│   │   │   ├── query/                # Queries (lecture seule)
│   │   │   │   ├── list_instances.go
│   │   │   │   └── get_estimation.go
│   │   │   │
│   │   │   └── command/              # Commands (écriture)
│   │   │       ├── calculate_cost.go
│   │   │       └── save_estimation.go
│   │   │
│   │   ├── adapter/                  # Couche Adapter
│   │   │   ├── handler/              # gRPC-Connect handlers
│   │   │   │   └── pricing/
│   │   │   │       └── handler.go    # Injection directe des handlers typés
│   │   │   └── repository/           # Implémentations des repositories
│   │   │       └── pricing/
│   │   │           └── clever_cloud.go
│   │   │
│   │   └── infrastructure/           # Couche Infrastructure
│   │       ├── server/
│   │       │   └── http.go
│   │       └── static/
│   │           └── spa.go
│   │
│   ├── gen/proto/                    # Code Go généré par buf
│   ├── go.mod
│   └── go.sum
│
├── proto/                            # Fichiers .proto partagés
│   ├── buf.yaml
│   └── pricing/v1/
│       ├── pricing.proto
│       └── pricing_service.proto
│
├── buf.yaml
├── buf.gen.yaml
├── mise.toml
├── .env.example
└── .gitignore
```

## Clean Architecture + CQS - Principes

### CQS (Command Query Separation)
- **Query** : Lecture seule, retourne des données, sans effet de bord
- **Command** : Modifie l'état, ne retourne rien (ou juste un ID/confirmation)

### Flux des dépendances (handlers typés directement)
```
Handler gRPC (adapter) → Query/Command Handlers (typés) → Domain
                                      ↓
                          Repository Impl (adapter)
```

Les handlers CQS sont injectés directement dans le handler gRPC-Connect avec leur type concret. Pas de bus ni de string pour l'enregistrement.

## Fichiers à Créer

### 1. Configuration & Variables d'Environnement

**`.env.example`**
```env
# Server
PORT=8080
ENV=development

# Clever Cloud API
CLEVER_CLOUD_API_URL=https://api.clever-cloud.com
CLEVER_CLOUD_API_TOKEN=

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**`backend/internal/config/config.go`**
```go
package config

import "time"

type Config struct {
    Server      ServerConfig
    CleverCloud CleverCloudConfig
    CORS        CORSConfig
}

type ServerConfig struct {
    Port         string
    Env          string
    ReadTimeout  time.Duration
    WriteTimeout time.Duration
}

type CleverCloudConfig struct {
    APIURL   string
    APIToken string
}

type CORSConfig struct {
    AllowedOrigins []string
}

func (c *Config) IsDevelopment() bool {
    return c.Server.Env == "development"
}

func (c *Config) IsProduction() bool {
    return c.Server.Env == "production"
}
```

**`backend/internal/config/env.go`**
```go
package config

import (
    "os"
    "strings"
    "time"

    validation "github.com/go-ozzo/ozzo-validation/v4"
)

func Load() (*Config, error) {
    cfg := &Config{
        Server: ServerConfig{
            Port:         getEnvOrDefault("PORT", "8080"),
            Env:          getEnvOrDefault("ENV", "development"),
            ReadTimeout:  15 * time.Second,
            WriteTimeout: 15 * time.Second,
        },
        CleverCloud: CleverCloudConfig{
            APIURL:   getEnvOrDefault("CLEVER_CLOUD_API_URL", "https://api.clever-cloud.com"),
            APIToken: os.Getenv("CLEVER_CLOUD_API_TOKEN"),
        },
        CORS: CORSConfig{
            AllowedOrigins: strings.Split(getEnvOrDefault("CORS_ALLOWED_ORIGINS", ""), ","),
        },
    }

    if err := cfg.Validate(); err != nil {
        return nil, err
    }

    return cfg, nil
}

func getEnvOrDefault(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

// Validate valide la configuration serveur
func (c ServerConfig) Validate() error {
    return validation.ValidateStruct(&c,
        validation.Field(&c.Port, validation.Required),
        validation.Field(&c.Env, validation.Required, validation.In("development", "production")),
        validation.Field(&c.ReadTimeout, validation.Required, validation.Min(time.Second)),
        validation.Field(&c.WriteTimeout, validation.Required, validation.Min(time.Second)),
    )
}

// Validate valide la configuration Clever Cloud
func (c CleverCloudConfig) Validate() error {
    return validation.ValidateStruct(&c,
        validation.Field(&c.APIURL, validation.Required),
        // APIToken est optionnel en développement
    )
}

// Validate valide la configuration CORS
func (c CORSConfig) Validate() error {
    // Pas de validation requise pour CORS
    return nil
}

// Validate valide la configuration globale
func (c *Config) Validate() error {
    return validation.ValidateStruct(c,
        validation.Field(&c.Server),
        validation.Field(&c.CleverCloud),
        validation.Field(&c.CORS),
    )
}
```

### 2. Couche Domain

**`backend/internal/domain/entity/flavor.go`**
```go
package entity

type Flavor struct {
    Name         string
    Memory       int
    CPUs         int
    PricePerHour float64
    Available    bool
}
```

**`backend/internal/domain/entity/instance.go`**
```go
package entity

type Instance struct {
    Type    string
    Name    string
    Version string
    Flavors []Flavor
}
```

**`backend/internal/domain/entity/estimation.go`**
```go
package entity

type CostEstimation struct {
    ID             string
    ProjectID      string
    MinMonthlyCost float64
    MaxMonthlyCost float64
    RuntimeCosts   []RuntimeCost
    AddonCosts     []AddonCost
}

type RuntimeCost struct {
    RuntimeID string
    Name      string
    MinCost   float64
    MaxCost   float64
}

type AddonCost struct {
    AddonID string
    Name    string
    Cost    float64
}
```

**`backend/internal/domain/repository/pricing.go`**
```go
package repository

import (
    "context"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
)

type PricingRepository interface {
    ListInstances(ctx context.Context, zoneID string) ([]entity.Instance, error)
    GetInstancePrices(ctx context.Context, instanceType string) ([]entity.Flavor, error)
}

type EstimationRepository interface {
    Save(ctx context.Context, estimation *entity.CostEstimation) error
    FindByID(ctx context.Context, id string) (*entity.CostEstimation, error)
}
```

### 3. Couche Application - CQS (Handlers Typés)

**`backend/internal/application/query/list_instances.go`**
```go
package query

import (
    "context"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/repository"
)

// ListInstancesQuery - Query pour lister les instances
type ListInstancesQuery struct {
    ZoneID string
}

func (q ListInstancesQuery) QueryName() string {
    return "ListInstances"
}

// ListInstancesResult - Résultat de la query
type ListInstancesResult struct {
    Instances []entity.Instance
}

// ListInstancesHandler - Handler pour la query ListInstances
type ListInstancesHandler struct {
    pricingRepo repository.PricingRepository
}

func NewListInstancesHandler(pricingRepo repository.PricingRepository) *ListInstancesHandler {
    return &ListInstancesHandler{
        pricingRepo: pricingRepo,
    }
}

func (h *ListInstancesHandler) Handle(ctx context.Context, query ListInstancesQuery) (ListInstancesResult, error) {
    instances, err := h.pricingRepo.ListInstances(ctx, query.ZoneID)
    if err != nil {
        return ListInstancesResult{}, err
    }
    return ListInstancesResult{Instances: instances}, nil
}
```

**`backend/internal/application/query/get_estimation.go`**
```go
package query

import (
    "context"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/repository"
)

// GetEstimationQuery - Query pour récupérer une estimation
type GetEstimationQuery struct {
    EstimationID string
}

func (q GetEstimationQuery) QueryName() string {
    return "GetEstimation"
}

// GetEstimationResult - Résultat de la query
type GetEstimationResult struct {
    Estimation *entity.CostEstimation
}

// GetEstimationHandler - Handler pour la query GetEstimation
type GetEstimationHandler struct {
    estimationRepo repository.EstimationRepository
}

func NewGetEstimationHandler(estimationRepo repository.EstimationRepository) *GetEstimationHandler {
    return &GetEstimationHandler{
        estimationRepo: estimationRepo,
    }
}

func (h *GetEstimationHandler) Handle(ctx context.Context, query GetEstimationQuery) (GetEstimationResult, error) {
    estimation, err := h.estimationRepo.FindByID(ctx, query.EstimationID)
    if err != nil {
        return GetEstimationResult{}, err
    }
    return GetEstimationResult{Estimation: estimation}, nil
}
```

**`backend/internal/application/command/calculate_cost.go`**
```go
package command

import (
    "context"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/repository"
)

// CalculateCostCommand - Command pour calculer et sauvegarder une estimation
type CalculateCostCommand struct {
    ProjectID    string
    RuntimeSpecs []RuntimeSpec
    AddonSpecs   []AddonSpec
}

type RuntimeSpec struct {
    InstanceType string
    FlavorName   string
    MinInstances int
    MaxInstances int
}

type AddonSpec struct {
    ProviderID string
    PlanID     string
}

func (c CalculateCostCommand) CommandName() string {
    return "CalculateCost"
}

// CalculateCostHandler - Handler pour la command CalculateCost
type CalculateCostHandler struct {
    pricingRepo    repository.PricingRepository
    estimationRepo repository.EstimationRepository
}

func NewCalculateCostHandler(
    pricingRepo repository.PricingRepository,
    estimationRepo repository.EstimationRepository,
) *CalculateCostHandler {
    return &CalculateCostHandler{
        pricingRepo:    pricingRepo,
        estimationRepo: estimationRepo,
    }
}

func (h *CalculateCostHandler) Handle(ctx context.Context, cmd CalculateCostCommand) error {
    // Calculer les coûts
    estimation := &entity.CostEstimation{
        ProjectID: cmd.ProjectID,
    }

    // Calculer pour chaque runtime
    for _, spec := range cmd.RuntimeSpecs {
        flavors, err := h.pricingRepo.GetInstancePrices(ctx, spec.InstanceType)
        if err != nil {
            return err
        }

        var selectedFlavor *entity.Flavor
        for _, f := range flavors {
            if f.Name == spec.FlavorName {
                selectedFlavor = &f
                break
            }
        }

        if selectedFlavor != nil {
            hoursPerMonth := 720.0
            minCost := selectedFlavor.PricePerHour * hoursPerMonth * float64(spec.MinInstances)
            maxCost := selectedFlavor.PricePerHour * hoursPerMonth * float64(spec.MaxInstances)

            estimation.RuntimeCosts = append(estimation.RuntimeCosts, entity.RuntimeCost{
                RuntimeID: spec.InstanceType,
                Name:      spec.InstanceType,
                MinCost:   minCost,
                MaxCost:   maxCost,
            })

            estimation.MinMonthlyCost += minCost
            estimation.MaxMonthlyCost += maxCost
        }
    }

    // Sauvegarder l'estimation
    return h.estimationRepo.Save(ctx, estimation)
}
```

**`backend/internal/application/command/save_estimation.go`**
```go
package command

import (
    "context"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/repository"
)

// SaveEstimationCommand - Command pour sauvegarder une estimation
type SaveEstimationCommand struct {
    Estimation *entity.CostEstimation
}

func (c SaveEstimationCommand) CommandName() string {
    return "SaveEstimation"
}

// SaveEstimationHandler - Handler pour la command SaveEstimation
type SaveEstimationHandler struct {
    estimationRepo repository.EstimationRepository
}

func NewSaveEstimationHandler(estimationRepo repository.EstimationRepository) *SaveEstimationHandler {
    return &SaveEstimationHandler{
        estimationRepo: estimationRepo,
    }
}

func (h *SaveEstimationHandler) Handle(ctx context.Context, cmd SaveEstimationCommand) error {
    return h.estimationRepo.Save(ctx, cmd.Estimation)
}
```

### 4. Couche Adapter - Handler gRPC-Connect (Handlers Typés)

**`backend/internal/adapter/handler/pricing/handler.go`**
```go
package pricing

import (
    "context"

    "connectrpc.com/connect"
    pricingv1 "github.com/c18t-com/clever-pricing-calculator/backend/gen/proto/pricing/v1"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/application/command"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/application/query"
)

// Handler - gRPC-Connect handler avec injection directe des handlers typés
type Handler struct {
    listInstancesHandler   *query.ListInstancesHandler
    getEstimationHandler   *query.GetEstimationHandler
    calculateCostHandler   *command.CalculateCostHandler
    saveEstimationHandler  *command.SaveEstimationHandler
}

// NewHandler - Injection de dépendances avec types concrets (pas de string!)
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

func (h *Handler) ListInstances(
    ctx context.Context,
    req *connect.Request[pricingv1.ListInstancesRequest],
) (*connect.Response[pricingv1.ListInstancesResponse], error) {
    // Appel direct du handler typé
    result, err := h.listInstancesHandler.Handle(ctx, query.ListInstancesQuery{
        ZoneID: req.Msg.ZoneId,
    })
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // Mapper domain entities vers proto
    protoInstances := make([]*pricingv1.Instance, len(result.Instances))
    for i, inst := range result.Instances {
        protoFlavors := make([]*pricingv1.Flavor, len(inst.Flavors))
        for j, f := range inst.Flavors {
            protoFlavors[j] = &pricingv1.Flavor{
                Name:         f.Name,
                Mem:          int32(f.Memory),
                Cpus:         int32(f.CPUs),
                PricePerHour: f.PricePerHour,
                Available:    f.Available,
            }
        }
        protoInstances[i] = &pricingv1.Instance{
            Type:    inst.Type,
            Name:    inst.Name,
            Version: inst.Version,
            Flavors: protoFlavors,
        }
    }

    return connect.NewResponse(&pricingv1.ListInstancesResponse{
        Instances: protoInstances,
    }), nil
}

func (h *Handler) CalculateCost(
    ctx context.Context,
    req *connect.Request[pricingv1.CalculateCostRequest],
) (*connect.Response[pricingv1.CalculateCostResponse], error) {
    // Mapper les specs depuis le proto
    runtimeSpecs := make([]command.RuntimeSpec, len(req.Msg.RuntimeSpecs))
    for i, spec := range req.Msg.RuntimeSpecs {
        runtimeSpecs[i] = command.RuntimeSpec{
            InstanceType: spec.InstanceType,
            FlavorName:   spec.FlavorName,
            MinInstances: int(spec.MinInstances),
            MaxInstances: int(spec.MaxInstances),
        }
    }

    addonSpecs := make([]command.AddonSpec, len(req.Msg.AddonSpecs))
    for i, spec := range req.Msg.AddonSpecs {
        addonSpecs[i] = command.AddonSpec{
            ProviderID: spec.ProviderId,
            PlanID:     spec.PlanId,
        }
    }

    // Appel direct du handler typé
    err := h.calculateCostHandler.Handle(ctx, command.CalculateCostCommand{
        ProjectID:    req.Msg.ProjectId,
        RuntimeSpecs: runtimeSpecs,
        AddonSpecs:   addonSpecs,
    })
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    return connect.NewResponse(&pricingv1.CalculateCostResponse{
        Estimation: &pricingv1.CostEstimation{
            ProjectId: req.Msg.ProjectId,
        },
    }), nil
}

func (h *Handler) GetEstimation(
    ctx context.Context,
    req *connect.Request[pricingv1.GetEstimationRequest],
) (*connect.Response[pricingv1.GetEstimationResponse], error) {
    // Appel direct du handler typé
    result, err := h.getEstimationHandler.Handle(ctx, query.GetEstimationQuery{
        EstimationID: req.Msg.EstimationId,
    })
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    return connect.NewResponse(&pricingv1.GetEstimationResponse{
        Estimation: &pricingv1.CostEstimation{
            ProjectId:      result.Estimation.ProjectID,
            MinMonthlyCost: result.Estimation.MinMonthlyCost,
            MaxMonthlyCost: result.Estimation.MaxMonthlyCost,
        },
    }), nil
}

func (h *Handler) SaveEstimation(
    ctx context.Context,
    req *connect.Request[pricingv1.SaveEstimationRequest],
) (*connect.Response[pricingv1.SaveEstimationResponse], error) {
    // TODO: Mapper proto vers domain entity
    // Appel direct du handler typé
    err := h.saveEstimationHandler.Handle(ctx, command.SaveEstimationCommand{
        // Estimation: mappedEstimation,
    })
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    return connect.NewResponse(&pricingv1.SaveEstimationResponse{
        EstimationId: req.Msg.Estimation.GetProjectId(),
    }), nil
}
```

### 5. Couche Adapter - Repository

**`backend/internal/adapter/repository/pricing/clever_cloud.go`**
```go
package pricing

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"

    "github.com/c18t-com/clever-pricing-calculator/backend/internal/config"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
)

type CleverCloudRepository struct {
    client  *http.Client
    baseURL string
    token   string
}

func NewCleverCloudRepository(cfg *config.CleverCloudConfig) *CleverCloudRepository {
    return &CleverCloudRepository{
        client:  &http.Client{},
        baseURL: cfg.APIURL,
        token:   cfg.APIToken,
    }
}

func (r *CleverCloudRepository) ListInstances(ctx context.Context, zoneID string) ([]entity.Instance, error) {
    url := fmt.Sprintf("%s/v2/products/instances", r.baseURL)

    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil {
        return nil, err
    }

    if r.token != "" {
        req.Header.Set("Authorization", "Bearer "+r.token)
    }

    resp, err := r.client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var instances []entity.Instance
    if err := json.NewDecoder(resp.Body).Decode(&instances); err != nil {
        return nil, err
    }

    return instances, nil
}

func (r *CleverCloudRepository) GetInstancePrices(ctx context.Context, instanceType string) ([]entity.Flavor, error) {
    // Implémentation...
    return nil, nil
}
```

**`backend/internal/adapter/repository/estimation/memory.go`**
```go
package estimation

import (
    "context"
    "fmt"
    "sync"

    "github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/entity"
)

// MemoryRepository - Implémentation en mémoire pour le développement
type MemoryRepository struct {
    mu          sync.RWMutex
    estimations map[string]*entity.CostEstimation
}

func NewMemoryRepository() *MemoryRepository {
    return &MemoryRepository{
        estimations: make(map[string]*entity.CostEstimation),
    }
}

func (r *MemoryRepository) Save(ctx context.Context, estimation *entity.CostEstimation) error {
    r.mu.Lock()
    defer r.mu.Unlock()
    r.estimations[estimation.ID] = estimation
    return nil
}

func (r *MemoryRepository) FindByID(ctx context.Context, id string) (*entity.CostEstimation, error) {
    r.mu.RLock()
    defer r.mu.RUnlock()

    estimation, ok := r.estimations[id]
    if !ok {
        return nil, fmt.Errorf("estimation not found: %s", id)
    }
    return estimation, nil
}
```

### 6. Couche Infrastructure

**`backend/internal/infrastructure/server/http.go`**
```go
package server

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/c18t-com/clever-pricing-calculator/backend/internal/config"
)

type HTTPServer struct {
    server *http.Server
    cfg    *config.Config
}

func NewHTTPServer(cfg *config.Config, handler http.Handler) *HTTPServer {
    return &HTTPServer{
        cfg: cfg,
        server: &http.Server{
            Addr:         ":" + cfg.Server.Port,
            Handler:      handler,
            ReadTimeout:  cfg.Server.ReadTimeout,
            WriteTimeout: cfg.Server.WriteTimeout,
        },
    }
}

func (s *HTTPServer) Start() error {
    stop := make(chan os.Signal, 1)
    signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

    go func() {
        log.Printf("Server starting on :%s (env: %s)", s.cfg.Server.Port, s.cfg.Server.Env)
        if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Server error: %v", err)
        }
    }()

    <-stop
    log.Println("Shutting down server...")

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    if err := s.server.Shutdown(ctx); err != nil {
        return fmt.Errorf("server shutdown failed: %w", err)
    }

    log.Println("Server stopped gracefully")
    return nil
}
```

**`backend/internal/infrastructure/static/spa.go`**
```go
package static

import (
    "io/fs"
    "net/http"
    "strings"
)

type SPAHandler struct {
    fileServer http.Handler
    index      []byte
}

func NewSPAHandler(webFS fs.FS) (*SPAHandler, error) {
    index, err := fs.ReadFile(webFS, "index.html")
    if err != nil {
        return nil, err
    }

    return &SPAHandler{
        fileServer: http.FileServer(http.FS(webFS)),
        index:      index,
    }, nil
}

func (h *SPAHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    path := r.URL.Path

    if strings.HasPrefix(path, "/api/") {
        http.NotFound(w, r)
        return
    }

    if path != "/" && !strings.Contains(path, ".") {
        w.Header().Set("Content-Type", "text/html; charset=utf-8")
        w.Write(h.index)
        return
    }

    h.fileServer.ServeHTTP(w, r)
}
```

### 7. Injection de Dépendances (samber/do)

**`backend/internal/di/container.go`**
```go
package di

import (
    "io/fs"

    "github.com/samber/do/v2"

    "github.com/c18t-com/clever-pricing-calculator/backend/gen/proto/pricing/v1/pricingv1connect"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/config"
    pricingHandler "github.com/c18t-com/clever-pricing-calculator/backend/internal/adapter/handler/pricing"
    estimationRepo "github.com/c18t-com/clever-pricing-calculator/backend/internal/adapter/repository/estimation"
    pricingRepo "github.com/c18t-com/clever-pricing-calculator/backend/internal/adapter/repository/pricing"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/application/command"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/application/query"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/domain/repository"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/infrastructure/server"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/infrastructure/static"
)

// NewContainer crée et configure le conteneur d'injection de dépendances
func NewContainer(webFS fs.FS) *do.RootScope {
    injector := do.New()

    // ─── Configuration ─────────────────────────────────────
    do.Provide(injector, func(i do.Injector) (*config.Config, error) {
        return config.Load()
    })

    // ─── Repositories ──────────────────────────────────────
    do.Provide(injector, func(i do.Injector) (repository.PricingRepository, error) {
        cfg := do.MustInvoke[*config.Config](i)
        return pricingRepo.NewCleverCloudRepository(&cfg.CleverCloud), nil
    })

    do.Provide(injector, func(i do.Injector) (repository.EstimationRepository, error) {
        return estimationRepo.NewMemoryRepository(), nil
    })

    // ─── Query Handlers ────────────────────────────────────
    do.Provide(injector, func(i do.Injector) (*query.ListInstancesHandler, error) {
        repo := do.MustInvoke[repository.PricingRepository](i)
        return query.NewListInstancesHandler(repo), nil
    })

    do.Provide(injector, func(i do.Injector) (*query.GetEstimationHandler, error) {
        repo := do.MustInvoke[repository.EstimationRepository](i)
        return query.NewGetEstimationHandler(repo), nil
    })

    // ─── Command Handlers ──────────────────────────────────
    do.Provide(injector, func(i do.Injector) (*command.CalculateCostHandler, error) {
        pricingRepo := do.MustInvoke[repository.PricingRepository](i)
        estimationRepo := do.MustInvoke[repository.EstimationRepository](i)
        return command.NewCalculateCostHandler(pricingRepo, estimationRepo), nil
    })

    do.Provide(injector, func(i do.Injector) (*command.SaveEstimationHandler, error) {
        repo := do.MustInvoke[repository.EstimationRepository](i)
        return command.NewSaveEstimationHandler(repo), nil
    })

    // ─── gRPC-Connect Handler ──────────────────────────────
    do.Provide(injector, func(i do.Injector) (*pricingHandler.Handler, error) {
        return pricingHandler.NewHandler(
            do.MustInvoke[*query.ListInstancesHandler](i),
            do.MustInvoke[*query.GetEstimationHandler](i),
            do.MustInvoke[*command.CalculateCostHandler](i),
            do.MustInvoke[*command.SaveEstimationHandler](i),
        ), nil
    })

    do.Provide(injector, func(i do.Injector) (pricingv1connect.PricingServiceHandler, error) {
        handler := do.MustInvoke[*pricingHandler.Handler](i)
        return handler, nil
    })

    // ─── Infrastructure ────────────────────────────────────
    do.Provide(injector, func(i do.Injector) (*static.SPAHandler, error) {
        return static.NewSPAHandler(webFS)
    })

    do.Provide(injector, func(i do.Injector) (*server.HTTPServer, error) {
        cfg := do.MustInvoke[*config.Config](i)
        mux := do.MustInvoke[*http.ServeMux](i)
        return server.NewHTTPServer(cfg, mux), nil
    })

    return injector
}
```

### 8. Point d'entrée

**`backend/cmd/server/main.go`**
```go
package main

import (
    "embed"
    "io/fs"
    "log"
    "net/http"

    "github.com/samber/do/v2"

    "github.com/c18t-com/clever-pricing-calculator/backend/gen/proto/pricing/v1/pricingv1connect"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/adapter/handler/pricing"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/config"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/di"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/infrastructure/server"
    "github.com/c18t-com/clever-pricing-calculator/backend/internal/infrastructure/static"
)

//go:embed web/*
var webFS embed.FS

func main() {
    // Extraire le contenu web
    webContent, err := fs.Sub(webFS, "web")
    if err != nil {
        log.Fatalf("Failed to load web content: %v", err)
    }

    // Créer le conteneur DI
    injector := di.NewContainer(webContent)
    defer injector.Shutdown()

    // Récupérer les dépendances depuis le conteneur
    cfg := do.MustInvoke[*config.Config](injector)
    handler := do.MustInvoke[*pricing.Handler](injector)
    spaHandler := do.MustInvoke[*static.SPAHandler](injector)

    // Router
    mux := http.NewServeMux()

    // API gRPC-Connect sous /api/
    path, h := pricingv1connect.NewPricingServiceHandler(handler)
    mux.Handle("/api"+path, http.StripPrefix("/api", h))

    // Fichiers statiques du frontend
    mux.Handle("/", spaHandler)

    // Démarrer le serveur
    srv := server.NewHTTPServer(cfg, mux)
    if err := srv.Start(); err != nil {
        log.Fatalf("Server error: %v", err)
    }
}
```

### 9. Configuration Buf & Proto

**`buf.yaml`** (racine)
```yaml
version: v2
modules:
  - path: proto
    name: buf.build/c18t-com/clever-pricing-calculator
lint:
  use:
    - STANDARD
breaking:
  use:
    - FILE
```

**`buf.gen.yaml`**
```yaml
version: v2
managed:
  enabled: true
  override:
    - file_option: go_package_prefix
      value: github.com/c18t-com/clever-pricing-calculator/backend/gen/proto
plugins:
  - remote: buf.build/protocolbuffers/go
    out: backend/gen/proto
    opt: [paths=source_relative]
  - remote: buf.build/connectrpc/go
    out: backend/gen/proto
    opt: [paths=source_relative]
  - remote: buf.build/bufbuild/es
    out: frontend/src/gen/proto
    opt: [target=ts]
  - remote: buf.build/connectrpc/es
    out: frontend/src/gen/proto
    opt: [target=ts]
```

**`proto/pricing/v1/pricing_service.proto`**
```protobuf
syntax = "proto3";
package pricing.v1;

import "pricing/v1/pricing.proto";

option go_package = "github.com/c18t-com/clever-pricing-calculator/backend/gen/proto/pricing/v1;pricingv1";

service PricingService {
  // Queries (lecture)
  rpc ListInstances(ListInstancesRequest) returns (ListInstancesResponse);
  rpc GetEstimation(GetEstimationRequest) returns (GetEstimationResponse);

  // Commands (écriture)
  rpc CalculateCost(CalculateCostRequest) returns (CalculateCostResponse);
  rpc SaveEstimation(SaveEstimationRequest) returns (SaveEstimationResponse);
}

// Query messages
message ListInstancesRequest {
  string zone_id = 1;
}

message ListInstancesResponse {
  repeated Instance instances = 1;
}

message GetEstimationRequest {
  string estimation_id = 1;
}

message GetEstimationResponse {
  CostEstimation estimation = 1;
}

// Command messages
message CalculateCostRequest {
  string project_id = 1;
  repeated RuntimeSpec runtime_specs = 2;
  repeated AddonSpec addon_specs = 3;
}

message RuntimeSpec {
  string instance_type = 1;
  string flavor_name = 2;
  int32 min_instances = 3;
  int32 max_instances = 4;
}

message AddonSpec {
  string provider_id = 1;
  string plan_id = 2;
}

message CalculateCostResponse {
  CostEstimation estimation = 1;
}

message SaveEstimationRequest {
  CostEstimation estimation = 1;
}

message SaveEstimationResponse {
  string estimation_id = 1;
}
```

## Fichiers à Modifier/Déplacer

### Déplacer le frontend existant

```bash
mkdir -p frontend
mv src frontend/
mv public frontend/
mv index.html frontend/
mv package.json frontend/
mv pnpm-lock.yaml frontend/
mv vite.config.ts frontend/
mv tsconfig.json frontend/
mv tsconfig.app.json frontend/
mv tsconfig.node.json frontend/
mv biome.json frontend/
mv eslint.config.js frontend/
```

### `mise.toml` (mise à jour complète)
```toml
[tools]
node = "lts"
pnpm = "10.28.0"
go = "1.24"
buf = "latest"

# ─── Frontend ───────────────────────────────────────
[tasks.dev]
description = "Start frontend dev server"
run = "pnpm run dev"
dir = "frontend"

[tasks.lint]
description = "Lint frontend code"
run = "pnpm run lint"
dir = "frontend"

[tasks.format]
description = "Format frontend code"
run = "pnpm run format"
dir = "frontend"

[tasks.install]
description = "Install frontend dependencies"
run = "pnpm install"
dir = "frontend"

# ─── Backend ────────────────────────────────────────
[tasks."go:dev"]
description = "Start backend dev server"
run = "go run ./cmd/server"
dir = "backend"

[tasks."go:build"]
description = "Build backend binary"
run = "go build -o bin/server ./cmd/server"
dir = "backend"

[tasks."go:test"]
description = "Run backend tests"
run = "go test ./..."
dir = "backend"

[tasks."go:tidy"]
description = "Tidy backend dependencies"
run = "go mod tidy"
dir = "backend"

# ─── Proto ──────────────────────────────────────────
[tasks."proto:gen"]
description = "Generate code from proto files"
run = "buf generate"

[tasks."proto:lint"]
description = "Lint proto files"
run = "buf lint"

[tasks."proto:format"]
description = "Format proto files"
run = "buf format -w"

# ─── Build ──────────────────────────────────────────
[tasks."build:frontend"]
description = "Build frontend for production"
run = "pnpm run build"
dir = "frontend"

[tasks."build:embed"]
description = "Copy frontend build to backend"
run = "rm -rf backend/cmd/server/web && cp -r frontend/dist backend/cmd/server/web"

[tasks."build:backend"]
description = "Build backend for production"
run = "go build -o bin/server ./cmd/server"
dir = "backend"
depends = ["build:embed"]

[tasks."build:all"]
description = "Build everything for production"
depends = ["proto:gen", "build:frontend", "build:backend"]

# ─── Clean ──────────────────────────────────────────
[tasks.clean]
description = "Clean all generated files"
run = "rm -rf frontend/dist backend/bin backend/cmd/server/web frontend/src/gen/proto backend/gen/proto"
```

### `frontend/vite.config.ts` (mise à jour)
```typescript
import { defineConfig } from 'vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

### `frontend/package.json` (ajouter dépendances)
```json
{
  "dependencies": {
    "@connectrpc/connect": "^2.0.0",
    "@connectrpc/connect-web": "^2.0.0",
    "@bufbuild/protobuf": "^2.0.0"
  }
}
```

### `.gitignore` (mise à jour)
```gitignore
# Go
backend/bin/
backend/cmd/server/web/

# Fichiers générés par buf
frontend/src/gen/proto/
backend/gen/proto/
buf.lock

# Environment
.env
```

## Séquence d'Implémentation

1. **Déplacer le frontend** dans `frontend/`
2. **Créer `.env.example`** avec les variables documentées
3. **Mettre à jour mise.toml** - Ajouter Go 1.24, buf, et tous les tasks
4. **Créer l'infrastructure buf** - `buf.yaml`, `buf.gen.yaml`, `proto/`
5. **Créer les fichiers proto** - Messages et services
6. **Créer le backend Go** avec Clean Architecture + CQS + samber/do :
   - `internal/config/` - Configuration et validation env
   - `internal/domain/` - Entités et interfaces des repositories
   - `internal/application/query/` - Query handlers (typés directement)
   - `internal/application/command/` - Command handlers (typés directement)
   - `internal/adapter/handler/` - Handler gRPC avec injection directe
   - `internal/adapter/repository/` - Implémentations des repositories
   - `internal/di/` - Conteneur DI avec samber/do v2
   - `internal/infrastructure/` - Serveur HTTP et SPA
7. **Ajouter dépendances Go** :
   - `go get github.com/samber/do/v2`
   - `go get github.com/go-ozzo/ozzo-validation/v4`
8. **Générer le code** - `mise run proto:gen`
9. **Ajouter dépendances frontend** - `@connectrpc/*`
10. **Configurer le proxy Vite** - `/api` → backend
11. **Créer le client TypeScript** - `frontend/src/lib/connectClient.ts`

## Vérification

1. Copier `.env.example` vers `.env`
2. `mise run proto:lint` - Valider les fichiers proto
3. `mise run proto:gen` - Générer le code
4. `mise run go:dev` - Lancer backend (vérifie les env vars au démarrage)
5. `mise run dev` - Lancer frontend (proxy /api vers backend)
6. Tester un appel API (query + command)
7. `mise run build:all` - Build complet
8. `PORT=3000 ./backend/bin/server` - Tester avec différentes configs