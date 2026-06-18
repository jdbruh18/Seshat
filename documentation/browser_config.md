# Browser & Chrome DevTools Configuration Guide

This guide details how to configure Google Chrome for remote debugging, performance profiling, and automated auditing of the **AI Academic Assistant** application using the Chrome DevTools Protocol (CDP).

---

## 🚀 1. Launching Chrome with Remote Debugging

To allow external scripts, development extensions, and test suites to interact with Chrome, you must launch it with the `--remote-debugging-port` flag.

### 💻 Windows (PowerShell)
Run the following command to launch Chrome in an isolated profile with remote debugging enabled on port `9222`:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir="$env:TEMP\chrome-dev-profile" `
  --no-first-run `
  --no-default-browser-check
```

### 🍎 macOS (Terminal)
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/tmp/chrome-dev-profile" \
  --no-first-run \
  --no-default-browser-check
```

### 🐧 Linux (Terminal)
```bash
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/tmp/chrome-dev-profile" \
  --no-first-run \
  --no-default-browser-check
```

---

## 🔍 2. Verifying the Connection

Once Chrome has started with the remote debugging port active, you can verify it is running by checking the JSON endpoint:

1. Open your browser and navigate to: [http://localhost:9222/json](http://localhost:9222/json)
2. You should see a list of active tabs/targets in JSON format:
   ```json
   [
     {
       "description": "",
       "devtoolsFrontendUrl": "/devtools/inspector.html?ws=localhost:9222/devtools/page/...",
       "id": "A4E7F...",
       "title": "New Tab",
       "type": "page",
       "url": "chrome://newtab/",
       "webSocketDebuggerUrl": "ws://localhost:9222/devtools/page/..."
     }
   ]
   ```

---

## 🛠️ 3. Connecting Chrome DevTools

There are two primary methods to inspect the remote browser instance:

### Option A: Using `chrome://inspect` (Recommended)
1. Open a normal instance of Chrome.
2. In the URL bar, type: `chrome://inspect` and press Enter.
3. Ensure the checkbox **"Discover network targets"** is active.
4. Click **"Configure..."** next to the checkbox, and verify `localhost:9222` is listed.
5. Under **"Remote Target"**, you will see your debugged tabs. Click **"inspect"** to open an independent DevTools window.

### Option B: Integration with AI Coding Assistants
If you are pair-programming with Antigravity, you can use the `chrome-devtools-plugin` to let the assistant inspect, read, and manipulate the DOM directly. Provide the assistant with:
- The WebSocket Debugger URL: `ws://localhost:9222/devtools/page/<PAGE_ID>`
- The URL of the page under test (e.g. `http://localhost:3000/login`).

---

## 📈 4. Performance Profiling & Auditing

### Performance Audits (Lighthouse)
1. Launch remote debugging and open the Academic Assistant frontend (`http://localhost:3000`).
2. Open DevTools (`F12` or `chrome://inspect`).
3. Click on the **Lighthouse** tab.
4. Select **Navigation (Default)**, choose **Desktop**, and check:
   * [x] Performance
   * [x] Accessibility
   * [x] Best Practices
   * [x] SEO
5. Click **"Analyze page load"** to generate a performance audit.

### Troubleshooting Layout Shift (CLS)
1. Go to the **Performance** tab in DevTools.
2. Check the **"Web Vitals"** checkbox.
3. Click the **Record** icon and interact with the Course Builder or Dashboard.
4. Stop recording. Look at the **"Experience"** row for any red blocks indicating **Cumulative Layout Shift (CLS)**.

---

## 🔒 5. Security & Isolation Best Practices

> [!WARNING]
> Remote debugging allows arbitrary JavaScript execution and filesystem access (via chrome APIs) within the context of the user profile. Always isolate your sessions.

1. **Use Isolated User Directories**: Always use a temporary directory for `--user-data-dir` (e.g., `chrome-dev-profile`). This prevents the debugger session from accessing your personal cookies, saved passwords, or autofill data.
2. **Bind Locally**: Ensure that port `9222` is bound only to `127.0.0.1`. Do not expose this port on public networks, as it lacks authentication.
3. **Headless Execution for Automated CI**: If running audits in automated pipelines, use the `--headless=new` flag to run without a visual interface:
   ```bash
   chrome --headless=new --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-headless-profile"
   ```
