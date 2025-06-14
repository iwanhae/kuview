package controller

import "sigs.k8s.io/controller-runtime/pkg/client"

type Emitter interface {
	Emit(v *Event)
}

type Event struct {
	Type   EventType     `json:"type"`
	Object client.Object `json:"object"`
}

type EventType string

const (
	EventTypeCreate EventType = "create"
	EventTypeDelete EventType = "delete"
)
