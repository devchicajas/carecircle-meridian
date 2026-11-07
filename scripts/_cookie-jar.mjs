/** Minimal cookie jar for Node fetch-based E2E. */
export class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  store(res) {
    const raw = res.headers.getSetCookie?.() || [];
    const single = res.headers.get("set-cookie");
    const list = raw.length ? raw : single ? [single] : [];
    for (const line of list) {
      const part = line.split(";")[0];
      const eq = part.indexOf("=");
      if (eq < 0) continue;
      const name = part.slice(0, eq).trim();
      const value = part.slice(eq + 1).trim();
      this.cookies.set(name, value);
    }
  }

  header() {
    return [...this.cookies.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  async fetch(url, init = {}) {
    const headers = new Headers(init.headers || {});
    const cookie = this.header();
    if (cookie) headers.set("cookie", cookie);
    const res = await fetch(url, { ...init, headers });
    this.store(res);
    return res;
  }
}
