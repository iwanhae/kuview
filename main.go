package main

import (
	"context"
	"os"

	"github.com/go-logr/logr"
	"github.com/iwanhae/kuview/pkg/logger"
	"github.com/iwanhae/kuview/pkg/watcher"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	v1 "k8s.io/api/core/v1"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/builder"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/manager"
	"sigs.k8s.io/controller-runtime/pkg/metrics/server"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	cfg := &rest.Config{
		Host: os.Getenv("HOST"),
	}

	log.Info().
		Strs("env", os.Environ()).
		Msg("Starting kuview")

	mgr, err := manager.New(cfg, manager.Options{
		LeaderElection:   false,
		Metrics:          server.Options{BindAddress: "0"},
		PprofBindAddress: "0",
		Logger:           logr.New(logger.New(log.Logger)),
	})
	if err != nil {
		panic(err)
	}

	for _, o := range []struct {
		obj client.Object
		ctr reconcile.Reconciler
	}{
		{obj: &v1.Node{}, ctr: &watcher.NodeWatcher{}},
	} {
		if err := builder.ControllerManagedBy(mgr).
			Named("kuview").
			Watches(o.obj, &handler.EnqueueRequestForObject{}).
			Complete(o.ctr); err != nil {
			panic(err)
		}
	}

	if err := mgr.Start(context.Background()); err != nil {
		panic(err)
	}
}
