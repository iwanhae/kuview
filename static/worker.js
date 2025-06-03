importScripts('/static/wasm_exec.js');

self.send = (event) => {
  setTimeout(() => {
    self.postMessage(event);
  }, 0);
}

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
      })
      .catch(error => {
        console.error("[Worker] Error instantiating/running WASM:", error);
        self.postMessage({ type: 'WORKER_ERROR', error: error.message });
      });
  }
};

console.log('[Worker] worker.js loaded and ready for INIT_WORKER message.'); 