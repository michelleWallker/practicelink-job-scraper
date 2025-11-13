import * as querystring from 'querystring';

export interface SearchFilters {
profession?: string;
specialty?: string;
location?: string;
recruitmentType?: string;
}

export function buildSearchUrl(baseUrl: string, filters: SearchFilters, page: number): string {
const params: Record<string, string> = {};

if (filters.profession) params.profession = filters.profession;
if (filters.specialty) params.specialty = filters.specialty;
if (filters.location) params.location = filters.location;
if (filters.recruitmentType) params.recruitmentType = filters.recruitmentType;
if (page > 1) params.page = String(page);

const qs = querystring.stringify(params);
if (!qs) return baseUrl;

const separator = baseUrl.includes('?') ? '&' : '?';
return `${baseUrl}${separator}${qs}`;
}