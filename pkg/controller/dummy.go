package controller

import (
	"context"
	"reflect"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)


type dummyReconciler struct{
	T reflect.Type
	client client.Reader
	emitter Emitter
}

func (r *dummyReconciler) Reconcile(ctx context.Context, req reconcile.Request) (reconcile.Result, error) {
	obj := reflect.New(r.T).Interface().(client.Object)
	err := r.client.Get(ctx, req.NamespacedName, obj)
	if err != nil {
		if apierrors.IsNotFound(err) {
			r.emitter.Emit(&Event{
				Type: EventTypeDelete,
				Object: obj,
			})
			return reconcile.Result{}, nil
		}
		return reconcile.Result{}, err
	}

	r.emitter.Emit(&Event{
		Type: EventTypeCreate,
		Object: obj,
	})

	return reconcile.Result{}, nil
}
