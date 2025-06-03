importScripts('/static/wasm_exec.js');

// This function will be called by Go's JSEventEmitter
self.kuview = (event) => {
  self.postMessage(event); // Forward the event to the main thread
};

self.onmessage = async (event) => {
  if (event.data.type === 'INIT_WORKER') {
    const go = new Go();
    go.env = { // Pass necessary environment variables to Go
      HOST: event.data.host,
    };

    console.log('[Worker] Initializing WebAssembly with HOST:', event.data.host);

    WebAssembly.instantiateStreaming(fetch("/static/main.wasm"), go.importObject)
      .then((result) => {
        console.log('[Worker] WebAssembly instantiated. Running Go program.');
        go.run(result.instance);
        // Notify the main thread that the worker is ready and Go is running.
        // self.postMessage({ type: 'WORKER_READY_AND_GO_RUNNING' });
        // It's often better to let Go signal its own readiness if possible,
        // or assume readiness after go.run() is called.
        // For now, we'll assume Go starts emitting events when ready.
      })
      .catch(error => {
        console.error("[Worker] Error instantiating/running WASM:", error);
        // Notify the main thread of the error
        self.postMessage({ type: 'WORKER_ERROR', error: error.message });
      });
  }
};

console.log('[Worker] worker.js loaded and ready for INIT_WORKER message.'); 