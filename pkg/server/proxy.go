package server

import (
	"net/http/httputil"
	"net/url"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
)

func (s *Server) proxy(c echo.Context) error {
	evt := log.Ctx(c.Request().Context()).Info()
	for _, name := range c.ParamNames() {
		value := c.Param(name)
		evt.Str(name, value)
	}
	evt.Msg("proxy request")

	proxyURL, err := url.Parse(s.cfg.Host + s.cfg.APIPath)
	if err != nil {
		return err
	}
	proxy := httputil.NewSingleHostReverseProxy(proxyURL)
	proxy.Transport = s.cl.Transport
	proxy.ServeHTTP(c.Response(), c.Request())
	return nil
}
