// web/electron/main.js — Electron 主进程：托盘后台运行、全局快捷键、本地化菜单栏、关闭确认、加载 web/index.html
const { app, BrowserWindow, clipboard, ipcMain, Tray, Menu, nativeImage, globalShortcut, dialog } = require('electron');
const { join } = require('node:path');
const { readFileSync, writeFileSync, existsSync } = require('node:fs');
const { pathToFileURL } = require('node:url');

const DEFAULT_HOTKEY = 'Ctrl+Alt+T';
const UI_TEXT = {
  zh: {
    file: '文件', edit: '编辑', view: '视图', window: '窗口', help: '帮助',
    showMain: '显示主窗口', hotkeySettings: '全局快捷键设置', lang: '语言',
    langZh: '简体中文', langEn: 'English',
    quit: '退出', close: '关闭窗口', minimize: '最小化', zoomWin: '缩放',
    hide: '隐藏', hideOthers: '隐藏其他', unhide: '全部显示',
    undo: '撤销', redo: '重做', cut: '剪切', copy: '复制', paste: '粘贴', selectAll: '全选',
    reload: '重新加载', forceReload: '强制重新加载', toggleDevTools: '开发者工具',
    resetZoom: '实际大小', zoomIn: '放大', zoomOut: '缩小',
    fullscreen: '切换全屏', about: '关于',
    aboutName: '关于 时间戳转换器', aboutVersion: '版本 {v}',
    aboutDetail: '时间戳转换器桌面版（Electron）',
    ok: '确定',
    trayShow: '显示主窗口', trayAutoStart: '开机自启', trayQuit: '退出',
    trayHotkeyOn: '全局快捷键：{hk}', trayHotkeyOff: '全局快捷键：已禁用',
    closeTitle: '时间戳转换器', closeMsg: '关闭窗口后程序仍在后台运行',
    closeDetail: '可点击系统托盘图标或使用全局快捷键重新呼出。',
    closeBg: '后台运行', closeExit: '退出程序', closeCancel: '取消',
  },
  en: {
    file: 'File', edit: 'Edit', view: 'View', window: 'Window', help: 'Help',
    showMain: 'Show Main Window', hotkeySettings: 'Global Hotkey Settings', lang: 'Language',
    langZh: '简体中文', langEn: 'English',
    quit: 'Quit', close: 'Close', minimize: 'Minimize', zoomWin: 'Zoom',
    hide: 'Hide', hideOthers: 'Hide Others', unhide: 'Show All',
    undo: 'Undo', redo: 'Redo', cut: 'Cut', copy: 'Copy', paste: 'Paste', selectAll: 'Select All',
    reload: 'Reload', forceReload: 'Force Reload', toggleDevTools: 'Developer Tools',
    resetZoom: 'Actual Size', zoomIn: 'Zoom In', zoomOut: 'Zoom Out',
    fullscreen: 'Toggle Full Screen', about: 'About',
    aboutName: 'About Timestamp Converter', aboutVersion: 'Version {v}',
    aboutDetail: 'Timestamp converter desktop app (Electron)',
    ok: 'OK',
    trayShow: 'Show Main Window', trayAutoStart: 'Open at Login', trayQuit: 'Quit',
    trayHotkeyOn: 'Global Hotkey: {hk}', trayHotkeyOff: 'Global Hotkey: Disabled',
    closeTitle: 'Timestamp Converter', closeMsg: 'The app keeps running in the background after closing.',
    closeDetail: 'Reopen it from the system tray icon or via the global hotkey.',
    closeBg: 'Run in Background', closeExit: 'Quit App', closeCancel: 'Cancel',
  },
};

let isQuitting = false;
let win = null;
let tray = null;
let settings = null;
let settingsPath = '';

