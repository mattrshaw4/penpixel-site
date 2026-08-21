/**
 * Penpixel Creative - SSRF-safe URL validation (Phase 1)
 * ----------------------------------------------------------------------------
 * Turns an untrusted user-submitted string into a safe ORIGIN we are willing to
 * fetch fixed benign paths from (/robots.txt, /llms.txt), or rejects it.
 *
 * Defense in depth. On Cloudflare's edge, a Pages Function fetch() cannot route
 * to private IP space or the cloud metadata endpoint anyway (it egresses as
 * public Internet traffic, with no adjacent internal network). This validator
 * is the app-layer belt to that network-layer suspenders: it rejects obvious
 * internal targets before we ever make a request, keeps the tool from being
 * used as a port scanner or open fetch proxy, and stays correct if the code is
 * ever lifted off the edge.
 *
 * KEY SIMPLIFICATION (verified): the WHATWG URL parser (same in Node and the
 * Workers runtime) already normalizes every IPv4 alternate encoding to
 * canonical dotted-decimal (2130706433, 0x7f000001, 0177.0.0.1, 127.1 all
 * become 127.0.0.1). So the blocklist only matches canonical forms; we do not
 * hand-roll octal/hex/decimal decoding.
 *
 * We DISCARD any user-supplied path, query, and fragment. We only ever fetch
 * fixed paths on the validated origin. This shrinks the SSRF surface to "which
 * host", never "which arbitrary URL".
 */


// Canonical-form blocklist. IPv4 is post-normalization dotted-decimal.
const BLOCKED_HOST_PATTERNS = [
  // Loopback / unspecified
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,   // 127.0.0.0/8
  /^0\.0\.0\.0$/,
  /^localhost$/i,
  // RFC 1918 private ranges
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,               // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,  // 172.16.0.0/12
  /^192\.168\.\d{1,3}\.\d{1,3}$/,                  // 192.168.0.0/16
  // Link-local + cloud metadata (AWS/GCP/Azure/DO/OpenStack)
  /^169\.254\.\d{1,3}\.\d{1,3}$/,       // 169.254.0.0/16 incl. 169.254.169.254
  /^metadata\.google\.internal$/i,
  /^instance-data(\.ec2\.internal)?$/i,
  // Carrier-grade NAT + benchmarking + reserved that shouldn't be scanned
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/, // 100.64.0.0/10
  // IPv6 (hostname arrives bracket-stripped by our code below)
  /^::1$/,                               // IPv6 loopback
  /^::$/,                                // unspecified
  /^fe80:/i,                            // link-local
  /^fe[89ab][0-9a-f]:/i,                // link-local range
  /^f[cd][0-9a-f]{2}:/i,                // unique local fc00::/7
  /^::ffff:/i,                          // IPv4-mapped IPv6 (avoid bypass)
  // Internal-looking single-label / mDNS TLDs
  /\.local$/i,
  /\.internal$/i,
];

const ALLOWED_SCHEMES = new Set(['http:', 'https:']);
const ALLOWED_PORTS = new Set(['', '80', '443']); // '' == scheme default

/**
 * @param {string} raw  user-submitted string (may lack a scheme)
 * @returns {{ok:true, origin:string, hostname:string} | {ok:false, reason:string}}
 */
function validateAndNormalizeUrl(raw) {
  if (typeof raw !== 'string') return { ok: false, reason: 'No URL provided.' };
  let s = raw.trim();
  if (s.length === 0) return { ok: false, reason: 'No URL provided.' };
  if (s.length > 2000) return { ok: false, reason: 'URL is too long.' };

  // If the user omitted a scheme (typed "example.com"), assume https.
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) s = 'https://' + s;

  let u;
  try {
    u = new URL(s);
  } catch {
    return { ok: false, reason: 'That does not look like a valid web address.' };
  }

  if (!ALLOWED_SCHEMES.has(u.protocol)) {
    return { ok: false, reason: 'Only http and https addresses are supported.' };
  }
  if (u.username || u.password) {
    return { ok: false, reason: 'Addresses with embedded credentials are not allowed.' };
  }
  if (!ALLOWED_PORTS.has(u.port)) {
    return { ok: false, reason: 'Only standard web ports (80, 443) are supported.' };
  }

  // Strip IPv6 brackets for pattern matching, keep original for the origin.
  const hostForCheck = u.hostname.replace(/^\[/, '').replace(/\]$/, '');

  // Require a public-looking host: must contain a dot (rejects bare intranet
  // names like "gitlab" or "localhost") OR be a bracketed IPv6 we then block.
  if (!hostForCheck.includes('.') && !hostForCheck.includes(':')) {
    return { ok: false, reason: 'Enter a full public domain (for example, example.com).' };
  }

  for (const pat of BLOCKED_HOST_PATTERNS) {
    if (pat.test(hostForCheck)) {
      return { ok: false, reason: 'That address points to a private or internal host, which cannot be scanned.' };
    }
  }

  // Safe origin only. Path/query/fragment are intentionally discarded.
  return { ok: true, origin: `${u.protocol}//${u.host}`, hostname: u.hostname };
}

export { validateAndNormalizeUrl, BLOCKED_HOST_PATTERNS };
