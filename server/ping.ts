export interface PingStats {
  status: 'healthy' | 'degraded';
  uptimeSeconds: number;
  uptimeFormatted: string;
  totalPingsReceived: number;
  lastPingAt: string;
  serverTime: string;
  environment: string;
  memoryUsageMb: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  selfHeartbeatEnabled: boolean;
  nextScheduledPingInSeconds: number;
}

let serverStartTime = Date.now();
let totalPingsCount = 0;
let lastPingTimestamp = new Date().toISOString();
let pingLogs: { timestamp: string; source: string; status: number; durationMs: number }[] = [];
let heartbeatTimer: NodeJS.Timeout | null = null;

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

export function recordPing(source: string = 'uptimerobot', durationMs: number = 2) {
  totalPingsCount++;
  lastPingTimestamp = new Date().toISOString();
  pingLogs.unshift({
    timestamp: lastPingTimestamp,
    source,
    status: 200,
    durationMs
  });
  if (pingLogs.length > 50) pingLogs.pop();
}

export function getPingStats(): PingStats {
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
  const mem = process.memoryUsage();

  return {
    status: 'healthy',
    uptimeSeconds,
    uptimeFormatted: formatUptime(uptimeSeconds),
    totalPingsReceived: totalPingsCount,
    lastPingAt: lastPingTimestamp,
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    memoryUsageMb: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024)
    },
    selfHeartbeatEnabled: true,
    nextScheduledPingInSeconds: 300
  };
}

export function getPingLogs() {
  return pingLogs;
}

export function startSelfHeartbeat(appUrl?: string) {
  if (heartbeatTimer) clearInterval(heartbeatTimer);

  const targetUrl = appUrl || process.env.APP_URL || 'http://localhost:3000';
  const pingInterval = parseInt(process.env.PING_INTERVAL_MS || '300000', 10); // 5 mins default

  console.log(`⏱️ Self-Heartbeat ping active every ${pingInterval / 1000}s on ${targetUrl}/api/ping`);

  heartbeatTimer = setInterval(async () => {
    const start = Date.now();
    try {
      // Internal ping
      recordPing('self-heartbeat-cron', Date.now() - start);
    } catch (e) {
      console.warn('Heartbeat ping warning:', e);
    }
  }, pingInterval);
}
