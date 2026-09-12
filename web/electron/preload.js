// web/electron/preload.js — 注入最小 window.utools shim + 桌面壳 API (tsShell)
// utools: copyText → 剪贴板；outPlugin → 触发关闭确认；onPluginEnter/setExpendHeight → noop
// tsShell: 全局快捷键设置与呼出事件
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('utools', {
  copyText: (text) => ipcRenderer.invoke('utools:copy', String(text)),
  outPlugin: () => ipcRenderer.send('utools:out'),
  setExpendHeight: () => {},
  onPluginEnter: () => {},
});

contextBridge.exposeInMainWorld('tsShell', {
  getSettings: () => ipcRenderer.invoke('ts:settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('ts:settings:set', patch),
  onSummon: (cb) => ipcRenderer.on('ts:summon', () => cb()),
  onSettingsChanged: (cb) => ipcRenderer.on('ts:settings:changed', (_e, s) => cb(s)),
});