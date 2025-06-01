package logger

import (
	"github.com/go-logr/logr"
	"github.com/rs/zerolog"
)

// logger implements logr.LogSink using zerolog.
type logger struct {
	z zerolog.Logger
}

// New returns a new logr.LogSink that uses the provided zerolog.Logger.
// It is important that the passed zerolog.Logger is already configured
// with desired output (e.g., os.Stdout) and level.
func New(zl zerolog.Logger) logr.LogSink {
	return &logger{z: zl}
}

// Init is called by logr during initialization.
// For zerolog, the logger is typically already configured.
// If the zerolog.Logger is not set up with l.z.Caller(),
// info.CallDepth could be used to configure it, but for a "basic"
// implementation, we assume the provided zerolog.Logger is ready.
func (l *logger) Init(info logr.RuntimeInfo) {
	// No-op for basic implementation. The provided zerolog.Logger is used as-is.
	// If caller info is desired and not set on input `zl`, it could be configured here:
	// l.z = l.z.With().CallerWithSkipFrameCount(info.CallDepth + N).Logger()
	// where N depends on the call stack depth within zerolog itself and this wrapper.
}

// Enabled tests whether this LogSink is enabled at the given V-level.
// logr V-levels: 0 for Info, >0 for Debug.
// zerolog levels: DebugLevel (-1) < InfoLevel (0) < WarnLevel (1) etc.
func (l *logger) Enabled(level int) bool {
	// If logr requests a V-level > 0, it corresponds to Debug.
	if level > 0 {
		return l.z.GetLevel() <= zerolog.DebugLevel
	}
	// Otherwise (logr V-level 0), it corresponds to Info.
	return l.z.GetLevel() <= zerolog.InfoLevel
}

// Info logs a non-error message with the given key/value pairs.
func (l *logger) Info(level int, msg string, keysAndValues ...any) {
	var evt *zerolog.Event
	// logr V-level > 0 is for debug messages.
	if level > 0 {
		evt = l.z.Debug()
	} else {
		evt = l.z.Info()
	}

	// Check if the event is enabled before processing keys/values and sending.
	if !evt.Enabled() {
		return
	}

	evt = applyKeyValuesToEvent(evt, keysAndValues...)
	evt.Msg(msg)
}

// Error logs an error message with the given key/value pairs.
func (l *logger) Error(err error, msg string, keysAndValues ...any) {
	evt := l.z.Error()

	// Check if the event is enabled. Errors are typically logged unless level is very high.
	if !evt.Enabled() {
		return
	}

	if err != nil {
		evt = evt.Err(err)
	}
	evt = applyKeyValuesToEvent(evt, keysAndValues...)
	evt.Msg(msg)
}

// WithName returns a new LogSink with the specified name component.
// logr convention is often dot-separated names (e.g., "parent.child").
// zerolog typically uses a single "logger" field for the name.
// This implementation sets/overwrites the "logger" field with the new name.
func (l *logger) WithName(name string) logr.LogSink {
	// A more sophisticated WithName might try to append to an existing "logger" field.
	// For basic behavior, we create a new logger context with the given name.
	newLogger := l.z.With().Str("logger", name).Logger()
	return &logger{z: newLogger}
}

// WithValues returns a new LogSink with additional key/value pairs added to the context.
func (l *logger) WithValues(keysAndValues ...any) logr.LogSink {
	ctx := l.z.With() // Start a new context from the existing logger
	ctx = applyKeyValuesToContext(ctx, keysAndValues...)
	return &logger{z: ctx.Logger()}
}

// applyKeyValuesToContext adds an array of alternating key/value pairs to a zerolog.Context.
func applyKeyValuesToContext(ctx zerolog.Context, keysAndValues ...any) zerolog.Context {
	for i := 0; i < len(keysAndValues); i += 2 {
		key, ok := keysAndValues[i].(string)
		if !ok {
			// logr requires keys to be strings. If not, this pair is problematic.
			// We can skip, or log a special field indicating a malformed key.
			// For simplicity, skipping non-string keys.
			continue
		}
		if i+1 >= len(keysAndValues) {
			// Key without a value, also problematic.
			// Log the key with a placeholder or skip.
			ctx = ctx.Bool(key+"_MISSING_VALUE", true)
			break // Stop processing as the pairs are unbalanced
		}
		ctx = ctx.Interface(key, keysAndValues[i+1])
	}
	return ctx
}

// applyKeyValuesToEvent adds an array of alternating key/value pairs to a zerolog.Event.
func applyKeyValuesToEvent(event *zerolog.Event, keysAndValues ...any) *zerolog.Event {
	for i := 0; i < len(keysAndValues); i += 2 {
		key, ok := keysAndValues[i].(string)
		if !ok {
			// Skip non-string keys.
			continue
		}
		if i+1 >= len(keysAndValues) {
			event = event.Bool(key+"_MISSING_VALUE", true)
			break
		}
		event = event.Interface(key, keysAndValues[i+1])
	}
	return event
}

// var _ logr.LogSink = &logger{} ensures at compile time that *logger implements logr.LogSink.
var _ logr.LogSink = (*logger)(nil) // Corrected static check for interface implementation
