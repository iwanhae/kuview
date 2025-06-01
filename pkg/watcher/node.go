package watcher

import (
	"context"
	"encoding/json"
	"os"

	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

var _ reconcile.Reconciler = &NodeWatcher{}

type NodeWatcher struct {
	client.Reader
}

func (r *NodeWatcher) InjectClient(c client.Client) error {
	r.Reader = c
	return nil
}

func (r *NodeWatcher) Reconcile(ctx context.Context, req reconcile.Request) (reconcile.Result, error) {
	json.NewEncoder(os.Stdout).Encode(req)

	return reconcile.Result{}, nil
}
