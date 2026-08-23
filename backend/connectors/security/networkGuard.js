const dns = require('dns').promises;
const net = require('net');

function isPrivateIpv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isPrivateIpv6(ip) {
  const normalized = ip.toLowerCase();
  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized === '::'
  );
}

function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) return isPrivateIpv4(ip);
  if (net.isIPv6(ip)) return isPrivateIpv6(ip);
  return true;
}

async function assertSafeUrl(rawUrl, allowedHosts = []) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Connector URL is invalid.');
  }

  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new Error('Production connector URLs must use HTTPS.');
  }

  if (!['https:', 'http:'].includes(url.protocol)) {
    throw new Error('Only HTTP and HTTPS connector URLs are supported.');
  }

  const normalizedAllowedHosts = allowedHosts.map((host) => String(host).toLowerCase());
  if (normalizedAllowedHosts.length > 0 && !normalizedAllowedHosts.includes(url.hostname.toLowerCase())) {
    throw new Error(`Connector host ${url.hostname} is not allowed.`);
  }

  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0) throw new Error('Connector host did not resolve.');

  for (const address of addresses) {
    if (isPrivateAddress(address.address)) {
      throw new Error('Connector host resolves to a private or local network address.');
    }
  }

  return url;
}

module.exports = { assertSafeUrl, isPrivateAddress };
