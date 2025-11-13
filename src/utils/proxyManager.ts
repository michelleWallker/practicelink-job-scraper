import { HttpsProxyAgent } from 'https-proxy-agent';
import type { Agent } from 'http';

export interface ProxyConfig {
useProxy: boolean;
proxyUrl?: string;
}

export function createProxyAgent(config?: ProxyConfig): Agent | undefined {
if (!config || !config.useProxy || !config.proxyUrl) {
return undefined;
}

try {
return new HttpsProxyAgent(config.proxyUrl);
} catch (err: any) {
console.error(`Failed to create proxy agent: ${err?.message || err}`);
return undefined;
}
}