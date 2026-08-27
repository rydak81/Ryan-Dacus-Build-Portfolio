/**
 * Realistic seed data covering the core demo scenarios:
 *   1. strong active job (very high confidence)
 *   2. questionable job (uncertain)
 *   3. likely ghost job (very low confidence)
 *   4. repeatedly reposted job (low confidence)
 *   5. high candidate match / low job confidence
 *   6. low candidate match / high job confidence
 *
 * Scores are NOT hardcoded here — the demo store runs the real scoring
 * engine over these facts so every number on screen is explainable.
 */

import type {
  Company,
  Contact,
  Job,
  JobEvent,
  JobVerification,
  UserProfile,
} from '@/lib/types';
import { hashText, normalizeTitle } from '@/lib/utils';

const NOW = Date.now();
const daysAgoIso = (d: number) => new Date(NOW - d * 86_400_000).toISOString();
const hoursAgoIso = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

export const DEMO_USER_ID = 'demo-user-0000-0000-000000000001';

export const demoProfile: UserProfile = {
  user_id: DEMO_USER_ID,
  current_title: 'Director of Partnerships',
  desired_titles: ['Director of Partnerships', 'VP Partnerships', 'Director of Business Development', 'Head of Channel'],
  seniority: 'director',
  preferred_locations: ['Remote', 'Atlanta', 'Charlotte', 'Greenville'],
  remote_preference: 'remote',
  salary_min: 150000,
  industries: ['SaaS', 'E-commerce', 'Retail Technology'],
  skills: [
    'partnerships', 'business development', 'SaaS', 'e-commerce', 'marketplace',
    'enterprise', 'go-to-market', 'channel', 'negotiation', 'account management',
  ],
  years_experience: 15,
  resume_text: null,
  linkedin_url: null,
  portfolio_url: null,
};

function mkCompany(c: Omit<Company, 'created_at'>): Company {
  return { ...c, created_at: daysAgoIso(200) };
}

export const seedCompanies: Company[] = [
  mkCompany({
    id: 'co-northwind', name: 'Northwind Commerce',
    website: 'https://northwindcommerce.example.com',
    careers_url: 'https://northwindcommerce.example.com/careers',
    industry: 'E-commerce SaaS', employee_count: 850, headquarters: 'Atlanta, GA',
    linkedin_company_url: null, ats_provider: 'greenhouse', ats_token: 'northwindcommerce',
    hiring_freeze: false, last_verified_at: hoursAgoIso(2),
  }),
  mkCompany({
    id: 'co-apex', name: 'Apex Data Systems',
    website: 'https://apexdata.example.com',
    careers_url: 'https://apexdata.example.com/careers',
    industry: 'Data Infrastructure', employee_count: 2400, headquarters: 'Austin, TX',
    linkedin_company_url: null, ats_provider: 'lever', ats_token: 'apexdata',
    hiring_freeze: false, last_verified_at: hoursAgoIso(6),
  }),
  mkCompany({
    id: 'co-harborview', name: 'Harborview Software',
    website: 'https://harborview.example.com',
    careers_url: 'https://harborview.example.com/careers',
    industry: 'Logistics SaaS', employee_count: 320, headquarters: 'Charlotte, NC',
    linkedin_company_url: null, ats_provider: 'greenhouse', ats_token: 'harborview',
    hiring_freeze: false, last_verified_at: daysAgoIso(4),
  }),
  mkCompany({
    id: 'co-cobalt', name: 'Cobalt Security',
    website: 'https://cobaltsec.example.com',
    careers_url: 'https://cobaltsec.example.com/careers',
    industry: 'Cybersecurity', employee_count: 1200, headquarters: 'Boston, MA',
    linkedin_company_url: null, ats_provider: 'lever', ats_token: 'cobaltsec',
    hiring_freeze: true, last_verified_at: hoursAgoIso(20),
  }),
  mkCompany({
    id: 'co-meridian', name: 'Meridian Retail Group',
    website: 'https://meridianretail.example.com',
    careers_url: 'https://meridianretail.example.com/careers',
    industry: 'Retail Technology', employee_count: 5600, headquarters: 'Chicago, IL',
    linkedin_company_url: null, ats_provider: 'greenhouse', ats_token: 'meridianretail',
    hiring_freeze: false, last_verified_at: daysAgoIso(1),
  }),
];

