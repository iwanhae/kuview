package controller

import (
	"fmt"
	"reflect"

	"github.com/go-logr/logr"
	kulog "github.com/iwanhae/kuview/pkg/logger"
	zlog "github.com/rs/zerolog/log"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	clog "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/manager"
	"sigs.k8s.io/controller-runtime/pkg/metrics/server"
	"sigs.k8s.io/controller-runtime/pkg/source"
)

var logger logr.Logger

func init() {
	logger = logr.New(kulog.New(zlog.Logger))
	clog.SetLogger(logger)
}

func New(cfg rest.Config, objs []client.Object, emitter Emitter) (manager.Manager, error) {	
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
			fmt.Sprintf("kuview_%s", obj.GetObjectKind().GroupVersionKind().String()), 
			mgr, controller.Options{
			Reconciler: &dummyReconciler{
				T: T,
				client: mgr.GetClient(),
				emitter: emitter,
			},
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create controller: %w", err)
		}
		err = c.Watch(
			source.Kind(mgr.GetCache(),obj,
				&handler.TypedEnqueueRequestForObject[client.Object]{},
			),
		)
		if err != nil {
			return nil, fmt.Errorf("failed to watch object: %w", err)
		}
	}

	return mgr, nil
}


