package server

import (
	"compress/gzip"
	"net/http"
	"sync"

	"github.com/iwanhae/kuview/pkg/controller"
	"github.com/iwanhae/kuview/pkg/distributor"
	"github.com/iwanhae/kuview/pkg/server/middleware"
	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type Server struct {
	*echo.Echo
	cache map[string]client.Object
	ch    chan *controller.Event
	rwmu  *sync.RWMutex
	evt   eventDistributor
}

var _ http.Handler = (*Server)(nil)
var _ controller.Emitter = (*Server)(nil)

func New() *Server {
	ch := make(chan *controller.Event)
	dist := distributor.New(ch, 1024)
	s := &Server{
		Echo:  echo.New(),
		cache: make(map[string]client.Object),
		ch:    ch,
		rwmu:  &sync.RWMutex{},
		evt:   dist,
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

	return s
}
