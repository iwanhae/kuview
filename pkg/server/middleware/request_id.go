package middleware

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/labstack/echo/v4"
)

// requestIDKey is the context key for storing the request ID
var requestIDKey = &struct{}{}

// GetRequestID retrieves the request ID from the context
// Returns an empty string if no request ID is found
func GetRequestID(ctx context.Context) string {
	rid, ok := ctx.Value(requestIDKey).(string)
	if !ok {
		return ""
	}
	return rid
}

// generateShortID creates a request ID that is shorter than a UUID
// Format: timestamp_random (about 16 chars)
// This provides sufficient uniqueness while keeping the ID compact
func generateShortID() string {
	// Use 6 random bytes (gives us ~12 chars in base64)
	randomBytes := make([]byte, 6)
	_, err := rand.Read(randomBytes)
	if err != nil {
		// Fallback to timestamp only if random generation fails
		return fmt.Sprintf("%x", time.Now().UnixNano())
	}

	// Create ID with timestamp prefix and random suffix
	// Format: timestamp_random
	return fmt.Sprintf("%x_%s",
		time.Now().Unix()&0xFFFF,                              // Last 16 bits of timestamp (4 hex chars)
		base64.RawURLEncoding.EncodeToString(randomBytes)[:8], // First 8 chars of base64 encoded random bytes
	)
}

// RequestID is a middleware that adds a request ID to each request
// If the request already has an X-Request-ID header, it will use that value
// Otherwise, it generates a new request ID
// The request ID is added to the context and response headers
func RequestID() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Get existing request ID or generate a new one
			requestID := c.Request().Header.Get("X-Request-ID")
			if requestID == "" {
				requestID = generateShortID()
			}

			// Add request ID to context
			ctx := context.WithValue(c.Request().Context(), requestIDKey, requestID)
			c.SetRequest(c.Request().WithContext(ctx))

			// Add request ID to response headers
			c.Response().Header().Set("X-Request-ID", requestID)

			return next(c)
		}
	}
}
