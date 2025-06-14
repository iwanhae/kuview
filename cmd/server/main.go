package main

import (
	"context"
	"log"
	"net/http"

	"github.com/iwanhae/kuview/pkg/controller"
	"github.com/iwanhae/kuview/pkg/server"
	v1 "k8s.io/api/core/v1"
	discoveryv1 "k8s.io/api/discovery/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func main() {
	cfg := ctrl.GetConfigOrDie()

	s := server.New()

	mgr, err := controller.New(
		*cfg,
		[]client.Object{
			&v1.Node{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Node"}},
			&v1.Pod{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Pod"}},
			&v1.Namespace{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Namespace"}},
			&v1.Service{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Service"}},
			&discoveryv1.EndpointSlice{TypeMeta: metav1.TypeMeta{APIVersion: "discovery.k8s.io/v1", Kind: "EndpointSlice"}},
		},
		s,
	)
	if err != nil {
		log.Fatal(err)
	}

	go http.ListenAndServe(":8080", s)

	if err := mgr.Start(context.Background()); err != nil {
		log.Fatal(err)
	}
}
