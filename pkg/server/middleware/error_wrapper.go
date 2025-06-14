package middleware

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
)

// ErrorWrapper is a middleware that wraps non-HTTP errors into proper HTTP errors
// This ensures all errors returned to clients follow a consistent format
func ErrorWrapper() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			err := next(c)
			if err == nil {
				return nil
			}

			// If the error is already an HTTP error, don't wrap it
			var httpError *echo.HTTPError
			if errors.As(err, &httpError) {
				return err
			}

			// Wrap other errors as internal server errors
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
	}
}
