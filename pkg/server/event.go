package server

import (
	"bytes"
	"context"
	"fmt"
	"runtime"
	"sync"

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
	for v := range s.encodeEventsParallel(c.Request().Context(), cache) {
		if _, err := w.Write(v); err != nil {
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

func (s *Server) encodeEventsParallel(ctx context.Context, cache []*controller.Event) <-chan []byte {
	ch := make(chan []byte, 10*runtime.NumCPU())

	q := make(chan *controller.Event, 10*runtime.NumCPU())
	go func() {
		defer close(q)
		for _, v := range cache {
			q <- v
		}
	}()

	var wg sync.WaitGroup
	for i := 0; i < runtime.NumCPU(); i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case v, ok := <-q:
					if !ok {
						return
					}
					evt := Event{Data: eventAsJSON(v)}
					buf := bytes.NewBuffer(nil)

					if err := evt.MarshalTo(buf); err != nil {
						log.Error().Err(err).Msg("failed to marshal event to buffer")
						continue
					}
					ch <- buf.Bytes()
				}
			}
		}()
	}
	go func() {
		wg.Wait()
		close(ch)
	}()

	return ch
}