interface SeedJobInput {
  id: string;
  company_id: string;
  external_job_id: string;
  title: string;
  description: string;
  location: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  source: Job['source'];
  first_seen_days: number;
  original_posted_days?: number;
  latest_repost_days?: number;
  repost_count?: number;
  last_verified_hours?: number;
  status: Job['status'];
}

function mkJob(s: SeedJobInput): Job {
  return {
    id: s.id,
    company_id: s.company_id,
    external_job_id: s.external_job_id,
    title: s.title,
    normalized_title: normalizeTitle(s.title),
    description: s.description,
    location: s.location,
    employment_type: s.employment_type ?? 'Full-time',
    salary_min: s.salary_min ?? null,
    salary_max: s.salary_max ?? null,
    source: s.source,
    source_url: `https://jobs.example.com/${s.id}`,
    application_url: `https://jobs.example.com/${s.id}/apply`,
    careers_page_url: null,
    first_seen_at: daysAgoIso(s.first_seen_days),
    last_seen_at: hoursAgoIso(s.last_verified_hours ?? 24),
    original_posted_at: daysAgoIso(s.original_posted_days ?? s.first_seen_days),
    latest_repost_at: s.latest_repost_days !== undefined ? daysAgoIso(s.latest_repost_days) : null,
    repost_count: s.repost_count ?? 0,
    last_verified_at: s.last_verified_hours !== undefined ? hoursAgoIso(s.last_verified_hours) : null,
    status: s.status,
    raw_data: null,
    description_hash: hashText(s.description),
  };
}

const DESC_PARTNERSHIPS = `Northwind Commerce is looking for a Director of Strategic Partnerships to lead our partner ecosystem. You will own partnerships strategy across SaaS integrations, marketplace channels, and enterprise business development. The role works closely with product and sales leadership to build a partner-sourced revenue engine. We're looking for 10+ years in partnerships or business development, deep e-commerce or marketplace experience, enterprise negotiation skills, and a track record of building channel programs from scratch. Remote within the United States.`;

const DESC_GHOST = `Apex Data Systems seeks a VP Business Development to drive growth. We are always looking for talented leaders to join our talent pipeline. Responsibilities include developing strategic relationships and identifying new market opportunities across our data platform portfolio. Ideal candidates have extensive enterprise sales and business development experience.`;

const DESC_QUESTIONABLE = `Harborview Software is hiring a Senior Partnerships Manager to grow our logistics integration network. You will manage relationships with carrier partners, 3PL providers, and channel resellers, negotiate commercial agreements, and collaborate with product on integration roadmaps. Requires 7+ years in partnerships, SaaS experience, and familiarity with supply chain workflows.`;

const DESC_REPOSTED = `Meridian Retail Group is seeking a Business Development Manager to expand our retail technology footprint. You will identify prospects, develop go-to-market plans with channel partners, and manage the sales pipeline for our in-store analytics suite. 5+ years of business development experience in retail or e-commerce technology required.`;

const DESC_COBALT_PARTNER = `Cobalt Security is hiring a Director of Channel Partnerships to build our partner ecosystem. You will recruit and enable resellers, MSSPs, and technology alliance partners, own partner-sourced pipeline, and define the channel go-to-market strategy. We want 8+ years in channel or partnerships leadership, SaaS or marketplace background, and strong enterprise negotiation experience.`;

const DESC_COBALT_AE = `Cobalt Security is hiring an Enterprise Account Executive to sell our cybersecurity platform to Fortune 1000 security teams. You will manage full-cycle enterprise sales, work security operations stakeholders, and maintain rigorous Salesforce hygiene. Requires 5+ years selling cybersecurity or adjacent infrastructure software, experience with the Salesforce ecosystem, and comfort with technical security concepts like SIEM, SOC workflows, and threat detection.`;

