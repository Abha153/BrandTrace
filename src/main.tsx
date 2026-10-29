import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Every /api/ request carries the workspace id and an anonymous per-browser id, so reviews are never mixed between
// visitors of the shared demo workspace. Headers set explicitly by a caller are left untouched.
const clientId = (() => {
  try {
    let id = localStorage.getItem('brandtrace_client_id');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('brandtrace_client_id', id); }
    return id;
  } catch { return 'anonymous'; }
})();
const nativeFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
  if (url.startsWith('/api/')) {
    const headers = new Headers(init.headers);
    if (!headers.has('x-workspace-id')) {
      let ws = 'demo';
      try { ws = localStorage.getItem('brandtrace_workspace_id') || 'demo'; } catch { /* storage unavailable */ }
      headers.set('x-workspace-id', ws);
    }
    headers.set('x-client-id', clientId);
    init = { ...init, headers };
  }
  return nativeFetch(input, init);
};

createRoot(document.getElementById('root')!).render(<App />);
