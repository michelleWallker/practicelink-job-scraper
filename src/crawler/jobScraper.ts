import { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { createHttpClient, getHtml } from '../utils/httpClient';
import type { ProxyConfig } from '../utils/proxyManager';
import { buildSearchUrl, SearchFilters } from './filters';
import { parseJobDetail } from './detailParser';
import { saveDataset } from '../outputs/datasetBuilder';

export interface ContactInfo {
name?: string;
email?: string;
phone?: string;
}

export interface JobRecord {
jobTitle: string;
facilityName?: string;
facilityHierarchy?: string[];
profession?: string;
specialty?: string;
location?: string;
recruitmentType?: string;
contactInfo?: ContactInfo;
descriptionHtml?: string;
jobUrl: string;
scrapedAt: number;
}

export interface ScraperConfig extends SearchFilters {
baseUrl: string;
maxJobs: number;
outputFile: string;
proxy?: ProxyConfig;
delayMs?: number;
}

async function delay(ms: number): Promise<void> {
if (ms <= 0) return;
await new Promise(resolve => setTimeout(resolve, ms));
}

function createSearchClient(config: ScraperConfig): AxiosInstance {
return createHttpClient(config.proxy);
}

function extractJobLinksFromSearch(html: string, baseUrl: string): string[] {
const $ = cheerio.load(html);
const links: string[] = [];

const selectorCandidates = [
'a.job-result-link',
'.job-result a[href*="/job/"]',
'a[href*="/job/"]'
];

for (const sel of selectorCandidates) {
$(sel).each((_, el) => {
const href = $(el).attr('href');
if (!href) return;
const url = new URL(href, baseUrl).toString();
if (!links.includes(url)) {
links.push(url);
}
});
if (links.length) break;
}

return links;
}

async function fetchJobDetail(client: AxiosInstance, url: string): Promise<JobRecord | null> {
try {
const html = await getHtml(client, url);
const parsed = parseJobDetail(html, url);

if (!parsed.jobTitle) {
console.warn(`Skipping job without title: ${url}`);
return null;
}

const record: JobRecord = {
jobTitle: parsed.jobTitle,
facilityName: parsed.facilityName,
facilityHierarchy: parsed.facilityHierarchy,
profession: parsed.profession,
specialty: parsed.specialty,
location: parsed.location,
recruitmentType: parsed.recruitmentType,
contactInfo: parsed.contactInfo,
descriptionHtml: parsed.descriptionHtml,
jobUrl: parsed.jobUrl || url,
scrapedAt: parsed.scrapedAt || Date.now()
};

return record;
} catch (err: any) {
console.error(`Failed to fetch job detail for ${url}: ${err?.message || err}`);
return null;
}
}

export async function scrapeJobs(config: ScraperConfig): Promise<JobRecord[]> {
const client = createSearchClient(config);
const jobs: JobRecord[] = [];

let page = 1;
let keepGoing = true;

while (keepGoing && jobs.length < config.maxJobs) {
const searchUrl = buildSearchUrl(config.baseUrl, config, page);
console.log(`Fetching search page ${page}: ${searchUrl}`);

let html: string;
try {
html = await getHtml(client, searchUrl);
} catch (err: any) {
console.error(`Failed to fetch search page ${page}: ${err?.message || err}`);
break;
}

const links = extractJobLinksFromSearch(html, config.baseUrl);
if (!links.length) {
console.log(`No job links found on page ${page}. Stopping.`);
break;
}

for (const link of links) {
if (jobs.length >= config.maxJobs) {
keepGoing = false;
break;
}

const record = await fetchJobDetail(client, link);
if (record) {
jobs.push(record);
console.log(`Scraped job: ${record.jobTitle}`);
}

await delay(config.delayMs ?? 500);
}

page += 1;
}

await saveDataset(jobs, config.outputFile);
console.log(`Scraped ${jobs.length} job(s). Output written to ${config.outputFile}.`);

return jobs;
}