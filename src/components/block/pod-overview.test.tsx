import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import PodOverview from "./pod-overview";
import { SWRConfig } from "swr";
import { PodObject, NodeObject, ServiceObject, PodMetrics } from "@/lib/kuview"; // Adjust path as necessary

// Mock the useKuview hook
jest.mock("@/hooks/useKuview", () => ({
  useKuview: jest.fn(),
}));

// Mock the fetch API for SWR
global.fetch = jest.fn();

const mockPod: PodObject = {
  kind: "Pod",
  apiVersion: "v1",
  metadata: {
    name: "test-pod",
    namespace: "test-namespace",
    uid: "test-uid",
    resourceVersion: "1",
    creationTimestamp: new Date().toISOString(),
    labels: { app: "my-app", tier: "frontend" },
  },
  spec: {
    nodeName: "test-node",
    containers: [
      { name: "container1", image: "image1" },
    ],
  },
  status: {
    phase: "Running",
    hostIP: "192.168.1.100",
    podIP: "10.0.0.5",
  },
};

const mockNode: NodeObject = {
  kind: "Node",
  apiVersion: "v1",
  metadata: {
    name: "test-node",
    uid: "node-uid",
    resourceVersion: "1",
    creationTimestamp: new Date().toISOString(),
  },
  spec: {},
  status: {
    conditions: [{ type: "Ready", status: "True", lastTransitionTime: new Date().toISOString() }],
    nodeInfo: {
      osImage: "Test OS",
      kubeletVersion: "v1.28.0",
      architecture: "amd64",
      bootID: "bootid",
      containerRuntimeVersion: "containerd://1.7.0",
      kernelVersion: "5.15.0",
      machineID: "machineid",
      operatingSystem: "linux",
      systemUUID: "systemuuid",
    },
    capacity: { cpu: "4", memory: "8Gi" },
    allocatable: { cpu: "3800m", memory: "7500Mi" },
  },
};

const mockServices: Record<string, ServiceObject> = {
  "service1-uid": {
    kind: "Service",
    apiVersion: "v1",
    metadata: { name: "service1", namespace: "test-namespace", uid: "service1-uid", resourceVersion: "1", creationTimestamp: new Date().toISOString() },
    spec: {
      selector: { app: "my-app" }, // Matches mockPod
      type: "ClusterIP",
      clusterIP: "10.1.2.3",
      ports: [{ port: 80, targetPort: 8080, protocol: "TCP" }],
    },
    status: {},
  },
  "service2-uid": {
    kind: "Service",
    apiVersion: "v1",
    metadata: { name: "service2", namespace: "test-namespace", uid: "service2-uid", resourceVersion: "1", creationTimestamp: new Date().toISOString() },
    spec: {
      selector: { app: "other-app" }, // Does not match mockPod
      type: "LoadBalancer",
      ports: [{ port: 443, targetPort: 8443, protocol: "TCP" }],
    },
    status: {},
  },
};

const mockPodMetrics: PodMetrics = {
  kind: "PodMetrics",
  apiVersion: "metrics.k8s.io/v1beta1",
  metadata: { name: "test-pod", namespace: "test-namespace", creationTimestamp: new Date().toISOString(), uid: "metrics-uid", resourceVersion: "1" },
  timestamp: new Date().toISOString(),
  window: "30s",
  containers: [
    { name: "container1", usage: { cpu: "100m", memory: "128Mi" } },
  ],
};

// SWR cache provider for tests
const swrCacheProvider = () => new Map();

