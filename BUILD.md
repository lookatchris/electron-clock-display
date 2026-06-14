# Build Instructions

## Prerequisites

- **Node.js** 18 or later – https://nodejs.org
- **npm** (bundled with Node.js)
- **Windows** (for the final build, but development works on any OS)

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Run in development mode

```bash
npm start
```

The Electron window opens in kiosk mode and the control server starts on **port 3000**.  
Open `http://localhost:3000` (or `http://<device-ip>:3000` from another device on your network) to access the remote control dashboard.

---

## 3. Build a standalone executable

### Portable .exe (single file, no installation required)

```bash
npm run build
```

Output: `dist/ClockDisplay-Portable.exe`

### Installer .exe (NSIS one-click installer)

```bash
npm run build:installer
```

Output: `dist/ClockDisplay Setup *.exe`

---

## 4. Configuration

On first launch the app creates a `settings.json` file in the user-data directory:

| OS      | Location |
|---------|----------|
| Windows | `%APPDATA%\electron-clock-display\settings.json` |
| macOS   | `~/Library/Application Support/electron-clock-display/settings.json` |
| Linux   | `~/.config/electron-clock-display/settings.json` |

You can edit this file manually or use the remote control UI to adjust all settings at runtime.

### Default settings

```json
{
  "displayUrl": "https://www.timeanddate.com/clock/fullscreen.html",
  "brightness": 100,
  "screenOff": false,
  "dimmingSchedule": {
    "enabled": false,
    "startTime": "22:00",
    "endTime": "07:00",
    "dimmingLevel": 20
  },
  "screenOffSchedule": {
    "enabled": false,
    "offTime": "23:00",
    "onTime": "07:00"
  }
}
```

---

## 5. Remote control UI

Access the dashboard from any device on the same network:

```
http://<device-ip>:3000
```

The device IP is printed to the console on startup. From the dashboard you can:

- Change the display URL
- Adjust screen brightness (0–100 %)
- Manually turn the screen on or off
- Configure a **dimming schedule** (auto-dim between two times)
- Configure a **screen-off schedule** (auto power-off between two times)
- Restart the Electron application
- Restart the Windows device

---

## 6. Notes on screen brightness & power control

Brightness control uses the Windows WMI class `WmiMonitorBrightnessMethods`.  
This works on devices with an **integrated display** (Surface, laptops).  
External monitors connected via HDMI/DisplayPort may not support WMI brightness and will be skipped silently.

Screen on/off uses Win32 `SendMessage` (turn off) and mouse-event simulation (wake).

---

## 7. Auto-start on Windows login (optional)

To have the app start automatically when Windows boots, create a shortcut to the `.exe` and place it in:

```
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
```

Or use **Task Scheduler** for more control (e.g. run as a specific user, delay start).
