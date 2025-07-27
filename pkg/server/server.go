package server

import (
	"compress/gzip"
	"fmt"
	"net/http"
	"sync"

	"github.com/iwanhae/kuview"
	"github.com/iwanhae/kuview/pkg/controller"
	"github.com/iwanhae/kuview/pkg/server/middleware"
	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type Server struct {
	*echo.Echo

	// for caching the objects
	cache map[string]client.Object
	rwmu  *sync.RWMutex

	// for event distribution
	subscribers map[chan *controller.Event]struct{}
	evtCh       chan *controller.Event

	// for proxy-ing the request to kubernetes api server
	cfg *rest.Config
	cl  *http.Client
}

var _ http.Handler = (*Server)(nil)
var _ controller.Emitter = (*Server)(nil)

func New(cfg *rest.Config) (*Server, error) {
	cl, err := rest.HTTPClientFor(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create a rest client: %w", err)
	}
	evtCh := make(chan *controller.Event)
	s := &Server{
		Echo:        echo.New(),
		cache:       make(map[string]client.Object),
		rwmu:        &sync.RWMutex{},
		subscribers: make(map[chan *controller.Event]struct{}),
		evtCh:       evtCh,
		cfg:         cfg,
		cl:          cl,
	}

	go s.runDistributor()

	// Register middleware
	s.Use(echomiddleware.GzipWithConfig(echomiddleware.GzipConfig{
		Level: gzip.BestCompression,
	}))
	static := s.Group("/static")
	static.Use(echomiddleware.RewriteWithConfig(echomiddleware.RewriteConfig{
		Rules: map[string]string{
			"/static/*": "/$1",
		},
	}))
	static.Use(echomiddleware.StaticWithConfig(echomiddleware.StaticConfig{
		Root:       "dist",
		HTML5:      true,
		Browse:     true,
		Filesystem: http.FS(kuview.DistFS),
	}))

	s.Use(middleware.RequestID())
	s.Use(middleware.Logger())
	s.Use(middleware.ErrorWrapper())
	s.Use(echomiddleware.RecoverWithConfig(echomiddleware.RecoverConfig{
		DisableErrorHandler: true,
	}))
	s.Use(echomiddleware.CORS())

	s.GET("/", func(c echo.Context) error {
		return c.Redirect(http.StatusTemporaryRedirect, "/static")
	})
	s.GET("/kuview", s.subscribe)
	s.GET("/kuview/available", func(c echo.Context) error {
		return c.String(http.StatusOK, "yes")
	})

	// /api/v1/namespaces/default/pods/minio-0/log
	s.GET("/api/v1/namespaces/:namespace/pods/:pod/log", s.proxy)

	return s, nil
}

func (s *Server) runDistributor() {
	for evt := range s.evtCh {
		s.rwmu.RLock()
		// We copy the subscriber channels to a slice under a read lock
		// to avoid holding the lock for a long time during the send operations.
		subs := make([]chan *controller.Event, 0, len(s.subscribers))
		for sub := range s.subscribers {
			subs = append(subs, sub)
		}
		s.rwmu.RUnlock()

		for _, sub := range subs {
			// Non-blocking send to prevent a slow consumer from halting distribution.
			select {
			case sub <- evt:
			default:
				// The subscriber's buffer is full. The message is dropped for this subscriber.
			}
		}
	}

	// The source channel has been closed. We must close all subscriber channels.
	s.rwmu.Lock()
	defer s.rwmu.Unlock()
	for sub := range s.subscribers {
		delete(s.subscribers, sub)
		close(sub)
	}
}
