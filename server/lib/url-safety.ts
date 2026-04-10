function parseIPv4FromMapped(hex: string): string | null {
  const match = hex.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (!match) return null;
  const hi = parseInt(match[1], 16);
  const lo = parseInt(match[2], 16);
  return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
}

function isPrivateIPv4(ip: string): boolean {
  const blocked = ['127.0.0.1', '0.0.0.0'];
  const blockedPrefixes = ['10.', '172.16.', '172.17.', '172.18.', '172.19.',
    '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
    '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
    '192.168.', '169.254.'];
  return blocked.includes(ip) || blockedPrefixes.some(b => ip.startsWith(b));
}

export function isSafeWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    let hostname = parsed.hostname.toLowerCase();

    const directBlocked = ['localhost', 'metadata.google.internal'];
    if (directBlocked.includes(hostname)) return false;

    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      const inner = hostname.slice(1, -1);

      if (inner === '::1' || inner === '0:0:0:0:0:0:0:1') return false;
      if (inner.startsWith('fe80:') || inner.startsWith('fd')) return false;

      const mapped = parseIPv4FromMapped(inner);
      if (mapped && isPrivateIPv4(mapped)) return false;

      return true;
    }

    if (isPrivateIPv4(hostname)) return false;

    const blockedPrefixes = ['fd', 'fe80:'];
    if (blockedPrefixes.some(b => hostname.startsWith(b))) return false;

    return true;
  } catch { return false; }
}
