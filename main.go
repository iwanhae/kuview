package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"syscall/js"

	"github.com/go-logr/logr"
	"github.com/iwanhae/kuview/pkg/logger"
	"github.com/iwanhae/kuview/pkg/watcher"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/builder"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/event"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/manager"
	"sigs.k8s.io/controller-runtime/pkg/metrics/server"
	"sigs.k8s.io/controller-runtime/pkg/predicate"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	log.Info().
		Strs("env", os.Environ()).
		Msg("Starting kuview")

	if err := run(context.Background()); err != nil {
		log.Fatal().Err(err).Msg("Failed to run kuview")
	}
}

func run(ctx context.Context) error {
	cfg := &rest.Config{
		Host: os.Getenv("HOST"),
	}

	emitter, err := NewJSEventEmitter("kuview")
	if err != nil {
		return fmt.Errorf("failed to create event emitter: %w", err)
	}

	mgr, err := manager.New(cfg, manager.Options{
		LeaderElection:   false,
		Metrics:          server.Options{BindAddress: "0"},
		PprofBindAddress: "0",
		Logger:           logr.New(logger.New(log.Logger)),
	})
	if err != nil {
		return fmt.Errorf("failed to create manager: %w", err)
	}

	for _, o := range []struct {
		obj client.Object
		ctr reconcile.Reconciler
	}{
		{obj: &v1.Node{}, ctr: &watcher.NodeWatcher{}},
	} {
		if err := builder.ControllerManagedBy(mgr).
			Named("kuview").
			WatchesMetadata(o.obj, &handler.EnqueueRequestForObject{}).
			WithEventFilter(predicate.Funcs{
				CreateFunc: func(e event.CreateEvent) bool {
					emitter.Emit(&Event{
						Type:   EventTypeCreate,
						Object: e.Object,
					})
					return true
				},
				UpdateFunc: func(e event.UpdateEvent) bool {
					emitter.Emit(&Event{
						Type:   EventTypeUpdate,
						Object: e.ObjectNew,
					})
					return true
				},
				DeleteFunc: func(e event.DeleteEvent) bool {
					emitter.Emit(&Event{
						Type:   EventTypeDelete,
						Object: e.Object,
					})
					return true
				},
				GenericFunc: func(e event.GenericEvent) bool {
					emitter.Emit(&Event{
						Type:   EventTypeGeneric,
						Object: e.Object,
					})
					return true
				},
			}).
			Complete(o.ctr); err != nil {
			return fmt.Errorf("failed to create controller: %w", err)
		}
	}

	if err := mgr.Start(ctx); err != nil {
		return fmt.Errorf("failed to start manager: %w", err)
	}

	return nil
}

type Event struct {
	Type   EventType      `json:"type"`
	Object runtime.Object `json:"object"`
}

type EventType string

const (
	EventTypeCreate  EventType = "create"
	EventTypeUpdate  EventType = "update"
	EventTypeDelete  EventType = "delete"
	EventTypeGeneric EventType = "generic"
)

type EventEmitter struct {
	document js.Value
	Name     string
}

func NewJSEventEmitter(name string) (*EventEmitter, error) {
	document := js.Global().Get("document")
	res := EventEmitter{
		Name:     name,
		document: document,
	}
	return &res, nil
}

func (j *EventEmitter) Emit(v *Event) {
	b, err := json.Marshal(v)
	if err != nil {
		log.Error().Err(err).Msg("failed to marshal event")
		return
	}

	val := js.Global().Get("JSON").Call("parse", string(b))
	j.document.Call(j.Name, val)
}
