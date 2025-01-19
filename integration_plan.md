# AI Chatbot Integration Plan with CAP Portal

## Current Architecture
1. **AI Chatbot (Next.js/TypeScript)**
   - Modern Next.js application with TypeScript
   - PostgreSQL database for chat history/authentication
   - OpsGenie integration for alerts and on-call management
   - Tool-use feature with LMStudio LLM model

2. **CAP Portal (ASP.NET Core)**
   - Existing ASP.NET Core application
   - Active Directory authentication
   - React components in wwwroot folder

## Integration Strategy

### 1. Authentication Integration
1. **Remove PostgreSQL Authentication**
   - Remove existing authentication code from Next.js app
   - Keep PostgreSQL only for chat history and tool states

2. **Implement AD Authentication**
   - Create new middleware in Next.js app to validate AD tokens
   - Share authentication cookies between CAP portal and chatbot
   - Add AD authentication check to API routes
   ```typescript
   // middleware.ts
   import { NextResponse } from 'next/server'
   import type { NextRequest } from 'next/server'
   
   export function middleware(request: NextRequest) {
     // Validate AD token from CAP portal
     const adToken = request.cookies.get('ADAuthToken')
     if (!adToken) {
       return NextResponse.redirect('/unauthorized')
     }
     return NextResponse.next()
   }
   ```

### 2. Build and Deployment

1. **Build Configuration**
   ```json
   // next.config.ts
   module.exports = {
     output: 'export',  // Static HTML export
     basePath: '/chatbot', // Sub-path in CAP portal
     assetPrefix: '/chatbot/', // Prefix for assets
     trailingSlash: true, // Required for static export
   }
   ```

2. **Deployment Steps**
   ```powershell
   # Build Next.js app
   npm run build
   
   # Copy to CAP Portal
   Copy-Item -Path "out/*" -Destination "C:/Git/self_service_portal/WCXCloudSelfServiceUI/wwwroot/chatbot/" -Recurse
   ```

3. **ASP.NET Integration**
   ```csharp
   // Startup.cs
   public void Configure(IApplicationBuilder app)
   {
       app.UseStaticFiles(); // Serve static Next.js files
       app.UseRouting();
       
       app.UseEndpoints(endpoints =>
       {
           endpoints.MapFallbackToFile("/chatbot/{**path}", "chatbot/index.html");
       });
   }
   ```

### 3. API Integration

1. **Proxy Configuration**
   ```typescript
   // next.config.ts
   module.exports = {
     async rewrites() {
       return [
         {
           source: '/api/:path*',
           destination: 'http://localhost:5000/api/:path*'
         }
       ]
     }
   }
   ```

2. **API Authentication**
   ```typescript
   // lib/api.ts
   export async function fetchWithAuth(url: string, options = {}) {
     const response = await fetch(url, {
       ...options,
       credentials: 'include', // Include AD cookies
       headers: {
         ...options.headers,
         'X-AD-Auth': 'true'
       }
     })
     return response
   }
   ```

### 4. UI Integration

1. **Layout Adjustments**
   - Match CAP portal's theme and styling
   - Use shared components where possible
   - Implement responsive design for seamless integration

2. **Navigation**
   ```typescript
   // components/Layout.tsx
   export default function Layout({ children }) {
     return (
       <div className="cap-portal-layout">
         <nav className="cap-portal-nav">
           {/* Shared navigation */}
         </nav>
         <main>{children}</main>
       </div>
     )
   }
   ```

### 5. Database Updates

1. **PostgreSQL Schema**
   ```sql
   -- Remove auth tables, keep chat related tables
   DROP TABLE IF EXISTS users;
   DROP TABLE IF EXISTS sessions;
   
   -- Add AD user reference
   ALTER TABLE chat_history 
   ADD COLUMN ad_username varchar(255);
   ```

2. **Environment Configuration**
   ```env
   # .env
   DATABASE_URL=postgresql://user:pass@localhost:5432/chatbot
   AD_AUTH_COOKIE_NAME=ADAuthToken
   CAP_PORTAL_URL=http://localhost:5000
   ```

## Implementation Steps

1. **Phase 1: Authentication**
   - Remove PostgreSQL auth
   - Implement AD token validation
   - Test authentication flow

2. **Phase 2: Build Process**
   - Update Next.js config
   - Create build scripts
   - Test static export

3. **Phase 3: API Integration**
   - Set up API proxying
   - Implement shared authentication
   - Test API endpoints

4. **Phase 4: UI Integration**
   - Apply CAP portal styling
   - Test responsive design
   - Implement shared components

5. **Phase 5: Database Migration**
   - Update PostgreSQL schema
   - Migrate existing data
   - Test data persistence

## Testing Plan

1. **Authentication Testing**
   - Verify AD token validation
   - Test unauthorized scenarios
   - Check token persistence

2. **Integration Testing**
   - Test API endpoints
   - Verify data flow
   - Check error handling

3. **UI Testing**
   - Test responsive design
   - Verify styling consistency
   - Check navigation flow

4. **Performance Testing**
   - Load testing
   - Response time monitoring
   - Resource usage analysis

## Monitoring and Maintenance

1. **Error Tracking**
   - Implement error logging
   - Set up monitoring alerts
   - Create error reporting system

2. **Performance Monitoring**
   - Track API response times
   - Monitor resource usage
   - Set up performance alerts

3. **Updates and Maintenance**
   - Regular dependency updates
   - Security patches
   - Feature updates

## Security Considerations

1. **Authentication**
   - Secure AD token handling
   - HTTPS enforcement
   - CSRF protection

2. **API Security**
   - Rate limiting
   - Input validation
   - Data encryption

3. **Data Protection**
   - Sensitive data handling
   - Data retention policies
   - Backup procedures



I've created a comprehensive modular integration plan at C:\Users\vig\CascadeProjects\ai-chatbot\modular_integration_plan.md that focuses on:

Micro-Frontend Architecture
Each feature is a self-contained module
Shared infrastructure for common functionality
Feature-based routing and deployment
Core Infrastructure
Shared authentication
API client module
State management
Component library
Feature Module Structure
Standardized structure for all features
Independent build and deployment
Feature-specific state and API endpoints
Development Workflow
Feature creation templates
Development tools
Testing strategy
CI/CD setup
Security & Monitoring
Feature-level authorization
Usage tracking
Performance monitoring
Rollback capabilities
This approach allows you to:

Add new features independently
Share common functionality
Deploy features separately
Maintain consistent code structure
Scale efficiently
Would you like me to:

Start implementing the core infrastructure?
Create a feature template generator?
Set up the build system for multiple features?
Explain any specific part in more detail?