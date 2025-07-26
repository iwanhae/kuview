package server

import (
	"fmt"

	"github.com/iwanhae/kuview/pkg/controller"
	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
)

func (s *Server) subscribe(c echo.Context) error {
	w := c.Response()
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	// 1. Subscribe and get a snapshot of the cache AT THE SAME TIME.
	// This is to prevent a race condition where a client subscribes
	// and then misses an event that was sent before the client was
	// able to receive it.
	s.rwmu.Lock()
	subCh := make(chan *controller.Event, 1024)
	s.subscribers[subCh] = struct{}{}
	cache := make([]*controller.Event, 0, len(s.cache))
	for _, v := range s.cache {
		cache = append(cache, &controller.Event{
			Type:   controller.EventTypeCreate,
			Object: v,
		})
	}
	s.rwmu.Unlock()
	log.Ctx(c.Request().Context()).Info().Msg("subscribed")

	defer func() {
		s.rwmu.Lock()
		defer s.rwmu.Unlock()

		if _, ok := s.subscribers[subCh]; ok {
			delete(s.subscribers, subCh)
			close(subCh)
		}
		log.Ctx(c.Request().Context()).Info().Msg("unsubscribed")
	}()

	// 2. Send the snapshot to the client.
	for _, v := range cache {
		evt := Event{
			Data: eventAsJSON(v),
		}
		if err := evt.MarshalTo(w); err != nil {
			return err
		}
	}
	w.Flush()

	// 3. Send real-time events to the client.
	for {
		select {
		case <-c.Request().Context().Done():
			// Client disconnected.
			return nil
		case v := <-subCh:
			evt := Event{
				Data: eventAsJSON(v),
			}
			if err := evt.MarshalTo(w); err != nil {
				// Failed to write to client, probably disconnected.
				return err
			}
			w.Flush()
		}
	}
}

// Emit implements controller.Emitter.
func (s *Server) Emit(v *controller.Event) {
	gvk := v.Object.GetObjectKind().GroupVersionKind()
	namespace := v.Object.GetNamespace()
	name := v.Object.GetName()
	key := fmt.Sprintf("%s/%s/%s/%s/%s", gvk.Group, gvk.Version, gvk.Kind, namespace, name)

	switch v.Type {
	case controller.EventTypeCreate:
		s.rwmu.Lock()
		s.cache[key] = v.Object
		s.rwmu.Unlock()
	case controller.EventTypeDelete:
		s.rwmu.Lock()
		delete(s.cache, key)
		s.rwmu.Unlock()
	}
	// it must be sent after the cache is updated
	s.evtCh <- v
}
