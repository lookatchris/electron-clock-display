'use strict';

/**
 * Screen control for Windows using PowerShell / WMI.
 * On non-Windows platforms the functions log a warning and return without error
 * so that development on macOS/Linux still works.
 */

const { exec } = require('child_process');

function runPS(command) {
  return new Promise((resolve, reject) => {
    exec(
      `powershell -NoProfile -NonInteractive -Command "${command}"`,
      { timeout: 5000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr || err.message));
        } else {
          resolve(stdout.trim());
        }
      }
    );
  });
}

/**
 * Set monitor brightness (0-100).
 * Uses WMI WmiMonitorBrightnessMethods – works on laptops/Surface with integrated display.
 */
async function setBrightness(level) {
  if (process.platform !== 'win32') {
    console.warn('[screen-control] setBrightness: not on Windows, skipping.');
    return;
  }
  const clamped = Math.max(0, Math.min(100, Math.round(level)));
  await runPS(
    `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,${clamped})`
  );
}

/**
 * Turn off the display by sending the SC_MONITORPOWER message via SendMessage.
 * Mode 2 = off, 1 = low-power, -1 = on.
 */
async function turnOffScreen() {
  if (process.platform !== 'win32') {
    console.warn('[screen-control] turnOffScreen: not on Windows, skipping.');
    return;
  }
  const ps = [
    "Add-Type -TypeDefinition @'",
    'using System;',
    'using System.Runtime.InteropServices;',
    'public class Display {',
    '  [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);',
    '}',
    "'@",
    '[Display]::SendMessage([IntPtr]0xFFFF, 0x0112, [IntPtr]0xF170, [IntPtr]2) | Out-Null',
  ].join(' `n');
  await runPS(ps);
}

/**
 * Wake the display by simulating a small mouse movement.
 */
async function turnOnScreen() {
  if (process.platform !== 'win32') {
    console.warn('[screen-control] turnOnScreen: not on Windows, skipping.');
    return;
  }
  const ps = [
    "Add-Type -TypeDefinition @'",
    'using System;',
    'using System.Runtime.InteropServices;',
    'public class Mouse {',
    '  [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, UIntPtr dwExtraInfo);',
    '}',
    "'@",
    '[Mouse]::mouse_event(0x0001, 1, 0, 0, [UIntPtr]::Zero)',
    '[Mouse]::mouse_event(0x0001, -1, 0, 0, [UIntPtr]::Zero)',
  ].join(' `n');
  await runPS(ps);
}

module.exports = { setBrightness, turnOffScreen, turnOnScreen };
