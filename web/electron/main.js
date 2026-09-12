// web/electron/main.js — Electron 主进程：托盘后台运行、全局快捷键、关闭确认、加载 web/index.html
const { app, BrowserWindow, clipboard, ipcMain, Tray, Menu, nativeImage, globalShortcut, dialog } = require('electron');
const { join } = require('node:path');
const { readFileSync, writeFileSync, existsSync } = require('node:fs');
const { pathToFileURL } = require('node:url');

const DEFAULT_HOTKEY = 'Ctrl+Alt+T';
let isQuitting = false;
let win = null;
let tray = null;
let settings = { hotkey: DEFAULT_HOTKEY, hotkeyEnabled: true };
let settingsPath = '';

function settingsFile() {
  return join(app.getPath('userData'), 'settings.json');
}
function loadSettings() {
  settingsPath = settingsFile();
  try {
    if (existsSync(settingsPath)) {
      const s = JSON.parse(readFileSync(settingsPath, 'utf8')) || {};
      settings.hotkey = typeof s.hotkey === 'string' && s.hotkey ? s.hotkey : DEFAULT_HOTKEY;
      settings.hotkeyEnabled = s.hotkeyEnabled !== false;
    }
  } catch (e) {}
}
function saveSettings() {
  try { writeFileSync(settingsPath, JSON.stringify(settings)); } catch (e) {}
}
function applyHotkey() {
  globalShortcut.unregisterAll();
  if (!settings.hotkeyEnabled) return true;
  try {
    return globalShortcut.register(settings.hotkey, () => {
      summonWindow();
    });
  } catch (e) {
    return false;
  }
}

function readPayload(argv) {
  for (const arg of argv) {
    if (arg.startsWith('--payload=')) return arg.slice('--payload='.length);
  }
  return '';
}

function uiDir() {
  if (app.isPackaged) return join(process.resourcesPath, 'webui');
  return join(__dirname, '..', 'build');
}

function createWindow() {
  const payload = readPayload(process.argv.slice(app.isPackaged ? 1 : 2));
  const dir = uiDir();
  const url = pathToFileURL(join(dir, 'index.html'));
  url.searchParams.set('payload', payload);

  win = new BrowserWindow({
    width: 960,
    height: 720,
    title: '时间戳转换器 / Timestamp Converter',
    icon: join(dir, 'logo.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  win.loadURL(url.toString());
  win.on('page-title-updated', (e) => e.preventDefault());
  win.on('close', (e) => {
    if (isQuitting) return;
    e.preventDefault();
    confirmClose(win);
  });
  win.on('closed', () => { win = null; });
  return win;
}

function confirmClose(w) {
  dialog.showMessageBox(w, {
    type: 'question',
    title: '时间戳转换器',
    message: '关闭窗口后程序仍在后台运行',
    detail: '可点击系统托盘图标或使用全局快捷键重新呼出。',
    buttons: ['后台运行', '退出程序', '取消'],
    defaultId: 0,
    cancelId: 2,
    noLink: true,
  }).then(({ response }) => {
    if (response === 0) {
      if (win) win.hide();
    } else if (response === 1) {
      isQuitting = true;
      if (win) win.close();
    }
  });
}

function showMainWindow() {
  if (!win) { createWindow(); return; }
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function summonWindow() {
  showMainWindow();
  if (win && win.webContents) win.webContents.send('ts:summon');
}

function trayIcon() {
  const dir = uiDir();
  const png = join(dir, 'logo.png');
  const img = nativeImage.createFromPath(png);
  if (!img.isEmpty() && img.getSize().width > 16) return img.resize({ width: 16, height: 16 });
  return img;
}

function createTray() {
  tray = new Tray(trayIcon());
  tray.setToolTip('时间戳转换器 / Timestamp Converter');
  updateTrayMenu();
  tray.on('click', () => summonWindow());
  tray.on('double-click', () => summonWindow());
}

function updateTrayMenu() {
  if (!tray) return;
  const atLogin = app.getLoginItemSettings().openAtLogin;
  const hotkeyLabel = settings.hotkeyEnabled ? `全局快捷键：${settings.hotkey}` : '全局快捷键：已禁用';
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => summonWindow() },
    { type: 'separator' },
    { label: '开机自启', type: 'checkbox', checked: atLogin, click: (item) => {
        item.checked = atLogin;
        app.setLoginItemSettings({ openAtLogin: !atLogin, path: process.execPath });
        updateTrayMenu();
      } },
    { label: hotkeyLabel, enabled: false },
    { type: 'separator' },
    { label: '退出', click: () => { isQuitting = true; app.quit(); } },
  ]));
}

function registerIpc() {
  ipcMain.handle('ts:settings:get', () => ({ ...settings }));
  ipcMain.handle('ts:settings:set', (_e, patch) => {
    if (typeof patch === 'object' && patch !== null) {
      if (typeof patch.hotkey === 'string' && patch.hotkey.trim()) {
        const prev = { ...settings };
        settings.hotkey = patch.hotkey.trim();
        if (!applyHotkey()) {
          settings = prev;
          applyHotkey();
          return { ok: false, error: 'conflict' };
        }
      }
      if (typeof patch.hotkeyEnabled === 'boolean') {
        settings.hotkeyEnabled = patch.hotkeyEnabled;
        if (!applyHotkey()) return { ok: false, error: 'register' };
      }
      saveSettings();
      updateTrayMenu();
      if (win && win.webContents) win.webContents.send('ts:settings:changed', { ...settings });
      return { ok: true, settings: { ...settings } };
    }
    return { ok: false };
  });
  ipcMain.handle('utools:copy', (_e, text) => {
    clipboard.writeText(String(text));
  });
  ipcMain.on('utools:out', (e) => {
    const w = BrowserWindow.fromWebContents(e.sender);
    if (w) confirmClose(w);
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.setAppUserModelId('com.timestamp.converter');

  app.on('second-instance', () => {
    showMainWindow();
    summonWindow();
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('com.timestamp.converter');
    loadSettings();
    createWindow();
    createTray();
    registerIpc();
    applyHotkey();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); else showMainWindow(); });
  });

  app.on('before-quit', () => { isQuitting = true; });

  app.on('window-all-closed', () => {
    if (isQuitting) app.quit();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}