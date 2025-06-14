package distributor

import "sync"

// distributor is a channel that distributes messages from a source channel to multiple subscribers.
// It is useful for when you want to distribute messages to multiple subscribers, such as when you want to send messages to multiple clients simultaneously.
type distributor[T any] struct {
	mu          sync.RWMutex
	subscribers map[chan T]struct{}
	source      <-chan T
	bufferSize  int
}

func New[T any](source <-chan T, bufferSize int) *distributor[T] {
	if bufferSize < 0 {
		bufferSize = 0
	}

	d := &distributor[T]{
		subscribers: make(map[chan T]struct{}),
		source:      source,
		bufferSize:  bufferSize,
	}

	go d.run()
	return d
}

// run is the main distribution loop.
// It reads from the source and sends to all subscribers.
// It automatically cleans up when the source channel is closed.
func (d *distributor[T]) run() {
	for msg := range d.source {
		d.mu.RLock()
		// We copy the subscriber channels to a slice under a read lock
		// to avoid holding the lock for a long time during the send operations.
		subs := make([]chan T, 0, len(d.subscribers))
		for sub := range d.subscribers {
			subs = append(subs, sub)
		}
		d.mu.RUnlock()

		for _, sub := range subs {
			// Non-blocking send to prevent a slow consumer from halting distribution.
			select {
			case sub <- msg:
			default:
				// The subscriber's buffer is full. The message is dropped for this subscriber.
			}
		}
	}

	// The source channel has been closed. We must close all subscriber channels.
	d.mu.Lock()
	defer d.mu.Unlock()
	for sub := range d.subscribers {
		delete(d.subscribers, sub)
		close(sub)
	}
}

func (d *distributor[T]) Subscribe() (<-chan T, func()) {
	d.mu.Lock()
	defer d.mu.Unlock()

	subCh := make(chan T, d.bufferSize)
	d.subscribers[subCh] = struct{}{}

	unsubscribe := func() {
		d.unsubscribe(subCh)
	}

	return subCh, unsubscribe
}

// unsubscribe removes a channel from the subscriber list and closes it.
func (d *distributor[T]) unsubscribe(subCh chan T) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if _, ok := d.subscribers[subCh]; ok {
		delete(d.subscribers, subCh)
		close(subCh)
	}
}
