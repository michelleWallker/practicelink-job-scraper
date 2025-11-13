import { promises as fs } from 'fs';
import * as path from 'path';
import type { JobRecord } from '../crawler/jobScraper';

async function ensureDirectoryExists(filePath: string): Promise<void> {
const dir = path.dirname(filePath);
await fs.mkdir(dir, { recursive: true });
}

export async function saveDataset(jobs: JobRecord[], outputFile: string): Promise<void> {
try {
const absolutePath = path.resolve(outputFile);
await ensureDirectoryExists(absolutePath);

const payload = JSON.stringify(jobs, null, 2);
await fs.writeFile(absolutePath, payload, 'utf8');
} catch (err: any) {
console.error(`Failed to save dataset to ${outputFile}: ${err?.message || err}`);
throw err;
}
}