const DESC_NW_2 = `Northwind Commerce is hiring a Senior Partner Marketing Manager to amplify our partner ecosystem through co-marketing programs, joint campaigns, and partner enablement content.`;
const DESC_NW_3 = `Northwind Commerce seeks a Business Development Representative to source new marketplace seller relationships and qualify inbound partnership inquiries.`;
const DESC_NW_4 = `Northwind Commerce is hiring a VP of Sales to lead our enterprise go-to-market organization across new business and expansion revenue.`;

export const seedJobs: Job[] = [
  // 1. Strong active — verified everywhere, fresh, company hiring heavily.
  mkJob({
    id: 'job-nw-partnerships', company_id: 'co-northwind', external_job_id: 'gh-70012',
    title: 'Director of Strategic Partnerships', description: DESC_PARTNERSHIPS,
    location: 'Remote — United States', salary_min: 150000, salary_max: 190000,
    source: 'greenhouse', first_seen_days: 4, last_verified_hours: 2, status: 'active',
  }),
  mkJob({
    id: 'job-nw-pmm', company_id: 'co-northwind', external_job_id: 'gh-70044',
    title: 'Senior Partner Marketing Manager', description: DESC_NW_2,
    location: 'Atlanta, GA (Hybrid)', salary_min: 120000, salary_max: 145000,
    source: 'greenhouse', first_seen_days: 9, last_verified_hours: 26, status: 'active',
  }),
  mkJob({
    id: 'job-nw-bdr', company_id: 'co-northwind', external_job_id: 'gh-70051',
    title: 'Business Development Representative', description: DESC_NW_3,
    location: 'Atlanta, GA', salary_min: 55000, salary_max: 70000,
    source: 'greenhouse', first_seen_days: 12, last_verified_hours: 30, status: 'active',
  }),
  mkJob({
    id: 'job-nw-vpsales', company_id: 'co-northwind', external_job_id: 'gh-70020',
    title: 'VP of Sales', description: DESC_NW_4,
    location: 'Remote — United States', salary_min: 200000, salary_max: 250000,
    source: 'greenhouse', first_seen_days: 16, last_verified_hours: 28, status: 'active',
  }),

  // 3. Likely ghost — 147 days old, repeatedly reposted, evergreen language,
  //    gone from the employer careers page.
  mkJob({
    id: 'job-apex-vpbd', company_id: 'co-apex', external_job_id: 'lv-a19f',
    title: 'VP Business Development', description: DESC_GHOST,
    location: 'Austin, TX (Hybrid)', salary_min: 190000, salary_max: 240000,
    source: 'lever', first_seen_days: 147, original_posted_days: 3,
    latest_repost_days: 3, repost_count: 4, last_verified_hours: 6, status: 'ghost_suspect',
  }),

  // 2. Questionable — plausible but unverified against the employer site,
  //    with one date-bump on record.
  mkJob({
    id: 'job-hv-partnerships', company_id: 'co-harborview', external_job_id: 'gh-3301',
    title: 'Senior Partnerships Manager', description: DESC_QUESTIONABLE,
    location: 'Charlotte, NC (Hybrid)', salary_min: 130000, salary_max: 155000,
    source: 'greenhouse', first_seen_days: 41, original_posted_days: 12,
    repost_count: 1, latest_repost_days: 12, last_verified_hours: 96, status: 'active',
  }),

  // 4. Reposted — three removal/repost cycles with identical content.
  mkJob({
    id: 'job-mr-bdm', company_id: 'co-meridian', external_job_id: 'gh-8814',
    title: 'Business Development Manager', description: DESC_REPOSTED,
    location: 'Chicago, IL', salary_min: 95000, salary_max: 120000,
    source: 'greenhouse', first_seen_days: 96, original_posted_days: 5,
    latest_repost_days: 5, repost_count: 3, last_verified_hours: 30, status: 'ghost_suspect',
  }),

  // 5. High match / low confidence — excellent fit, questionable job.
  mkJob({
    id: 'job-cb-channel', company_id: 'co-cobalt', external_job_id: 'lv-c771',
    title: 'Director of Channel Partnerships', description: DESC_COBALT_PARTNER,
    location: 'Remote — United States', salary_min: 160000, salary_max: 195000,
    source: 'lever', first_seen_days: 63, last_verified_hours: 20, status: 'stale',
  }),

  // 6. Low match / high confidence — very real job, weaker fit.
  mkJob({
    id: 'job-cb-ae', company_id: 'co-cobalt', external_job_id: 'lv-c802',
    title: 'Enterprise Account Executive, Cybersecurity', description: DESC_COBALT_AE,
    location: 'Boston, MA (Hybrid)', salary_min: 120000, salary_max: 150000,
    source: 'lever', first_seen_days: 5, last_verified_hours: 3, status: 'active',
  }),
];

