// Dependency-free Chrome DevTools harness. Test data uses a separate profile.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import net from 'node:net';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

class Connection {
  constructor(socket) {
    this.socket = socket;
    this.sequence = 0;
    this.pending = new Map();
    this.events = [];
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const callback = this.pending.get(message.id);
        if (callback) {
          this.pending.delete(message.id);
          clearTimeout(callback.timeout);
          if (message.error) callback.reject(new Error(message.error.message));
          else callback.resolve(message.result);
        }
      } else this.events.push(message);
    });
    socket.addEventListener('close', () => {
      for (const callback of this.pending.values()) { clearTimeout(callback.timeout); callback.reject(new Error('Browser connection closed.')); }
      this.pending.clear();
    });
  }
  call(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { this.pending.delete(id); reject(new Error(method + ' timed out.')); }, 20000);
      this.pending.set(id, { resolve, reject, timeout });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result?.value;
  }
  close() { this.socket.close(); }
}
async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  return new Connection(socket);
}
async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
export async function waitFor(page, expression, timeout = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await page.evaluate(expression)) return;
    await delay(80);
  }
  throw new Error('Condition did not become true: ' + expression);
}
export async function createEnvironment() {
  const candidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean);
  let executable;
  for (const candidate of candidates) {
    try { await access(candidate); executable = candidate; break; } catch {}
  }
  if (!executable) throw new Error('Install Chrome/Edge or set CHROME_PATH to your Chromium executable.');
  const tempBase = path.join(root, '.tmp');
  await mkdir(tempBase, { recursive: true });
  const profile = await mkdtemp(path.join(tempBase, 'browser-'));
  const port = await freePort();
  const server = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, PORT: String(port) }, windowsHide: true, stdio: 'pipe' });
  const url = 'http://127.0.0.1:' + port;
  let serverError = '';
  server.stderr.on('data', chunk => { serverError += chunk; });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url)).ok) break; } catch {}
    if (i === 99) throw new Error('Static server did not start. ' + serverError);
    await delay(80);
  }
  const chrome = spawn(executable, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-background-timer-throttling', '--autoplay-policy=no-user-gesture-required', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let debugPort;
  for (let i = 0; i < 150; i++) {
    try { debugPort = Number((await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); if (debugPort) break; } catch {}
    await delay(80);
  }
  if (!debugPort) { server.kill(); chrome.kill(); throw new Error('Chrome did not expose a DevTools port.'); }
  const version = await (await fetch('http://127.0.0.1:' + debugPort + '/json/version')).json();
  const browser = await connect(version.webSocketDebuggerUrl);
  const targets = await (await fetch('http://127.0.0.1:' + debugPort + '/json/list')).json();
  const page = await connect(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await page.call('Runtime.enable');
  await page.call('Page.enable');
  await page.call('Log.enable');
  await page.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  return {
    page, browser, url, profile,
    async stop() {
      page.close();
      try { await browser.call('Browser.close'); } catch {}
      browser.close();
      server.kill();
      // This process owns only the browser and static server it started.
      if (chrome.exitCode === null) chrome.kill();
    }
  };
}
