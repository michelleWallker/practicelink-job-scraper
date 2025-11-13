import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createProxyAgent, ProxyConfig } from './proxyManager';

export function createHttpClient(proxyConfig?: ProxyConfig): AxiosInstance {
const agent = createProxyAgent(proxyConfig);

return axios.create({
timeout: 15000,
httpAgent: agent,
httpsAgent: agent,
headers: {
'User-Agent': 'PracticelinkJobScraper/1.0 (+https://bitbash.dev)',
'Accept-Language': 'en-US,en;q=0.9'
},
validateStatus: status => typeof status === 'number' && status >= 200 && status < 400
});
}

export async function getHtml(
client: AxiosInstance,
url: string,
config?: AxiosRequestConfig
): Promise<string> {
try {
const response = await client.get<string>(url, config);
return response.data;
} catch (err: any) {
const message = err?.message || 'Unknown HTTP error';
console.error(`HTTP GET failed for ${url}: ${message}`);
throw err;
}
}