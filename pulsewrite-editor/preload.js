const { contextBridge, ipcRenderer } = require('electron');

// Platform detection
contextBridge.exposeInMainWorld('platform', { 
  isMac: process.platform === 'darwin'
});

// Optional: expose window control API if you're using IPC for it
contextBridge.exposeInMainWorld('windowAPI', {
  sendAction: (action) => ipcRenderer.send('window-action', action)
});

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder')
});