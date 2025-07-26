const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    // Promise-based (like invoking a function)
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

    // Listening for events from main
    on: (channel, listener) => ipcRenderer.on(channel, listener),

    // Removing listeners
    removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),

    // Optional: send (fire-and-forget style)
    send: (channel, ...args) => ipcRenderer.send(channel, ...args)
  }
});
