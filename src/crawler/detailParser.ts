import * as cheerio from 'cheerio';
import type { JobRecord, ContactInfo } from './jobScraper';

export function parseJobDetail(html: string, jobUrl: string): Partial<JobRecord> {
const $ = cheerio.load(html);

const textOrFallback = (selectors: string[], attr?: string): string => {
for (const sel of selectors) {
const el = $(sel).first();
if (el.length) {
const value = attr ? el.attr(attr) : el.text();
if (value && value.trim()) return value.trim();
}
}
return '';
};

const jobTitle = textOrFallback(['h1', '.job-title', '.job-header h1']);

const facilityName = textOrFallback([
'.facility-name',
'.employer-name',
'.company-name',
'.job-header__employer'
]);

const profession = textOrFallback(['.profession', 'li.profession', 'dt:contains("Profession") + dd']);
const specialty = textOrFallback(['.specialty', 'li.specialty', 'dt:contains("Specialty") + dd']);
const location = textOrFallback([
'.location',
'.job-location',
'li.location',
'dt:contains("Location") + dd'
]);

const recruitmentType = textOrFallback([
'.recruitment-type',
'dt:contains("Recruitment Type") + dd'
]);

const contactName = textOrFallback([
'.recruiter-name',
'.contact-name',
'.recruiter h3',
'.contact h3'
]);

const contactEmailHref = textOrFallback(
['a[href^="mailto:"]'],
'href'
);
const contactEmail = contactEmailHref.replace(/^mailto:/i, '');

const contactPhone = textOrFallback([
'.contact-phone',
'.recruiter-phone',
'a[href^="tel:"]'
]);

const descriptionHtml = (() => {
const descriptionSelectorCandidates = [
'.job-description',
'#job-description',
'.description',
'.job-body',
'article'
];

for (const sel of descriptionSelectorCandidates) {
const section = $(sel).first();
if (section.length) {
return section.html() || '';
}
}

return $('body').html() || '';
})();

const facilityHierarchy: string[] = [];
$('.facility-hierarchy li, .breadcrumb li, .employer-hierarchy li').each((_, el) => {
const text = $(el).text().trim();
if (text) facilityHierarchy.push(text);
});

const contactInfo: ContactInfo = {};
if (contactName) contactInfo.name = contactName;
if (contactEmail) contactInfo.email = contactEmail;
if (contactPhone) contactInfo.phone = contactPhone;

const scrapedAt = Date.now();

const record: Partial<JobRecord> = {
jobTitle,
facilityName,
facilityHierarchy: facilityHierarchy.length ? facilityHierarchy : undefined,
profession: profession || undefined,
specialty: specialty || undefined,
location: location || undefined,
recruitmentType: recruitmentType || undefined,
contactInfo: Object.keys(contactInfo).length ? contactInfo : undefined,
descriptionHtml: descriptionHtml || undefined,
jobUrl,
scrapedAt
};

return record;
}