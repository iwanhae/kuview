package controller

import (
	"context"
	"time"

	"github.com/rs/zerolog/log"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/runtime/serializer/json"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	metricsv1beta1 "k8s.io/metrics/pkg/apis/metrics/v1beta1"
)

func init() {
	metricsv1beta1.AddToScheme(scheme.Scheme)
}

// parseMetricsLoop emits events for metrics.k8s.io/v1beta1 resources, if available
func parseMetricsLoop(ctx context.Context, cfg rest.Config, emitter Emitter) {
	cfg.GroupVersion = &schema.GroupVersion{
		Group:   "metrics.k8s.io",
		Version: "v1beta1",
	}

	cfg.NegotiatedSerializer = runtime.NewSimpleNegotiatedSerializer(runtime.SerializerInfo{
		MediaType:  "application/json",
		Serializer: json.NewSerializer(json.DefaultMetaFactory, scheme.Scheme, scheme.Scheme, false),
	})

	cl, err := rest.RESTClientFor(&cfg)
	if err != nil {
		log.Error().Err(err).Msg("failed to create a new client")
		return
	}

	log.Info().Msg("starting metrics loop")

	failcount := 0

	for ctx.Err() == nil {
		nodes := &metricsv1beta1.NodeMetricsList{}
		if err := cl.Get().AbsPath("/apis/metrics.k8s.io/v1beta1/nodes").Do(ctx).Into(nodes); err != nil {
			log.Error().Err(err).Msg("failed to get nodes")
			failcount++
		} else {
			failcount = 0
			for _, node := range nodes.Items {
				if node.Usage.Cpu().IsZero() || node.Usage.Memory().IsZero() {
					// Some Prometheus-based metrics services have bugs that incorrectly report the total CPU usage as zero, which is nonsensical.
					// Skip for this time.
					log.Warn().
						Str("node", node.Name).
						Msg("some node metrics report a CPU usage of 0. skip this data.")
					continue
				}
				node.APIVersion = "metrics.k8s.io/v1beta1"
				node.Kind = "NodeMetrics"
				emitter.Emit(&Event{
					Type:   EventTypeCreate,
					Object: &node,
				})
			}
		}

		pods := &metricsv1beta1.PodMetricsList{}
		if err := cl.Get().AbsPath("/apis/metrics.k8s.io/v1beta1/pods").Do(ctx).Into(pods); err != nil {
			log.Error().Err(err).Msg("failed to get pods")
			failcount++
		} else {
			failcount = 0
			for _, pod := range pods.Items {
				pod.APIVersion = "metrics.k8s.io/v1beta1"
				pod.Kind = "PodMetrics"
				emitter.Emit(&Event{
					Type:   EventTypeCreate,
					Object: &pod,
				})
			}
		}

		if failcount > 10 {
			log.Error().Msg("failed more than 10 times, exiting")
			return
		}
		time.Sleep(10 * time.Second)
	}
}
