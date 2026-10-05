import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Exercise the real interceptors with deterministic HTTP adapters, without a server.
const bundle = await build({
  stdin: { contents: "export { default as api, authApi } from './src/api/api'; export * from './src/api/session'; export { AxiosError } from 'axios';", resolveDir: process.cwd() },
  bundle: true, write: false, format: 'esm', platform: 'browser',
  define: { 'import.meta.env': '{"VITE_API_URL":"http://localhost:9999"}' },
});
globalThis.window = new EventTarget();
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
const { api, authApi, getSession, startSession, clearSession, updateSessionTokens, AxiosError } =
  await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const ok = (config, data = {}) => ({ config, data, status: 200, statusText: 'OK', headers: {} });
const fail = (config, status) => Promise.reject(new AxiosError('HTTP ' + status, 'ERR_BAD_RESPONSE', config, null, { ...ok(config), status }));
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

beforeEach(() => { storage.clear(); startSession({ access: 'expired', refresh: 'refresh', user: { id: 1, username: 'alice' } }); });

test('parallel unauthorized requests share a refresh and retry with the new token', async () => {
  let calls = 0;
  authApi.defaults.adapter = async config => { calls++; return ok(config, { access: 'fresh' }); };
  api.defaults.adapter = config => config.headers.Authorization === 'Bearer fresh' ? Promise.resolve(ok(config, { success: true })) : fail(config, 401);
  const responses = await Promise.all([api.get('/api/products/'), api.get('/api/dashboard/')]);
  assert.equal(calls, 1);
  assert.ok(responses.every(response => response.data.success));
});

test('a temporary refresh server error retains credentials and profile', async () => {
  authApi.defaults.adapter = config => fail(config, 503);
  api.defaults.adapter = config => fail(config, 401);
  await assert.rejects(api.get('/api/products/'));
  assert.equal(getSession().refresh, 'refresh');
  assert.equal(getSession().user.username, 'alice');
});

test('a rejected refresh clears the session', async () => {
  authApi.defaults.adapter = config => fail(config, 401);
  api.defaults.adapter = config => fail(config, 401);
  await assert.rejects(api.get('/api/products/'));
  assert.equal(getSession(), null);
});

test('logout during refresh cannot resurrect a session or replay a mutation', async () => {
  const pending = deferred(); const started = deferred(); let writes = 0;
  authApi.defaults.adapter = async config => { started.resolve(); await pending.promise; return ok(config, { access: 'fresh' }); };
  api.defaults.adapter = config => { writes++; return fail(config, 401); };
  const request = api.post('/api/products/1/sell/', { quantity: 1 });
  await started.promise;
  clearSession(); pending.resolve();
  await assert.rejects(request);
  assert.equal(getSession(), null);
  assert.equal(writes, 1);
});

test('a delayed failed refresh cannot erase a newly logged-in account', async () => {
  const pending = deferred(); const started = deferred();
  authApi.defaults.adapter = async config => { started.resolve(); await pending.promise; return fail(config, 401); };
  api.defaults.adapter = config => fail(config, 401);
  const request = api.get('/api/products/');
  await started.promise;
  startSession({ access: 'bob-access', refresh: 'bob-refresh', user: { id: 2, username: 'bob' } });
  pending.resolve(); await assert.rejects(request);
  assert.equal(getSession().user.username, 'bob');
  assert.equal(getSession().access, 'bob-access');
});

test('a delayed 401 reuses a token refreshed by another tab', async () => {
  let calls = 0;
  authApi.defaults.adapter = async config => { calls++; return ok(config, { access: 'unexpected' }); };
  api.defaults.adapter = config => {
    if (config.headers.Authorization === 'Bearer fresh') return Promise.resolve(ok(config));
    updateSessionTokens(getSession().id, { access: 'fresh' });
    return fail(config, 401);
  };
  await api.get('/api/products/');
  assert.equal(calls, 0);
});

test('public login/register/reset calls never include stale Authorization', async () => {
  authApi.defaults.adapter = async config => { assert.equal(config.headers.Authorization, undefined); return ok(config); };
  for (const path of ['login', 'register', 'forgot-password', 'reset-password', 'logout']) await authApi.post('/api/auth/' + path + '/', {});
});

test('responses belonging to the previous account are discarded', async () => {
  const pending = deferred(); const started = deferred();
  api.defaults.adapter = async config => { started.resolve(); await pending.promise; return ok(config, { private: 'alice' }); };
  const request = api.get('/api/products/'); await started.promise;
  startSession({ access: 'bob-access', refresh: 'bob-refresh' }); pending.resolve();
  await assert.rejects(request);
});

test('legacy credentials migrate without signing the user out', () => {
  storage.clear(); storage.set('access', 'old-access'); storage.set('refresh', 'old-refresh');
  assert.equal(getSession().refresh, 'old-refresh');
  assert.equal(storage.get('refresh'), undefined);
  assert.equal(getSession().access, 'old-access');
});
