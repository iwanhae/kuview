# Kuview Types

This directory contains TypeScript type definitions for Kubernetes resources used in the Kuview library.

## Adding New Resource Types

To add a new Kubernetes resource type to the Kuview library, follow these steps:

### 1. Create a New Type File

Create a new TypeScript file for your resource type in this directory. Use kebab-case naming convention:

```
src/lib/kuview/your-resource.ts
```

### 2. Define the Resource Types

In your new file, define the main resource object type and any supporting interfaces:

```typescript
import type { Metadata } from "./types";

export interface YourResourceObject {
  kind: "YourResource";
  apiVersion: "your-api-version";
  metadata: Metadata;
  // Add other required fields based on the Kubernetes resource spec
  spec?: YourResourceSpec;
  status?: YourResourceStatus;
}

export interface YourResourceSpec {
  // Define spec fields
}

export interface YourResourceStatus {
  // Define status fields
}
```

### 3. Export from Index

Add your new resource to the main index file (`index.ts`):

1. Add the export statement:
```typescript
export * from "./your-resource";
```

2. Import the main resource type:
```typescript
import type { YourResourceObject } from "./your-resource";
```

3. Add to the `KuviewObjectMap`:
```typescript
export interface KuviewObjectMap {
  // ... existing mappings
  "your-api-version/YourResource": YourResourceObject;
}
```

### 4. Example: Adding NodeMetrics

Here's a complete example of how NodeMetrics was added:

**File: `node-metrics.ts`**
```typescript
import type { Metadata } from "./types";

export interface NodeMetricsObject {
  kind: "NodeMetrics";
  apiVersion: "metrics.k8s.io/v1beta1";
  metadata: Metadata;
  timestamp: string;
  window: string;
  usage: NodeMetricsUsage;
}

export interface NodeMetricsUsage {
  cpu: string;
  memory: string;
}
```

**Updates to `index.ts`**
```typescript
// Add export
export * from "./node-metrics";

// Add import
import type { NodeMetricsObject } from "./node-metrics";

// Add to object map
export interface KuviewObjectMap {
  // ... other mappings
  "metrics.k8s.io/v1beta1/NodeMetrics": NodeMetricsObject;
}
```

## Type Conventions

### Naming Conventions

- **File names**: Use kebab-case (e.g., `node-metrics.ts`, `endpoint-slice.ts`)
- **Main object types**: Use PascalCase with "Object" suffix (e.g., `NodeMetricsObject`, `PodObject`)
- **Supporting interfaces**: Use PascalCase (e.g., `NodeMetricsUsage`, `PodSpec`)

### Structure Guidelines

- Always import `Metadata` from `"./types"` for the metadata field
- Use the exact `kind` and `apiVersion` values as string literals
- Group related interfaces in the same file
- Export all public interfaces
- Follow the existing pattern for spec/status fields when applicable

### Object Map Keys

The keys in `KuviewObjectMap` should follow the format:
- For core API: `"v1/ResourceKind"`
- For other APIs: `"api-group/version/ResourceKind"`

Examples:
- `"v1/Pod"`
- `"v1/Service"`
- `"metrics.k8s.io/v1beta1/NodeMetrics"`
- `"discovery.k8s.io/v1/EndpointSlice"`

## Usage

Once added, your new types can be used in two ways:

```typescript
// Direct import
import type { YourResourceObject } from './src/lib/kuview';

// Via the object map
import type { KuviewObjectType } from './src/lib/kuview';
type YourResource = KuviewObjectType<'your-api-version/YourResource'>;
```

## Common Base Types

The following base types are available in `types.ts`:

- `Metadata`: Standard Kubernetes metadata
- `KubernetesObject`: Base interface for all Kubernetes objects
- `Labels`, `Annotations`: Key-value pairs for metadata
- `ResourceList`: Resource quantities (CPU, memory, etc.)
- `ObjectReference`: References to other Kubernetes objects

Use these base types to maintain consistency across resource definitions. 