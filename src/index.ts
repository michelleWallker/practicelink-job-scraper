import { promises as fs } from 'fs';
import * as path from 'path';
import { scrapeJobs, ScraperConfig } from './crawler/jobScraper';

interface RawConfig {
baseUrl?: string;
profession?: string;
specialty?: string;
location?: string;
recruitmentType?: string;
maxJobs?: number;
outputFile?: string;
proxy?: {
useProxy?: boolean;
proxyUrl?: string;
};
delayMs?: number;
}

async function loadConfig(configPath: string): Promise<RawConfig> {
const absolute = path.resolve(configPath);
const content = await fs.readFile(absolute, 'utf8');
return JSON.parse(content) as RawConfig;
}

function normalizeConfig(raw: RawConfig): ScraperConfig {
if (!raw.baseUrl) {
throw new Error('Missing "baseUrl" in configuration.');
}

const maxJobs = raw.maxJobs && raw.maxJobs > 0 ? raw.maxJobs : 100;
const outputFile = raw.outputFile
? path.resolve(raw.outputFile)
: path.resolve(process.cwd(), 'data', 'sample-results.json');

return {
baseUrl: raw.baseUrl,
profession: raw.profession,
specialty: raw.specialty,
location: raw.location,
recruitmentType: raw.recruitmentType,
maxJobs,
outputFile,
proxy: raw.proxy
? {
useProxy: !!raw.proxy.useProxy && !!raw.proxy.proxyUrl,
proxyUrl: raw.proxy.proxyUrl
}
: undefined,
delayMs: raw.delayMs ?? 500
};
}

async function main(): Promise<void> {
const configPathFromArg = process.argv[2];
const defaultConfigPath = path.join(__dirname, 'config', 'input.example.json');
const configPath = configPathFromArg || defaultConfigPath;

try {
console.log(`Using configuration: ${configPath}`);
const raw = await loadConfig(configPath);
const config = normalizeConfig(raw);

await scrapeJobs(config);
} catch (err: any) {
console.error(`Fatal error: ${err?.message || err}`);
process.exitCode = 1;
}
}

if (require.main === module) {
// eslint-disable-next-line no-floating-promises
main();
}