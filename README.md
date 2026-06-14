# Electron Clock Display

A standalone Electron application that displays a remote webpage on a Windows device with remote web-based controls for screen management and scheduling.

## Features

- **Full-screen Display**: Displays any remote HTML/webpage in kiosk mode
- **Remote Control Panel**: Web UI accessible from any device on your network
- **Screen Controls**:
  - Brightness adjustment (slider)
  - Dimming schedule (start/end times with custom brightness level)
  - Screen-off schedule (auto power-off at specific time)
- **Settings Management**:
  - Change display URL remotely
  - App restart / device restart buttons
  - Real-time status monitoring
  - Settings persistence (local JSON storage)
- **Standalone**: Single .exe file with no external dependencies

## Getting Started

See [BUILD.md](BUILD.md) for installation and build instructions.

## Project Structure

- `main.js` - Electron main process
- `src/` - Application source files
- `control-ui/` - Remote control web interface
- `package.json` - Dependencies and build configuration

## Usage

1. Build the application using the build instructions
2. Run the generated .exe file
3. Access the remote control UI at `http://<device-ip>:3000` from your network
4. Configure your clock display URL and scheduling preferences

## License

MIT
