# Building Practice Log for Windows

## Quick Setup (Automated)

1. Open PowerShell as Administrator
2. Navigate to this folder:
   ```
   cd path\to\music-practice-log
   ```
3. Allow script execution (one-time):
   ```
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
4. Run the setup script:
   ```
   .\windows-setup.ps1
   ```

## Manual Setup

### Prerequisites

1. **Node.js** (LTS version)
   - Download: https://nodejs.org/
   - Or via winget: `winget install OpenJS.NodeJS.LTS`

2. **Rust**
   - Download: https://rustup.rs/
   - Or via winget: `winget install Rustlang.Rustup`

3. **WebView2** (usually pre-installed on Windows 11)
   - Download if needed: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### Build Steps

```powershell
# Install dependencies
npm install

# Build the app
npm run tauri:build
```

### Output

After building, you'll find the installers at:
- `src-tauri\target\release\bundle\nsis\Practice Log_0.1.0_x64-setup.exe`
- `src-tauri\target\release\bundle\msi\Practice Log_0.1.0_x64.msi`

## Troubleshooting

- **"npm not found"**: Restart PowerShell after installing Node.js
- **"rustc not found"**: Restart PowerShell after installing Rust
- **WebView2 errors**: Download and install WebView2 Runtime manually