function mkVerification(
  v: Partial<JobVerification> & Pick<JobVerification, 'job_id'> & { hours_ago: number },
): JobVerification {
  const { hours_ago, ...rest } = v;
  return {
    id: `ver-${v.job_id}-${hours_ago}`,
    checked_at: hoursAgoIso(hours_ago),
    source_checked: 'ats',
    status_code: 200,
    still_exists: true,
    application_link_valid: true,
    found_on_company_site: true,
    found_on_ats: true,
    detected_repost: false,
    description_changed: false,
    hiring_signal_score: null,
    notes: null,
    ...rest,
  };
}

export const seedVerifications: JobVerification[] = [
  // Strong active: repeated clean verifications.
  mkVerification({ job_id: 'job-nw-partnerships', hours_ago: 2, notes: 'Requisition present in greenhouse feed (14 open roles)' }),
  mkVerification({ job_id: 'job-nw-partnerships', hours_ago: 26 }),
  mkVerification({ job_id: 'job-nw-partnerships', hours_ago: 50, description_changed: true, notes: 'Description updated (compensation band added)' }),
  mkVerification({ job_id: 'job-nw-partnerships', hours_ago: 74 }),
  mkVerification({ job_id: 'job-nw-pmm', hours_ago: 26, application_link_valid: null }),
  mkVerification({ job_id: 'job-nw-bdr', hours_ago: 30, application_link_valid: null }),
  mkVerification({ job_id: 'job-nw-vpsales', hours_ago: 28, application_link_valid: null }),

  // Ghost: absent from ATS and career site, repost detected.
  mkVerification({
    job_id: 'job-apex-vpbd', hours_ago: 6, still_exists: false,
    application_link_valid: null, found_on_company_site: false, found_on_ats: false,
    detected_repost: true, notes: 'Requisition absent from lever feed; still visible on two aggregators',
  }),
  mkVerification({
    job_id: 'job-apex-vpbd', hours_ago: 96, still_exists: false,
    application_link_valid: null, found_on_company_site: false, found_on_ats: false,
    detected_repost: true, notes: 'Posting date moved forward with identical description',
  }),

  // Questionable: only an HTTP check, several days old, one date bump.
  mkVerification({
    job_id: 'job-hv-partnerships', hours_ago: 96, source_checked: 'http',
    found_on_company_site: null, found_on_ats: null,
    detected_repost: true, notes: 'Application URL responds; employer site not yet crawled; source date moved forward once',
  }),

  // Reposted: link works but repost cycle is on record.
  mkVerification({
    job_id: 'job-mr-bdm', hours_ago: 30, source_checked: 'http',
    found_on_company_site: null, found_on_ats: null,
    detected_repost: true, notes: 'Third reappearance with identical description hash',
  }),

  // High match / low confidence: application link dead, hiring freeze on record.
  mkVerification({
    job_id: 'job-cb-channel', hours_ago: 20, still_exists: false, status_code: 404,
    source_checked: 'http', application_link_valid: false,
    found_on_company_site: null, found_on_ats: null,
    notes: 'Application URL returns 404; employer site crawl pending',
  }),
  mkVerification({ job_id: 'job-cb-channel', hours_ago: 200 }),

  // Low match / high confidence: everything checks out.
  mkVerification({ job_id: 'job-cb-ae', hours_ago: 3, notes: 'Requisition present in lever feed (22 open roles)' }),
  mkVerification({ job_id: 'job-cb-ae', hours_ago: 27 }),
];

