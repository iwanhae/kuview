package controller

import "k8s.io/apimachinery/pkg/runtime"


type Emitter interface {
	Emit(v *Event)
}

type Event struct {
	Type   EventType      `json:"type"`
	Object runtime.Object `json:"object"`
}

type EventType string

const (
	EventTypeCreate EventType = "create"
	EventTypeDelete EventType = "delete"
)
