/** Dependency-free static server. No chat endpoints, model proxies, or downloads. */
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.png':'image/png', '.txt':'text/plain; charset=utf-8' };
const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
if (process.env.PUBLIC_ORIGIN) ALLOWED_HOSTS.add(new URL(process.env.PUBLIC_ORIGIN).hostname);
if (process.env.HOST && !['0.0.0.0', '::'].includes(process.env.HOST)) ALLOWED_HOSTS.add(process.env.HOST);
function text(res, status, message, head=false) {
  res.writeHead(status, { 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store' });
  res.end(head ? undefined : message);
}
export async function handleRequest(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'none'");
  const head = req.method === 'HEAD';
  try {
    const host = new URL('http://' + (req.headers.host || '')).hostname;
    if (!ALLOWED_HOSTS.has(host)) return text(res,403,'Unrecognized host. Configure PUBLIC_ORIGIN for your own host.',head);
    if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Allow','GET, HEAD'); return text(res,405,'Only static reads are supported.',head); }
    const url = new URL(req.url, 'http://' + req.headers.host);
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type':'application/json', 'Cache-Control':'no-store' });
      return res.end(head ? undefined : JSON.stringify({ ok:true, app:'Spot', version:'4.7.0' }));
    }
    const decoded = decodeURIComponent(url.pathname);
    if (decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').some(p => p.startsWith('.'))) return text(res,400,'Invalid path.',head);
    const relative = decoded === '/' ? '/index.html' : decoded;
    const full = path.resolve(PUBLIC, '.' + relative);
    if (!full.startsWith(PUBLIC + path.sep)) return text(res,403,'Forbidden.',head);
    let stat,real;
    try { real=await fsp.realpath(full); stat=await fsp.stat(real); } catch { return text(res,404,'Not found.',head); }
    if (!real.startsWith(PUBLIC + path.sep) || !stat.isFile()) return text(res,404,'Not found.',head);
    const type=MIME[path.extname(real)];
    if (!type) return text(res,404,'Not found.',head);
    res.writeHead(200, { 'Content-Type':type, 'Content-Length':stat.size, 'Cache-Control':'no-cache' });
    if (head) return res.end();
    const stream=fs.createReadStream(real);
    stream.on('error',()=>res.destroy()); res.on('close',()=>stream.destroy()); stream.pipe(res);
  } catch (error) {
    if (!res.headersSent) text(res,error instanceof URIError ? 400 : 500,'Request could not be served.',head);
    else res.destroy();
  }
}
export function createServer(tls) { return tls ? https.createServer(tls, handleRequest) : http.createServer(handleRequest); }
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4318);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
  const tls = process.env.TLS_CERT && process.env.TLS_KEY ? { cert:fs.readFileSync(process.env.TLS_CERT), key:fs.readFileSync(process.env.TLS_KEY) } : null;
  const server=createServer(tls);
  server.on('error',err=>{console.error(err.code==='EADDRINUSE' ? `Port ${port} is in use. Stop the old Spot server or choose another PORT.` : err.message);process.exitCode=1;});
  server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Spot v4.7 · ${process.env.PUBLIC_ORIGIN || `${tls?'https':'http'}://localhost:${port}`} · Ctrl+C to stop`));
  for (const sig of ['SIGINT','SIGTERM']) process.on(sig,()=>server.close(()=>process.exit(0)));
}