describe("PodOverview", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    (require("@/hooks/useKuview").useKuview as jest.Mock).mockClear();
  });

  const renderPodOverview = (pod: PodObject) => {
    return render(
      <SWRConfig value={{ provider: swrCacheProvider, dedupingInterval: 0 }}>
        <PodOverview pod={pod} />
      </SWRConfig>
    );
  };

  test("renders loading states initially", () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    (require("@/hooks/useKuview").useKuview as jest.Mock).mockReturnValue({}); // No services initially

    renderPodOverview(mockPod);

    expect(screen.getByText("Loading node information...")).toBeInTheDocument();
    expect(screen.getByText("No services point to this pod.")).toBeInTheDocument(); // Or some loading state if services had one
    expect(screen.getByText("Loading metrics...")).toBeInTheDocument();
  });

  test("displays node information when available", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockNode,
    });
    (require("@/hooks/useKuview").useKuview as jest.Mock).mockReturnValue({}); // No services
     (fetch as jest.Mock).mockResolvedValueOnce({ // For metrics, resolve with empty for now
      ok: true,
      json: async () => ({ containers: [] }), // Empty metrics
    });


    renderPodOverview(mockPod);

    await waitFor(() => {
      expect(screen.getByText(`Name:`)).toBeInTheDocument();
      expect(screen.getByText(mockNode.metadata.name)).toBeInTheDocument();
    });
    expect(screen.getByText(`Status:`)).toBeInTheDocument();
    expect(screen.getByText("True")).toBeInTheDocument(); // Ready status
    expect(screen.getByText(`OS:`)).toBeInTheDocument();
    expect(screen.getByText(mockNode.status.nodeInfo!.osImage)).toBeInTheDocument();
    expect(screen.getByText(`Kubelet Version:`)).toBeInTheDocument();
    expect(screen.getByText(mockNode.status.nodeInfo!.kubeletVersion)).toBeInTheDocument();
  });

  test("displays 'No node name specified' if pod.spec.nodeName is missing", () => {
    const podWithoutNodeName = { ...mockPod, spec: { ...mockPod.spec, nodeName: undefined } };
    (require("@/hooks/useKuview").useKuview as jest.Mock).mockReturnValue({});
    (fetch as jest.Mock).mockResolvedValueOnce({ // For metrics
      ok: true,
      json: async () => ({ containers: [] }),
    });

    renderPodOverview(podWithoutNodeName);

    expect(screen.getByText("No node name specified in Pod spec.")).toBeInTheDocument();
  });

  test("displays error fetching node information", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Failed to fetch node"));
    (require("@/hooks/useKuview").useKuview as jest.Mock).mockReturnValue({});
     (fetch as jest.Mock).mockResolvedValueOnce({ // For metrics
      ok: true,
      json: async () => ({ containers: [] }),
    });

    renderPodOverview(mockPod);

    await waitFor(() => {
      expect(screen.getByText("Error Fetching Node")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch node")).toBeInTheDocument();
    });
  });

  test("displays services that point to the pod", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ // Node
      ok: true,
      json: async () => mockNode,
    });
    (require("@/hooks/useKuview").useKuview as jest.Mock).mockReturnValue(mockServices);
    (fetch as jest.Mock).mockResolvedValueOnce({ // Metrics
      ok: true,
      json: async () => mockPodMetrics,
    });

    renderPodOverview(mockPod);

    await waitFor(() => {
      expect(screen.getByText("service1")).toBeInTheDocument();
    });
    expect(screen.queryByText("service2")).not.toBeInTheDocument();
    expect(screen.getByText(mockServices["service1-uid"].spec.type!)).toBeInTheDocument();
    expect(screen.getByText(mockServices["service1-uid"].spec.clusterIP!)).toBeInTheDocument();
  });

  test("displays 'No services point to this pod' when no services match", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockNode,
    });
    (require("@/hooks/useKuview").useKuview as jest.Mock).mockReturnValue({
       "service2-uid": mockServices["service2-uid"] // Only non-matching service
    });
     (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPodMetrics,
    });

    renderPodOverview(mockPod);

    await waitFor(() => {
      expect(screen.getByText("No services point to this pod.")).toBeInTheDocument();
    });
  });

  test("displays resource usage from metrics", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ // Node
      ok: true,
      json: async () => mockNode,
    });
    (require("@/hooks/useKuview").useKuview as jest.Mock).mockReturnValue({}); // No services
    (fetch as jest.Mock).mockResolvedValueOnce({ // Metrics
      ok: true,
      json: async () => mockPodMetrics,
    });

    renderPodOverview(mockPod);

    await waitFor(() => {
      // Check for CPU and Memory titles (from ResourceBar)
      // This assumes ResourceBar renders a title prop or similar.
      // If ResourceBar is more complex, these checks might need adjustment.
      expect(screen.getAllByText("CPU").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Memory").length).toBeGreaterThan(0);
    });

    // Check for formatted values (this requires knowledge of formatCpu/formatBytes and parseCpu/parseMemory)
    // Example: 100m CPU, 128Mi Memory
    // We can also check for the presence of the raw values if ResourceBar passes them through or if we mock ResourceBar
    expect(screen.getByText("100m")).toBeInTheDocument(); // CPU usage
    expect(screen.getByText("128MiB")).toBeInTheDocument(); // Memory usage (formatBytes adds "B")

    // Check for node capacity display
    expect(screen.getByText("3.8")).toBeInTheDocument(); // Node CPU allocatable: 3800m -> 3.8
    expect(screen.getByText("7.15GiB")).toBeInTheDocument(); // Node Memory allocatable: 7500Mi -> 7.15GiB (approx)

    expect(screen.getByText(/Window: 30s/)).toBeInTheDocument();
    expect(screen.getByText(/Timestamp:/)).toBeInTheDocument();
  });

  test("displays error fetching metrics", async () => {
     (fetch as jest.Mock).mockResolvedValueOnce({ // Node
      ok: true,
      json: async () => mockNode,
    });
    (require("@/hooks/useKuview").useKuview as jest.Mock).mockReturnValue({});
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Failed to fetch metrics")); // Metrics error

    renderPodOverview(mockPod);

    await waitFor(() => {
      expect(screen.getByText("Error Fetching Metrics")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch metrics")).toBeInTheDocument();
    });
  });

  test("SWR uses refreshInterval for metrics", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockNode }); // Node
    (require("@/hooks/useKuview").useKuview as jest.Mock).mockReturnValue({}); // Services
    const metricsFetch = (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockPodMetrics }); // Metrics

    renderPodOverview(mockPod);

    await waitFor(() => expect(metricsFetch).toHaveBeenCalledTimes(1));

    // SWR's refreshInterval is implemented via setTimeout,
    // We need to advance timers to check if it refetches.
    jest.advanceTimersByTime(14999); // Just before 15s
    expect(metricsFetch).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1); // Reach 15s
    await waitFor(() => expect(metricsFetch).toHaveBeenCalledTimes(2)); // Should have fetched again

    jest.advanceTimersByTime(15000); // Another 15s
    await waitFor(() => expect(metricsFetch).toHaveBeenCalledTimes(3));

  });
});

// Need to tell Jest to use fake timers for advanceTimersByTime
jest.useFakeTimers();
