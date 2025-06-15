package server

import (
	"compress/gzip"
	"fmt"
	"net/http"
	"sync"

	"github.com/iwanhae/kuview/pkg/controller"
	"github.com/iwanhae/kuview/pkg/distributor"
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
	ch    chan *controller.Event
	rwmu  *sync.RWMutex
	evt   eventDistributor

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
	ch := make(chan *controller.Event)
	dist := distributor.New(ch, 1024)
	s := &Server{
		Echo:  echo.New(),
		cache: make(map[string]client.Object),
		ch:    ch,
		rwmu:  &sync.RWMutex{},
		evt:   dist,
		cfg:   cfg,
		cl:    cl,
	}

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
		Root:  "dist",
		HTML5: true,
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
