// web/web-boot.js — Web 模式入口：解析 ?payload= 复用 uTools 同款人口解析逻辑
// Electron 模式：显示全局快捷键设置、录制快捷键、监听托盘/快捷键呼出聚焦输入框
(function () {
  var params = new URLSearchParams(location.search);
  var payload = params.get('payload');
  if (payload != null && typeof handleEnterPayload === 'function') {
    handleEnterPayload(payload);
    return;
  }
  var ts = params.get('ts');
  if (ts != null && typeof handleEnterPayload === 'function') {
    handleEnterPayload(ts);
  }
})();

(function () {
  var shell = window.tsShell;
  if (!shell) return;

  var section = document.getElementById('sys-hotkey');
  var input = document.getElementById('hotkey-input');
  var toggle = document.getElementById('hotkey-enabled');
  var resetBtn = document.getElementById('hotkey-reset');
  if (section) section.style.display = '';
  if (!input || !toggle || !resetBtn) return;

  function accelDisplay(acc) {
    return String(acc).replace(/CommandOrControl/g, 'Ctrl').replace(/CmdOrCtrl/g, 'Ctrl');
  }

  function accelFromEvent(e) {
    var parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    var key = e.key;
    if (/^[a-zA-Z]$/.test(key)) key = key.toUpperCase();
    else if (/^[0-9]$/.test(key) || /^F\d{1,2}$/.test(key)) { /* keep */ }
    else if (key === ' ') key = 'Space';
    else return null;
    if (parts.length === 0) return null;
    parts.push(key);
    return parts.join('+');
  }

  function setDisplay(s) {
    input.value = s.hotkeyEnabled ? accelDisplay(s.hotkey) : t('hotkeyDisabled');
    toggle.checked = !!s.hotkeyEnabled;
  }

  shell.getSettings().then(function (s) { setDisplay(s); }).catch(function () {});

  var recording = false;
  input.addEventListener('focus', function () {
    recording = true;
    input.classList.add('recording');
    input.value = t('hotkeyRecord');
  });
  input.addEventListener('keydown', function (e) {
    if (!recording) return;
    e.preventDefault();
    if (e.key === 'Escape') { input.blur(); return; }
    var accel = accelFromEvent(e);
    if (!accel) {
      toast(t('hotkeyNoModifier'));
      return;
    }
    input.blur();
    shell.setSettings({ hotkey: accel }).then(function (r) {
      if (r && r.ok) {
        if (r.settings) setDisplay(r.settings);
        toast(t('hotkeySaved'));
      } else {
        toast(t('hotkeyConflict'));
        shell.getSettings().then(function (s) { setDisplay(s); }).catch(function () {});
      }
    }).catch(function () {});
  });
  input.addEventListener('blur', function () {
    recording = false;
    input.classList.remove('recording');
    shell.getSettings().then(function (s) { setDisplay(s); }).catch(function () {});
  });

  toggle.addEventListener('change', function () {
    shell.setSettings({ hotkeyEnabled: toggle.checked }).then(function (r) {
      if (r && r.ok && r.settings) setDisplay(r.settings);
      else { toggle.checked = !toggle.checked; toast(t('hotkeyConflict')); }
    }).catch(function () {});
  });

  resetBtn.addEventListener('click', function () {
    shell.setSettings({ hotkey: 'Ctrl+Alt+T' }).then(function (r) {
      if (r && r.ok && r.settings) { setDisplay(r.settings); toast(t('hotkeySaved')); }
      else toast(t('hotkeyConflict'));
    }).catch(function () {});
  });

  shell.onSettingsChanged(function (s) { setDisplay(s); });

  shell.onSummon(function () {
    if (typeof initTimestampInput === 'function' && tsInput) {
      initTimestampInput();
      tsInput.focus();
    }
  });
})();