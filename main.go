package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"syscall/js"

	"github.com/go-logr/logr"
	"github.com/iwanhae/kuview/pkg/logger"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller"
	"sigs.k8s.io/controller-runtime/pkg/event"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	clog "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/manager"
	"sigs.k8s.io/controller-runtime/pkg/manager/signals"
	"sigs.k8s.io/controller-runtime/pkg/metrics/server"
	"sigs.k8s.io/controller-runtime/pkg/predicate"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sigs.k8s.io/controller-runtime/pkg/source"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr}).Level(zerolog.InfoLevel)

	log.Info().
		Strs("env", os.Environ()).
		Msg("Starting kuview")

	if err := run(signals.SetupSignalHandler()); err != nil {
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

	logger := logr.New(logger.New(log.Logger))
	mgr, err := manager.New(cfg, manager.Options{
		LeaderElection:   false,
		Metrics:          server.Options{BindAddress: "0"},
		PprofBindAddress: "0",
		Logger:           logger,
	})
	if err != nil {
		return fmt.Errorf("failed to create manager: %w", err)
	}
	clog.SetLogger(logger)

	c, err := controller.New("kuview", mgr, controller.Options{
		Reconciler: &DummyReconciler{},
	})
	if err != nil {
		return fmt.Errorf("failed to create controller: %w", err)
	}

	for _, objType := range []client.Object{
		&v1.Node{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Node"}},
		&v1.Pod{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Pod"}},
		&v1.Namespace{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Namespace"}},
		&v1.Service{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Service"}},
	} {
		err := c.Watch(
			source.Kind(
				mgr.GetCache(),
				objType,
				&handler.TypedEnqueueRequestForObject[client.Object]{},
				predicate.Funcs{
					CreateFunc: func(e event.TypedCreateEvent[client.Object]) bool {
						e.Object.GetObjectKind().SetGroupVersionKind(objType.GetObjectKind().GroupVersionKind())
						emitter.Emit(&Event{
							Type:   EventTypeCreate,
							Object: e.Object,
						})
						return true
					},
					UpdateFunc: func(e event.TypedUpdateEvent[client.Object]) bool {
						e.ObjectNew.GetObjectKind().SetGroupVersionKind(objType.GetObjectKind().GroupVersionKind())
						emitter.Emit(&Event{
							Type:   EventTypeUpdate,
							Object: e.ObjectNew,
						})
						return true
					},
					DeleteFunc: func(e event.TypedDeleteEvent[client.Object]) bool {
						e.Object.GetObjectKind().SetGroupVersionKind(objType.GetObjectKind().GroupVersionKind())
						emitter.Emit(&Event{
							Type:   EventTypeDelete,
							Object: e.Object,
						})
						return true
					},
					GenericFunc: func(e event.TypedGenericEvent[client.Object]) bool {
						e.Object.GetObjectKind().SetGroupVersionKind(objType.GetObjectKind().GroupVersionKind())
						emitter.Emit(&Event{
							Type:   EventTypeGeneric,
							Object: e.Object,
						})
						return true
					},
				}))
		if err != nil {
			return fmt.Errorf("failed to watch %s: %w", objType.GetObjectKind().GroupVersionKind().String(), err)
		}
	}

	if err := mgr.Start(ctx); err != nil {
		return fmt.Errorf("failed to start manager: %w", err)
	}

	return nil
}

type DummyReconciler struct{}

func (r *DummyReconciler) Reconcile(ctx context.Context, req reconcile.Request) (reconcile.Result, error) {
	return reconcile.Result{}, nil
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
	window js.Value
	Name   string
}

func NewJSEventEmitter(name string) (*EventEmitter, error) {
	window := js.Global().Get("window")
	res := EventEmitter{
		Name:   name,
		window: window,
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
	j.window.Call(j.Name, val)
}
