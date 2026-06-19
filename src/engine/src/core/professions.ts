// professions.ts — the sign-up roster: the single source of truth for the fields a
// new owner can pick. ONE place to edit when a field is added or relabelled.
//
// Three things per field, and the distinction matters:
//   key        — the profession_preset stored on the agent. MUST equal the `field`
//                key a Codex is seeded under in domain_handbooks, or Harvey finds no
//                referencer for that owner. (resolveField in handbook.ts maps a few
//                SMM short-forms; every other field resolves to its key as-is.)
//   label      — the human button text shown at sign-up.
//   descriptor — the one line written into agent_owner.owner_descriptor, read into
//                Harvey's "[Your owner — …]" binding block every turn. It must read
//                naturally after the owner's name: "Marcus Bell — a social media manager."
//
// All twenty-five appear and mint a real, working owner. All have a Codex seeded today;
// every field resolves to a seeded Codex.

export interface Profession {
  key: string;
  label: string;
  descriptor: string;
}

export const PROFESSIONS: Profession[] = [
  { key: 'social_media_management', label: 'Social Media Management', descriptor: 'a social media manager' },
  { key: 'influencers',             label: 'Influencer / Creator',     descriptor: 'an influencer and content creator' },
  { key: 'designers',               label: 'Design',                   descriptor: 'a designer' },
  { key: 'architects',              label: 'Architecture',             descriptor: 'an architect' },
  { key: 'lawyers',                 label: 'Law',                      descriptor: 'a lawyer' },
  { key: 'chartered_accountants',   label: 'Chartered Accountancy',    descriptor: 'a chartered accountant' },
  { key: 'auditors',                label: 'Audit',                    descriptor: 'an auditor' },
  { key: 'event_wedding_planners',  label: 'Events & Wedding Planning', descriptor: 'an event and wedding planner' },
  { key: 'makeup_artists',          label: 'Makeup Artistry',          descriptor: 'a makeup artist' },
  { key: 'solopreneurs_smb',        label: 'Startups & Small Business', descriptor: 'a founder running a startup / small business' },
  { key: 'venture_capital',         label: 'Venture Capital',          descriptor: 'a venture capital investor' },
  { key: 'real_estate',             label: 'Real Estate',              descriptor: 'a real estate professional' },
  { key: 'hospitality_fnb',         label: 'Hospitality & F&B',        descriptor: 'a hospitality and F&B operator' },
  { key: 'retail_d2c',              label: 'Retail & D2C',             descriptor: 'a retail and D2C founder' },
  { key: 'media_creator',           label: 'Media & Creator',          descriptor: 'a media and content creator' },
  { key: 'education_coaching',      label: 'Education & Coaching',      descriptor: 'an educator and coach' },
  { key: 'lifestyle_wellness',      label: 'Lifestyle & Wellness',     descriptor: 'a lifestyle and wellness professional' },
  { key: 'marketing',               label: 'Marketing & Growth',        descriptor: 'a marketing and growth professional' },
  { key: 'sales',                   label: 'Sales & Business Development', descriptor: 'a sales and business development professional' },
  { key: 'finance',                 label: 'Finance & Analysis',        descriptor: 'a finance and analysis professional' },
  { key: 'corporate_transactional', label: 'Corporate & Transaction Advisory', descriptor: 'a corporate and transaction advisor' },
  { key: 'personal_finance',        label: 'Wealth & Personal Finance', descriptor: 'a wealth and personal finance advisor' },
  { key: 'people_hiring',           label: 'People & HR',               descriptor: 'a people and HR professional' },
  { key: 'operations',              label: 'Operations & Strategy',     descriptor: 'an operations and strategy professional' },
  { key: 'career',                  label: 'Career & Coaching',         descriptor: 'a career and coaching professional' },
];

const BY_KEY = new Map(PROFESSIONS.map((p) => [p.key, p]));

export function findProfession(key: string | null | undefined): Profession | null {
  if (!key) return null;
  return BY_KEY.get(key.trim()) ?? null;
}
