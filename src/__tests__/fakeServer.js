// A tiny in-memory stand-in for api/index.py used by the sync tests:
// one household, version bumps on every write.
export function fakeServer(initialDoc = {}) {
  const docs = {};
  let n = 0;
  const calls = [];
  const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
  const fetch = async (url, { method = "GET", body } = {}) => {
    calls.push({ method, url, body: body ? JSON.parse(body) : undefined });
    const m = url.match(/\/api\/households(?:\/([A-Z0-9]+))?(?:\?since=(.*))?$/);
    const code = m?.[1];
    if (method === "POST") {
      docs.ABC234 = { data: { ...initialDoc, ...JSON.parse(body) }, version: `v${++n}` };
      return json(201, { code: "ABC234", version: docs.ABC234.version });
    }
    const doc = docs[code];
    if (!doc) return json(404, { detail: "No household with that code" });
    if (method === "PATCH") {
      Object.assign(doc.data, JSON.parse(body));
      doc.version = `v${++n}`;
      return json(200, { version: doc.version });
    }
    const since = m?.[2] && decodeURIComponent(m[2]);
    if (since === doc.version) return json(200, { changed: false, version: doc.version });
    return json(200, { changed: true, version: doc.version, data: doc.data });
  };
  return { fetch, calls, docs, seed: (data) => (docs.ABC234 = { data, version: `v${++n}` }) };
}
