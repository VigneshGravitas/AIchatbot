# Modular Next.js Features Integration with CAP Portal

## Architecture Overview

### 1. Micro-Frontend Architecture
```
CAP Portal (ASP.NET Core)
├── wwwroot/
│   ├── features/
│   │   ├── chatbot/      # AI Chatbot feature
│   │   ├── dashboard/    # Analytics Dashboard
│   │   ├── alerts/       # Alert Management
│   │   └── settings/     # User Settings
│   └── shared/           # Shared assets
└── Areas/
    └── Features/         # Backend controllers
```

### 2. Shared Infrastructure

#### 2.1 Authentication Module
```typescript
// lib/auth/index.ts
export interface AuthModule {
  validateToken: (token: string) => Promise<boolean>
  getCurrentUser: () => Promise<ADUser>
  hasPermission: (permission: string) => Promise<boolean>
}

// lib/auth/ad-auth.ts
export class ADAuthProvider implements AuthModule {
  // Implementation for AD authentication
}
```

#### 2.2 API Client Module
```typescript
// lib/api/client.ts
export class APIClient {
  constructor(
    private baseUrl: string,
    private authModule: AuthModule
  ) {}

  async request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    // Handles authentication, errors, and requests
  }
}
```

#### 2.3 State Management
```typescript
// lib/store/index.ts
export interface AppState {
  features: {
    [featureKey: string]: unknown
  }
  shared: SharedState
}

// Example Redux setup with feature-based splitting
const store = configureStore({
  reducer: {
    features: combineReducers({
      chatbot: chatbotReducer,
      dashboard: dashboardReducer,
      // Add more feature reducers
    }),
    shared: sharedReducer
  }
})
```

### 3. Feature Module Structure

Each feature follows this structure:
```
features/
└── [feature-name]/
    ├── api/           # Feature-specific API calls
    ├── components/    # UI components
    ├── hooks/         # Custom hooks
    ├── store/         # State management
    ├── types/         # TypeScript types
    ├── utils/         # Helper functions
    └── index.ts       # Feature entry point
```

Example Feature Module:
```typescript
// features/chatbot/index.ts
export interface ChatbotModule {
  mount: (element: HTMLElement) => void
  unmount: () => void
  getState: () => ChatbotState
}

export class Chatbot implements ChatbotModule {
  constructor(
    private auth: AuthModule,
    private api: APIClient
  ) {}
  
  // Implementation
}
```

### 4. Build System

#### 4.1 Webpack Configuration
```typescript
// next.config.ts
module.exports = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.plugins.push(new webpack.container.ModuleFederationPlugin({
      name: 'cap_portal',
      filename: 'remoteEntry.js',
      remotes: {
        chatbot: 'chatbot@/features/chatbot/remoteEntry.js',
        dashboard: 'dashboard@/features/dashboard/remoteEntry.js',
      },
      shared: ['react', 'react-dom']
    }))
    return config
  }
}
```

#### 4.2 Feature-Specific Builds
```json
{
  "scripts": {
    "build:chatbot": "next build src/features/chatbot",
    "build:dashboard": "next build src/features/dashboard",
    "build:all": "npm run build:chatbot && npm run build:dashboard"
  }
}
```

### 5. Integration Points

#### 5.1 ASP.NET Core Integration
```csharp
// Startup.cs
public void Configure(IApplicationBuilder app)
{
    app.UseStaticFiles();
    
    app.Map("/features", features => {
        features.UseMiddleware<FeatureMiddleware>();
        features.UseEndpoints(endpoints => {
            endpoints.MapFallbackToFile("/chatbot/{**path}", 
                "features/chatbot/index.html");
            endpoints.MapFallbackToFile("/dashboard/{**path}", 
                "features/dashboard/index.html");
        });
    });
}
```

#### 5.2 Feature Registration
```typescript
// lib/features/registry.ts
export class FeatureRegistry {
  private features: Map<string, FeatureModule> = new Map()

  register(name: string, module: FeatureModule) {
    this.features.set(name, module)
  }

  getFeature(name: string): FeatureModule | undefined {
    return this.features.get(name)
  }
}
```

