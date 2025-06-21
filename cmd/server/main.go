package main

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/iwanhae/kuview/pkg/controller"
	"github.com/iwanhae/kuview/pkg/server"
	"github.com/iwanhae/kuview/pkg/types"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/manager/signals"
)

func main() {
	log.Logger = log.
		Output(zerolog.ConsoleWriter{Out: os.Stderr}).
		Level(zerolog.InfoLevel)

	log.Info().
		Msg("Starting kuview server")

	if err := run(signals.SetupSignalHandler()); err != nil {
		log.Fatal().Err(err).Msg("Failed to run kuview")
	}
}

func run(ctx context.Context) error {
	cfg := ctrl.GetConfigOrDie()

	s, err := server.New(cfg)
	if err != nil {
		return fmt.Errorf("failed to create a new server: %w", err)
	}

	go http.ListenAndServe(":8001", s)

	mgr, err := controller.New(
		ctx, *cfg,
		types.ObjectSchemas,
		s,
	)
	if err != nil {
		return fmt.Errorf("failed to create a new controller: %w", err)
	}

	if err := mgr.Start(ctx); err != nil {
		return fmt.Errorf("failed to start controller manager: %w", err)
	}

	return nil
}
