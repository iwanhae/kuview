# Kuview Frontend Architecture

## Overview

Kuview is a real-time Kubernetes resource visualization web application that enables rapid troubleshooting through interactive dashboards. The frontend is built with React and integrates with a Go WebAssembly backend for real-time cluster monitoring.

## Technology Stack

### Core Technologies
- **React 19** - Main UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first styling framework

### Key Libraries
- **Jotai** - Atomic state management for real-time data
- **Wouter** - Lightweight client-side routing
- **Radix UI** - Accessible component primitives
- **TanStack Table** - Data table functionality
- **Lucide React** - Icon system
- **Day.js** - Date/time handling

### Backend Integration
- **Go WebAssembly** - Real-time Kubernetes API integration
- **Controller-Runtime** - Kubernetes event watching

## Application Structure

### Entry Point
```
src/main.tsx → src/App.tsx
```

The application bootstraps through React's `createRoot` and renders the main `App` component.

### Routing Architecture

**Router**: Wouter (client-side routing)

**Routes Structure**:
```
/                    → Root Dashboard (cluster overview)
/nodes              → Nodes Management Page  
/pods               → Pods Management Page
/debug              → Debug Information Page
```

### Layout System

**Main Layout Components**:
- `SidebarProvider` - Layout context for collapsible sidebar
- `AppSidebar` - Navigation sidebar with main menu items
- `SidebarInset` - Main content area
- `KuviewBackground` - Real-time data synchronization component

## State Management Architecture

### Primary State Management: Jotai Atoms

**Core State Structure**:
```typescript
kubernetesAtom: Record<GVK, ObjectAtom>
  └── ObjectAtom: Record<NamespaceName, KubernetesObject>
```

**Supported Resource Types**:
- `v1/Pod` - Pod objects and their status
- `v1/Node` - Node objects and their status  
- `v1/Service` - Service objects
- `v1/Namespace` - Namespace objects

### Data Flow Architecture

1. **Real-time Event Reception**
   - Go WASM backend watches Kubernetes API
   - Events published to global `window.kuview()` function
   - Events queued if frontend not ready

2. **State Synchronization**
   - `KuviewBackground` component handles event ingestion
   - Events processed through `handleEvent()` function
   - Debounced updates (100ms) to prevent excessive re-renders

3. **Component Data Access**
   - Components use `useKuview(gvk)` hook
   - Hook returns typed, reactive Kubernetes objects
   - Automatic re-rendering on state changes

### Event Processing Pipeline

```
Kubernetes API → Go WASM Controller → window.kuview() → handleEvent() → PENDING_CHANGES → useGVKSyncHook() → Component Re-render
```

## Component Architecture

### Page Components

**Root Dashboard** (`src/pages/root.tsx`)
- Cluster resource overview
- Resource status cards (Nodes, Namespaces, Pods)
- Nodes resource table
- Aggregated status calculations

**Pod Management** (`src/pages/pod.tsx`)
- Two-panel layout: Pod list + Pod details
- Real-time pod status visualization
- Pod search and filtering
- Detailed pod inspection

**Node Management** (`src/pages/node.tsx`)
- Node listing and status overview
- Node resource utilization
- Node health monitoring

### Block Components (`src/components/block/`)

**Resource Visualization**:
- `waffle-chart.tsx` - Grid-based resource status visualization
- `pod-waffle-chart.tsx` - Pod-specific status grids
- `treemap.tsx` - Hierarchical resource representation

**Detail Views**:
- `pod-detail.tsx` - Comprehensive pod information
- `node-detail.tsx` - Node specifications and status
- `metadata.tsx` - Kubernetes metadata display

**Status Components**:
- `pod-status.tsx` - Pod lifecycle and container status
- `node-status.tsx` - Node conditions and system info
- `status-badge.tsx` - Status indicator badges

**Resource Tables**:
- `nodes-resource-table.tsx` - Node listing with metrics
- `table-node.tsx` - Node-specific table formatting

**Search & Navigation**:
- `search.tsx` - Universal resource search component
- `search-input.tsx` - Search input with filtering

### UI System (`src/components/ui/`)

Built on Radix UI primitives with custom styling:
- `sidebar.tsx` - Collapsible navigation sidebar
- `table.tsx` - Data table components
- `card.tsx` - Content cards
- `badge.tsx` - Status badges
- `button.tsx` - Interactive buttons
- `tooltip.tsx` - Contextual tooltips
- Additional form and layout components

### Utility Libraries

**Status Processing** (`src/lib/status.ts`)
- `podStatus()` - Pod health calculation
- `nodeStatus()` - Node health calculation  
- `namespaceStatus()` - Namespace status evaluation
- Status aggregation utilities

**Kubernetes Types** (`src/lib/kuview.ts`)
- Complete TypeScript definitions for Kubernetes objects
- Type-safe object access and manipulation
- Generic typing for different resource kinds

**Utilities** (`src/lib/utils.ts`)
- Tailwind class merging
- Common utility functions

## Real-time Data Integration

### WebAssembly Backend Integration

**Go WASM Controller**:
- Runs Kubernetes controller-runtime in browser
- Watches multiple resource types simultaneously
- Emits structured events to frontend

**Event Types**:
```typescript
type KuviewEvent = {
  type: "create" | "update" | "delete" | "generic";
  object: KubernetesObject;
}
```

### Performance Optimizations

**Debouncing**: 100ms debounce on state updates to prevent render thrashing
**Selective Updates**: Only affected components re-render via Jotai's atomic updates
**Event Queuing**: Events queued during initialization to prevent data loss
**Efficient Reconciliation**: React's concurrent features for smooth UI updates

## Development Workflow

### Build Process
```bash
npm run dev     # Development server with HMR
npm run build   # Production build (TypeScript + Vite)
npm run wasm    # Compile Go WASM backend
npm run preview # Serve built application via kubectl proxy
```

### Code Organization Principles

**Separation of Concerns**:
- Pages handle routing and layout
- Blocks handle business logic and data display  
- UI components are pure presentation
- Hooks manage state and side effects
- Lib contains utilities and types

**Type Safety**:
- Complete TypeScript coverage
- Kubernetes object type definitions
- Generic typing for resource kinds
- Compile-time error prevention

## Deployment Architecture

**Static Deployment**: Frontend builds to static assets
**Kubernetes Integration**: Served through `kubectl proxy`
**WASM Backend**: Compiled Go binary runs in browser
**No Server Dependencies**: Completely client-side application

## Monitoring and Debugging

**Debug Page** (`/debug`): Development tools and cluster state inspection
**Console Logging**: Structured logging for event processing
**Error Boundaries**: Graceful error handling and recovery
**Development Tools**: React DevTools and browser debugging support

This architecture enables real-time, responsive Kubernetes cluster visualization with minimal infrastructure requirements while maintaining type safety and performance.
