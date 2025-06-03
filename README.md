# KuView - Kubernetes Real-time Monitor

KuView is a project designed to help you monitor your Kubernetes clusters in real-time. It provides a read-only view of your cluster's resources, focusing on delivering timely updates to a web-based user interface. This project does not aim to modify any Kubernetes resources; its sole purpose is observation and monitoring.

## Data Flow Architecture

The data flow in KuView is designed to efficiently stream Kubernetes resource updates from a Go-based WebAssembly (Wasm) module to a React frontend, using Zustand for state management.

1.  **Kubernetes Event Watching (`main.go`)**:

    - The Go program (`main.go`) is compiled into WebAssembly (`main.wasm`).
    - It runs in the browser environment and connects to your Kubernetes cluster (via the credentials/configuration accessible to the browser or a proxy).
    - It utilizes the Kubernetes client-go library, specifically controller-runtime, to watch for changes (Create, Update, Delete) in specified Kubernetes resources (e.g., Nodes, Pods, Services).
    - When a change is detected for a watched resource, `main.go` emits an event containing the resource's kind, apiVersion, and metadata.
    - These events are dispatched to a JavaScript function `document.kuview(event)` defined in the global scope.

2.  **Initial Event Handling & Queuing (`index.html`)**:

    - The main `index.html` file loads the `wasm_exec.js` runtime and `main.wasm`.
    - Before the Wasm module fully initializes and before React mounts, `index.html` defines an initial `document.kuview` function.
    - This initial function doesn't process the events immediately. Instead, it pushes incoming events into a global array: `window.kuviewEventQueue`.
    - This queuing mechanism prevents event loss if the Go Wasm module starts emitting events before the React application is ready to handle them.

3.  **React Event Handler Setup & Queue Processing (`src/backgrounds/kuview.tsx`)**:

    - A React component, `KuviewBackground`, is responsible for bridging the Wasm events to the React state management system.
    - When `KuviewBackground` mounts (in a `useEffect` hook):
      1.  It first checks `window.kuviewEventQueue` for any events that were queued before it mounted.
      2.  It processes each queued event by passing it to the `handleEvent` function from the Zustand store.
      3.  After processing the queue, it clears `window.kuviewEventQueue`.
      4.  It then overwrites `document.kuview` with a new function. This new function directly calls the `handleEvent` action from the Zustand store for any subsequent events.
    - A cleanup function in `useEffect` ensures that if `KuviewBackground` unmounts, `document.kuview` is reset (e.g., to a function that logs or re-queues events) to prevent errors.

4.  **State Management with Zustand (`src/lib/kuview.ts`)**:
    - The Zustand store defined in `src/lib/kuview.ts` is the central hub for managing the state of Kubernetes resources displayed in the UI.
    - **Hierarchical State Structure**:
      - The store maintains a primary `objects` state.
      - This state is a nested record:
        - The first level key is a string combining the resource's API version and kind: `"{apiVersion}/{kind}"` (e.g., `"v1/Node"`, `"v1/Pod"`).
        - The second level key identifies the specific resource:
          - For namespaced resources: `"{namespace}/{name}"` (e.g., `"default/my-app-pod"`).
          - For cluster-scoped resources (like Nodes): `"{name}"` (e.g., `"my-worker-node"`).
      - The value stored is a `StoredKubernetesObject`, containing essential fields like `kind`, `apiVersion`, and `metadata`.
    - **Debounced Updates**:
      - To optimize performance and avoid excessive state updates and re-renders from a high volume of events, the `handleEvent` action implements a debouncing mechanism.
      - When an event arrives, instead of immediately updating the store, the change (upsert or delete) is recorded in a temporary `PENDING_CHANGES` map.
      - A 100ms timer is started (or reset if already active).
      - When the timer expires, all accumulated changes in `PENDING_CHANGES` are applied to the Zustand store in a single batch operation using `immer` for efficient immutable updates.
    - **Selective Subscriptions**: React components can subscribe to specific slices of this state (e.g., only Nodes, or only Pods in a particular namespace), ensuring they only re-render when relevant data changes.

This architecture allows KuView to provide a responsive, real-time view of Kubernetes resources while managing state updates efficiently.