function mkEvent(job_id: string, days_ago: number, kind: JobEvent['kind'], detail: string): JobEvent {
  return { id: `ev-${job_id}-${days_ago}-${kind}`, job_id, occurred_at: daysAgoIso(days_ago), kind, detail };
}

export const seedEvents: JobEvent[] = [
  mkEvent('job-nw-partnerships', 4, 'first_seen', 'Ingested from greenhouse'),
  mkEvent('job-nw-partnerships', 3, 'verified', 'Confirmed on employer careers page and ATS'),
  mkEvent('job-nw-partnerships', 2, 'description_changed', 'Compensation band added to description'),
  mkEvent('job-nw-partnerships', 1, 'verified', 'Application endpoint verified'),

  mkEvent('job-apex-vpbd', 147, 'first_seen', 'Ingested from lever'),
  mkEvent('job-apex-vpbd', 123, 'removed', 'No longer present in source feed'),
  mkEvent('job-apex-vpbd', 118, 'reappeared', 'Listing reappeared with identical content'),
  mkEvent('job-apex-vpbd', 85, 'removed', 'No longer present in source feed'),
  mkEvent('job-apex-vpbd', 80, 'reappeared', 'Listing reappeared with identical content'),
  mkEvent('job-apex-vpbd', 44, 'removed', 'No longer present in source feed'),
  mkEvent('job-apex-vpbd', 38, 'reappeared', 'Listing reappeared with identical content'),
  mkEvent('job-apex-vpbd', 3, 'reposted', 'Source posting date moved forward while description stayed identical'),

  mkEvent('job-hv-partnerships', 41, 'first_seen', 'Ingested from greenhouse'),
  mkEvent('job-hv-partnerships', 12, 'reposted', 'Source posting date moved forward while description stayed identical'),

  mkEvent('job-mr-bdm', 96, 'first_seen', 'Ingested from greenhouse'),
  mkEvent('job-mr-bdm', 71, 'removed', 'No longer present in source feed'),
  mkEvent('job-mr-bdm', 64, 'reappeared', 'Listing reappeared with identical content'),
  mkEvent('job-mr-bdm', 33, 'removed', 'No longer present in source feed'),
  mkEvent('job-mr-bdm', 26, 'reappeared', 'Listing reappeared with identical content'),
  mkEvent('job-mr-bdm', 5, 'reposted', 'Source posting date moved forward while description stayed identical'),

  mkEvent('job-cb-channel', 63, 'first_seen', 'Ingested from lever'),
  mkEvent('job-cb-channel', 9, 'removed', 'Application URL began returning 404'),

  mkEvent('job-cb-ae', 5, 'first_seen', 'Ingested from lever'),
  mkEvent('job-cb-ae', 1, 'verified', 'Confirmed on employer careers page and ATS'),
];

export const seedContacts: Contact[] = [
  {
    id: 'ct-nw-1', company_id: 'co-northwind', name: 'Sarah Collins', title: 'VP, Partnerships',
    public_profile_url: null, public_contact_data: null, relationship_type: 'department_head',
    source: 'company leadership page', reason: 'Leads the department associated with this position.',
  },
  {
    id: 'ct-nw-2', company_id: 'co-northwind', name: 'Marcus Webb', title: 'Senior Talent Acquisition Partner',
    public_profile_url: null, public_contact_data: null, relationship_type: 'talent_acquisition',
    source: 'careers page', reason: 'Listed recruiter for go-to-market roles.',
  },
  {
    id: 'ct-cb-1', company_id: 'co-cobalt', name: 'Priya Raman', title: 'Chief Revenue Officer',
    public_profile_url: null, public_contact_data: null, relationship_type: 'executive',
    source: 'company leadership page', reason: 'Channel and sales organizations report into this office.',
  },
  {
    id: 'ct-hv-1', company_id: 'co-harborview', name: 'Dan Okafor', title: 'Head of Business Development',
    public_profile_url: null, public_contact_data: null, relationship_type: 'hiring_manager',
    source: 'company leadership page', reason: 'Likely hiring manager for partnerships roles.',
  },
];