function defaultUiLang() {
  return app.getLocale().toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function settingsFile() {
  return join(app.getPath('userData'), 'settings.json');
}
function loadSettings() {
  settingsPath = settingsFile();
  settings = { hotkey: DEFAULT_HOTKEY, hotkeyEnabled: true, uiLang: defaultUiLang() };
  try {
    if (existsSync(settingsPath)) {
      const s = JSON.parse(readFileSync(settingsPath, 'utf8')) || {};
      settings.hotkey = typeof s.hotkey === 'string' && s.hotkey ? s.hotkey : DEFAULT_HOTKEY;
      settings.hotkeyEnabled = s.hotkeyEnabled !== false;
      settings.uiLang = (s.uiLang === 'zh' || s.uiLang === 'en') ? s.uiLang : defaultUiLang();
    }
  } catch (e) {}
}
function saveSettings() {
  try { writeFileSync(settingsPath, JSON.stringify(settings)); } catch (e) {}
}
function t(key) {
  return (UI_TEXT[settings.uiLang] && UI_TEXT[settings.uiLang][key]) || key;
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
  win.setMenuBarVisibility(true);
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
    title: t('closeTitle'),
    message: t('closeMsg'),
    detail: t('closeDetail'),
    buttons: [t('closeBg'), t('closeExit'), t('closeCancel')],
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

function showAbout() {
  dialog.showMessageBox(win || undefined, {
    type: 'info',
    title: t('aboutName'),
    message: t('aboutName'),
    detail: `${t('aboutDetail')}\n${t('aboutVersion').replace('{v}', app.getVersion())}`,
    buttons: [t('ok')],
    defaultId: 0,
    noLink: true,
  }).catch(() => {});
}

function languageSubmenu() {
  return {
    label: t('lang'),
    submenu: [
      { label: t('langZh'), type: 'radio', checked: settings.uiLang === 'zh', click: () => setShellLang('zh') },
      { label: t('langEn'), type: 'radio', checked: settings.uiLang === 'en', click: () => setShellLang('en') },
    ],
  };
}

function buildAppMenu() {
  const template = [];
  if (process.platform === 'darwin') {
    template.push({
      label: app.name,
      submenu: [
        { role: 'about', label: t('about') },
        { type: 'separator' },
        { role: 'hide', label: `${t('hide')} ${app.name}` },
        { role: 'hideOthers', label: t('hideOthers') },
        { role: 'unhide', label: t('unhide') },
        { type: 'separator' },
        { role: 'quit', label: t('quit') },
      ],
    });
  }
  template.push({
    label: t('file'),
    submenu: [
      { label: t('showMain'), click: () => summonWindow() },
      { label: t('hotkeySettings'), click: () => summonWindow() },
      { type: 'separator' },
      languageSubmenu(),
      { type: 'separator' },
      process.platform === 'darwin' ? { role: 'close', label: t('close') } : { role: 'quit', label: t('quit') },
    ],
  });
  template.push({
    label: t('edit'),
    submenu: [
      { role: 'undo', label: t('undo') },
      { role: 'redo', label: t('redo') },
      { type: 'separator' },
      { role: 'cut', label: t('cut') },
      { role: 'copy', label: t('copy') },
      { role: 'paste', label: t('paste') },
      { role: 'selectAll', label: t('selectAll') },
    ],
  });
  template.push({
    label: t('view'),
    submenu: [
      { role: 'reload', label: t('reload') },
      { role: 'forceReload', label: t('forceReload') },
      { role: 'toggleDevTools', label: t('toggleDevTools') },
      { type: 'separator' },
      { role: 'resetZoom', label: t('resetZoom') },
      { role: 'zoomIn', label: t('zoomIn') },
      { role: 'zoomOut', label: t('zoomOut') },
      { type: 'separator' },
      { role: 'togglefullscreen', label: t('fullscreen') },
    ],
  });
  template.push({
    label: t('window'),
    submenu: [
      { role: 'minimize', label: t('minimize') },
      process.platform === 'darwin' ? { role: 'zoom', label: t('zoomWin') } : null,
      process.platform === 'darwin' ? { type: 'separator' } : null,
      { role: 'close', label: t('close') },
    ].filter(Boolean),
  });
  template.push({
    label: t('help'),
    submenu: [{ label: t('about'), click: () => showAbout() }],
  });
  return Menu.buildFromTemplate(template);
}

function setShellLang(l) {
  if (l !== 'zh' && l !== 'en') l = settings.uiLang;
  if (!settings || settings.uiLang === l) return;
  settings.uiLang = l;
  saveSettings();
  Menu.setApplicationMenu(buildAppMenu());
  updateTrayMenu();
  if (win && win.webContents) win.webContents.send('ts:uiLang:changed', l);
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
  const hotkeyLabel = settings.hotkeyEnabled
    ? t('trayHotkeyOn').replace('{hk}', settings.hotkey)
    : t('trayHotkeyOff');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: t('trayShow'), click: () => summonWindow() },
    { type: 'separator' },
    { label: t('trayAutoStart'), type: 'checkbox', checked: atLogin, click: (item) => {
        item.checked = atLogin;
        app.setLoginItemSettings({ openAtLogin: !atLogin, path: process.execPath });
        updateTrayMenu();
      } },
    { label: hotkeyLabel, enabled: false },
    { type: 'separator' },
    languageSubmenu(),
    { type: 'separator' },
    { label: t('trayQuit'), click: () => { isQuitting = true; app.quit(); } },
  ]));
}

function registerIpc() {
  ipcMain.handle('ts:settings:get', () => ({ ...settings }));
  ipcMain.handle('ts:settings:set', (_e, patch) => {
    if (typeof patch === 'object' && patch !== null) {
      const prevLang = settings.uiLang;
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
      if (patch.uiLang === 'zh' || patch.uiLang === 'en') {
        settings.uiLang = patch.uiLang;
      }
      saveSettings();
      Menu.setApplicationMenu(buildAppMenu());
      updateTrayMenu();
      if (win && win.webContents) {
        win.webContents.send('ts:settings:changed', { ...settings });
        if (settings.uiLang !== prevLang) win.webContents.send('ts:uiLang:changed', settings.uiLang);
      }
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
    Menu.setApplicationMenu(buildAppMenu());
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