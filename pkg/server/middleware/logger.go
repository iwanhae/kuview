package middleware

import (
	"time"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// Logger returns a middleware that logs HTTP requests and responses
// It includes request details, response status, and timing information
func Logger() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			req := c.Request()
			requestID := GetRequestID(req.Context())

			// Enhance the request context with the logger
			ctx := req.Context()
			ctx = log.With().
				Str("request_id", requestID).
				Logger().
				WithContext(ctx)

			// Update the request with the enhanced context
			c.SetRequest(req.WithContext(ctx))

			// Time the request processing
			start := time.Now()
			err := next(c)

			// Determine log level based on the response status
			var evt *zerolog.Event
			if err != nil {
				evt = log.Ctx(ctx).Error().Err(err)
			} else {
				statusCode := c.Response().Status
				if statusCode >= 500 {
					evt = log.Ctx(ctx).Error()
				} else if statusCode >= 400 {
					evt = log.Ctx(ctx).Warn()
				} else {
					evt = log.Ctx(ctx).Info()
				}
			}

			// Log the request details
			evt.
				Str("method", req.Method).
				Str("path", req.URL.Path).
				Str("ip", c.RealIP()).
				Str("user_agent", req.UserAgent()).
				Int("status", c.Response().Status).
				Dur("latency", time.Since(start)).
				Send()

			return err
		}
	}
}
