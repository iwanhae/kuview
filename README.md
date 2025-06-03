# KuView: In-Browser Kubernetes Dashboard

KuView is a real-time, read-only Kubernetes dashboard that operates entirely within your web browser. It offers an immediate and comprehensive overview of your cluster's status and resource utilization without requiring any server-side installation or kubectl plugins.

## Core Features

- **Real-time Monitoring**: Observe live updates of resource states and events within your cluster.
- **Comprehensive Resource Visualization**: Monitor CPU and memory usage with clear, visual indicators and progress bars.
- **Zero Installation**: KuView requires no installation on your cluster or local machine beyond `kubectl` access.
- **Secure Read-only Access**: Operates in a strictly read-only mode, ensuring no modifications to your cluster state.
- **High-Performance Client**: Leverages a WebAssembly-based Kubernetes client for efficient in-browser operation.
- **Responsive User Interface**: Provides a consistent experience across desktop, tablet, and mobile devices.
- **Modern UI/UX**: Features a clean, intuitive interface built with React for optimal user experience.

## Quick Start Guide

To begin monitoring your Kubernetes cluster:

```bash
# Download and extract the latest release
curl -sL https://r2.iwanhae.kr/kuview/latest.tar.gz | tar xvz

# Initiate the dashboard (requires kubectl configured for your cluster)
kubectl proxy -w ./dist
```

Navigate to **http://127.0.0.1:8001/static** in your web browser.

## Functional Overview

KuView provides a detailed perspective on various aspects of your cluster:

### Cluster Summary
- Aggregated resource utilization across all nodes.
- Overall CPU and memory usage metrics, aiding in capacity planning.
- Health status of core cluster components.

### Node Monitoring
- Resource consumption metrics for individual nodes.
- Distribution of pods across available nodes.
- Health and operational status indicators for each node.

### Pod Management
- Real-time status updates for all pods.
- Comparison of resource requests versus limits.
- Tracking of pod lifecycles and events.

### Namespace-Based Organization
- Resource views filtered by namespace.
- Health status summaries per namespace.
- Monitoring of resource quota utilization.

## Technical Architecture

KuView's architecture enables direct Kubernetes monitoring within the browser:

1.  **WebAssembly (Wasm) Kubernetes Client**: A Go-based Kubernetes client, compiled to WebAssembly, runs natively in the browser.
2.  **Client-Side Operation**: The entire application operates client-side, eliminating the need for a backend server component.
3.  **Real-time Data Streaming**: Utilizes Kubernetes watch APIs to stream updates directly to the browser for instantaneous feedback.
4.  **Efficient State Management**: Employs Zustand for state management, with debounced updates to ensure optimal rendering performance and responsiveness.

## System Requirements

- **kubectl**: Configured with access to your target Kubernetes cluster.
- **Web Browser**: A modern web browser with WebAssembly support (e.g., Chrome, Firefox, Safari, Edge).
- **Network Connectivity**: Access to the Kubernetes API server from the machine running the browser.

## Benefits of KuView

- **No Infrastructure Overhead**: Avoids the need to deploy and maintain additional monitoring solutions within your cluster.
- **Rapid Deployment**: Transition from initial setup to active monitoring in under a minute.
- **Lightweight Design**: Minimal impact on system resources.
- **Enhanced Security**: Leverages your existing `kubectl` configuration and RBAC policies for secure, read-only access. All data processing occurs within the browser.
- **Developer-Focused**: Ideal for local development clusters, application debugging, and rapid troubleshooting.

## Target Use Cases

- **Developers**: Debugging applications and observing resource interactions.
- **DevOps Engineers**: Monitoring cluster health and performance.
- **Platform Teams**: Providing standardized cluster visibility to users.
- **Kubernetes Learners**: Exploring Kubernetes resources and concepts interactively.
- **General Users**: Gaining quick and accessible insights into cluster status.

## Security Considerations

KuView is designed with security as a primary consideration:
- Utilizes the security context of your existing `kubectl` configuration and respects defined RBAC policies.
- No data is transmitted outside of the user's browser to any external server.
- All operations are strictly read-only, preventing any modification to the cluster state.

## Contributing

Contributions are welcome. Please refer to the [contribution guidelines](CONTRIBUTING.md) for details on:
- Reporting bugs
- Requesting features
- Improving documentation
- Submitting code changes

## License

KuView is distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

Begin exploring your Kubernetes cluster with KuView using the Quick Start commands provided above.
