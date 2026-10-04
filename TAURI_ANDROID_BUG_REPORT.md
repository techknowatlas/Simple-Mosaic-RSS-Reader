# Tauri Android Touch Event Handling Bug Report

## Summary
Touch events on clickable elements (buttons) are not being captured/forwarded from the Android WebView to the React DOM in Tauri v2 Android applications. Buttons work correctly when accessed via Chrome DevTools remote debugging but fail to respond to touch input directly on the Android emulator.

## Environment

### Versions
- **Tauri**: v2.9.5
- **Tauri CLI**: v2.x (installed via npm @tauri-apps/cli@^2)
- **Tauri API**: v2.9.1 (@tauri-apps/api)
- **Platform**: Windows 11
- **Target**: Android (x86_64 emulator)

### Android Environment
- **Android SDK**: API 36
- **Build Tools**: 36.1.0
- **NDK**: 29.0.14206865
- **Emulator**: Pixel 9 Pro XL (sdk_gphone64_x86_64)
- **WebView**: Chrome 143.0.7499.147

### Project Setup
- **Frontend**: React 18.2.0 + TypeScript + Vite 4.5.14
- **Backend**: Rust with reqwest (rustls-tls), rss, atom_syndication

## Description

### Expected Behavior
When tapping buttons in the app header on an Android device/emulator, the onClick handlers should fire and toggle the UI state (showing/hiding modal dialogs).

### Actual Behavior
- Buttons render correctly and are visible
- Right-clicking (long press) on buttons causes the app to minimize/crash
- Regular taps have no effect
- Console logs show no events reaching the onClick handlers
- **However**: When debugging via Chrome DevTools (`chrome://inspect`), the same buttons work perfectly

### Steps to Reproduce

1. Create a Tauri v2 project with Android support:
   ```bash
   npm create tauri-app
   npm install @tauri-apps/api@^2 @tauri-apps/cli@^2
   npm run tauri android init
   ```

2. Add button components with onClick handlers:
   ```tsx
   <button 
     className="btn-primary"
     onClick={() => setShowDialog(true)}
     onTouchEnd={(e) => {
       e.preventDefault();
       setShowDialog(true);
     }}
   >
     Open Dialog
   </button>
   ```

3. Add CSS for touch handling:
   ```css
   .btn-primary {
     padding: 14px 20px;
     min-height: 48px;
     touch-action: manipulation;
     pointer-events: auto;
     -webkit-tap-highlight-color: rgba(16, 185, 129, 0.3);
   }
   ```

4. Build and run on Android emulator:
   ```bash
   npm run tauri android dev
   ```

5. Attempt to tap the button - no response
6. Connect Chrome DevTools to the WebView via `chrome://inspect`
7. With DevTools open, tap the button - it works

### MainActivity Configuration Tested

Tried multiple MainActivity.kt configurations:

**Configuration 1** (Initial - with enableEdgeToEdge):
```kotlin
class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }
}
```

**Configuration 2** (Disabled edge-to-edge):
```kotlin
class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
  }
}
```

**Configuration 3** (Manual WebView configuration):
```kotlin
class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    val webView = findViewById<WebView>(getWebViewId())
    webView?.settings?.apply {
      javaScriptEnabled = true
      domStorageEnabled = true
    }
  }
}
```

None of these configurations resolved the issue.

### Additional Context

#### Event Handler Logging
Added comprehensive logging to verify events:
```tsx
onClick={(e) => {
  console.log('Button clicked!');  // Never logs on emulator
  e.stopPropagation();
  setShowDialog(prev => !prev);
}}
```

#### Build Modes Tested
- **Dev mode** (`tauri android dev`): Buttons unresponsive + app crashes
- **Debug build** (`tauri android build --debug`): Buttons unresponsive + app crashes
- **Release build** (`tauri android build`): Same issues

#### Crash Logs
When interacting with buttons, pthread mutex errors observed:
```
FORTIFY: pthread_mutex_lock called on a destroyed mutex
EGL_NOT_INITIALIZED errors during cleanup
```

## Workaround
The only way to interact with buttons is through Chrome DevTools remote debugging, which suggests the issue is with how Tauri's Android WebView is configured for native touch event propagation.

## Impact
This issue makes it impossible to create functional Android applications with Tauri v2, as basic UI interactions (button clicks) do not work on actual devices/emulators.

## Suggested Investigation Areas

1. **WebView Touch Event Configuration**: Tauri's Android WebView may need additional touch handling configuration
2. **Event Propagation Layer**: The layer between Android's native touch events and the WebView's JavaScript context may be misconfigured
3. **Edge-to-Edge Mode**: While disabling it didn't fix the issue, there may be other system UI overlay conflicts
4. **Thread Safety**: The pthread mutex crashes suggest potential threading issues in the WebView initialization

## Related Issues
This appears related to Tauri's beta status for Android support. Mobile platforms were added in Tauri v2.0 but may have incomplete WebView event handling implementation.

---

**Note**: The Windows desktop version of this application works flawlessly with all touch/click events functioning correctly. The issue is specific to the Android platform.