### 6. Shared Components Library

```typescript
// lib/components/index.ts
export { Button } from './Button'
export { Card } from './Card'
export { Layout } from './Layout'
export { Navigation } from './Navigation'

// Usage in features
import { Button, Card } from '@cap/shared-components'
```

## Implementation Strategy

### Phase 1: Core Infrastructure
1. Set up shared authentication module
2. Implement API client
3. Create state management foundation
4. Build shared component library

### Phase 2: Feature Framework
1. Create feature module template
2. Set up build system for multiple features
3. Implement feature registry
4. Create development tools for features

### Phase 3: First Feature (Chatbot)
1. Migrate existing chatbot to new structure
2. Implement feature-specific state management
3. Add feature-specific API endpoints
4. Test integration with core infrastructure

### Phase 4: Additional Features
1. Create feature template generator
2. Document feature development process
3. Set up CI/CD for feature deployment
4. Implement feature toggle system

## Development Workflow

1. **New Feature Development**
```bash
# Create new feature
npm run create-feature my-feature

# Development
npm run dev:my-feature

# Build
npm run build:my-feature

# Test
npm run test:my-feature

# Deploy
npm run deploy:my-feature
```

2. **Feature Integration**
```typescript
// pages/_app.tsx
import { FeatureRegistry } from '@/lib/features'
import { ChatbotFeature } from '@/features/chatbot'
import { DashboardFeature } from '@/features/dashboard'

const registry = new FeatureRegistry()
registry.register('chatbot', new ChatbotFeature())
registry.register('dashboard', new DashboardFeature())
```

## Testing Strategy

### 1. Unit Testing
```typescript
// features/chatbot/__tests__/chatbot.test.ts
describe('Chatbot Feature', () => {
  it('initializes with auth module', () => {
    const chatbot = new ChatbotFeature(authModule)
    expect(chatbot.isInitialized()).toBe(true)
  })
})
```

### 2. Integration Testing
```typescript
// tests/integration/features.test.ts
describe('Feature Integration', () => {
  it('loads features dynamically', async () => {
    const registry = new FeatureRegistry()
    await registry.loadFeature('chatbot')
    expect(registry.isFeatureLoaded('chatbot')).toBe(true)
  })
})
```

## Monitoring and Analytics

### 1. Feature Usage Tracking
```typescript
// lib/analytics/index.ts
export class FeatureAnalytics {
  trackFeatureUsage(feature: string, action: string) {
    // Implementation
  }
  
  getFeatureMetrics(feature: string): Metrics {
    // Implementation
  }
}
```

### 2. Performance Monitoring
```typescript
// lib/monitoring/index.ts
export class PerformanceMonitor {
  trackFeatureLoad(feature: string) {
    // Track load time
  }
  
  trackApiLatency(endpoint: string) {
    // Track API response time
  }
}
```

## Security Considerations

### 1. Feature-Level Authorization
```typescript
// lib/auth/feature-auth.ts
export class FeatureAuthorization {
  canAccessFeature(user: ADUser, feature: string): boolean {
    // Check user permissions for specific feature
  }
  
  getFeaturePermissions(feature: string): Permission[] {
    // Get required permissions for feature
  }
}
```

### 2. API Security
```typescript
// lib/api/security.ts
export class ApiSecurity {
  validateRequest(req: Request) {
    // Validate CSRF token
    // Check feature-specific permissions
    // Rate limiting
  }
}
```

## Deployment Strategy

### 1. Feature-Based Deployment
```yaml
# .github/workflows/feature-deploy.yml
name: Feature Deployment
on:
  push:
    paths:
      - 'features/**'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Detect Changed Features
        id: changes
        run: |
          # Detect which features changed
          # Build and deploy only changed features
```

### 2. Rollback Strategy
```typescript
// lib/deployment/rollback.ts
export class FeatureRollback {
  async rollbackFeature(feature: string, version: string) {
    // Implementation
  }
  
  async getFeatureVersions(feature: string): Promise<Version[]> {
    // Implementation
  }
}
```
