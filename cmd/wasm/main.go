package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"syscall/js"

	"github.com/iwanhae/kuview/pkg/controller"
	"github.com/iwanhae/kuview/pkg/types"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"k8s.io/client-go/rest"

	"sigs.k8s.io/controller-runtime/pkg/manager/signals"
)

func main() {
	log.Logger = log.
		Output(zerolog.ConsoleWriter{Out: os.Stderr}).
		Level(zerolog.InfoLevel)

	log.Info().
		Strs("env", os.Environ()).
		Msg("Starting kuview wasm")

	if err := run(signals.SetupSignalHandler()); err != nil {
		log.Fatal().Err(err).Msg("Failed to run kuview")
	}
}

func run(ctx context.Context) error {
	cfg := rest.Config{
		Host: os.Getenv("HOST"),
	}

	emitter, err := NewJSEventEmitter()
	if err != nil {
		return fmt.Errorf("failed to create event emitter: %w", err)
	}

	mgr, err := controller.New(
		ctx, cfg,
		types.ObjectSchemas,
		emitter,
	)
	if err != nil {
		return fmt.Errorf("failed to create a new controller: %w", err)
	}

	if err := mgr.Start(ctx); err != nil {
		return fmt.Errorf("failed to start manager: %w", err)
	}

	return nil
}

type EventEmitter struct {
	window js.Value
}

func NewJSEventEmitter() (*EventEmitter, error) {
	eventTarget := js.Global()

	res := EventEmitter{
		window: eventTarget,
	}
	return &res, nil
}

func (j *EventEmitter) Emit(v *controller.Event) {
	b, err := json.Marshal(v)
	if err != nil {
		log.Error().Err(err).Msg("failed to marshal event")
		return
	}

	val := js.Global().Get("JSON").Call("parse", string(b))
	j.window.Call("send", val)
}
