package controller

import (
	"context"
	"fmt"
	"reflect"

	"github.com/go-logr/logr"
	kulog "github.com/iwanhae/kuview/pkg/logger"
	zlog "github.com/rs/zerolog/log"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller"
	"sigs.k8s.io/controller-runtime/pkg/event"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	clog "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/manager"
	"sigs.k8s.io/controller-runtime/pkg/metrics/server"
	"sigs.k8s.io/controller-runtime/pkg/predicate"
	"sigs.k8s.io/controller-runtime/pkg/source"
)

func New(ctx context.Context, cfg rest.Config, objs []client.Object, emitter Emitter) (manager.Manager, error) {
	logger := logr.New(kulog.New(zlog.Logger))
	clog.SetLogger(logger)

	go parseMetricsLoop(ctx, cfg, emitter)

	mgr, err := manager.New(&cfg, manager.Options{
		LeaderElection:   false,
		Metrics:          server.Options{BindAddress: "0"},
		PprofBindAddress: "0",
		Logger:           logger,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create manager: %w", err)
	}

	for _, obj := range objs {
		// Get dereferenced type of the object
		T := reflect.TypeOf(obj).Elem()
		c, err := controller.New(
			fmt.Sprintf("kuview_%s/%s", obj.GetObjectKind().GroupVersionKind().Group, obj.GetObjectKind().GroupVersionKind().Kind),
			mgr, controller.Options{
				Reconciler: &dummyReconciler{
					T:       T,
					obj:     obj,
					client:  mgr.GetClient(),
					emitter: emitter,
				},
			})
		if err != nil {
			return nil, fmt.Errorf("failed to create controller: %w", err)
		}

		var p predicate.TypedPredicate[client.Object] = predicate.NewPredicateFuncs(
			func(object client.Object) bool {
				return true
			},
		)
		// in case of Node, filter out heartbeat events
		if obj.GetObjectKind().GroupVersionKind().String() == "/v1, Kind=Node" {
			p = predicate.TypedFuncs[client.Object]{
				CreateFunc: func(e event.TypedCreateEvent[client.Object]) bool {
					return true
				},
				UpdateFunc: func(e event.TypedUpdateEvent[client.Object]) bool {
					new := e.ObjectNew.(*v1.Node)
					old := e.ObjectOld.(*v1.Node)

					// clear last heartbeat time to prevent unnecessary updates
					for i := range new.Status.Conditions {
						new.Status.Conditions[i].LastHeartbeatTime = metav1.Time{}
					}
					for i := range old.Status.Conditions {
						old.Status.Conditions[i].LastHeartbeatTime = metav1.Time{}
					}

					return !reflect.DeepEqual(new.Status, old.Status)
				},
				DeleteFunc: func(e event.TypedDeleteEvent[client.Object]) bool {
					return true
				},
				GenericFunc: func(e event.TypedGenericEvent[client.Object]) bool {
					return true
				},
			}
		}

		if err := c.Watch(
			source.Kind(mgr.GetCache(), obj,
				&handler.TypedEnqueueRequestForObject[client.Object]{},
				p,
			),
		); err != nil {
			return nil, fmt.Errorf("failed to watch object: %w", err)
		}
	}

	return mgr, nil
}
