package server

import (
	"fmt"

	"github.com/iwanhae/kuview/pkg/controller"
	"github.com/labstack/echo/v4"
)

func (s *Server) subscribe(c echo.Context) error {
	w := c.Response()
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	s.rwmu.RLock()
	for _, v := range s.cache {
		evt := Event{
			Data: eventAsJSON(&controller.Event{
				Type:   controller.EventTypeCreate,
				Object: v,
			}),
		}
		evt.MarshalTo(w)
	}
	s.rwmu.RUnlock()
	w.Flush()

	sub, unsubscribe := s.evt.Subscribe()
	defer unsubscribe()

	for v := range sub {
		evt := Event{
			Data: eventAsJSON(v),
		}
		evt.MarshalTo(w)
		w.Flush()
	}
	return nil
}

// Emit implements controller.Emitter.
func (s *Server) Emit(v *controller.Event) {
	gvk := v.Object.GetObjectKind().GroupVersionKind()
	namespace := v.Object.GetNamespace()
	name := v.Object.GetName()
	key := fmt.Sprintf("%s/%s/%s/%s", gvk.Group, gvk.Version, namespace, name)

	if v.Type == controller.EventTypeCreate {
		s.rwmu.Lock()
		s.cache[key] = v.Object
		s.rwmu.Unlock()
	} else if v.Type == controller.EventTypeDelete {
		s.rwmu.Lock()
		delete(s.cache, key)
		s.rwmu.Unlock()
	}
	// it must be sent after the cache is updated
	s.ch <- v
}

type eventDistributor interface {
	Subscribe() (<-chan *controller.Event, func())
}
