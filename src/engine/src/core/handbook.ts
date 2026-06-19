// handbook.ts — Harvey's referencer access (table domain_handbooks, migration 0004).
//
// The handbook is per-profession, shared by all agents in a field. Harvey carries
// only the small index in context each turn; he pulls a specific section on demand.
// Sections are sliced from full_md at runtime by their §/Chapter markers — one source
// of truth, no derived copies to drift.
import { supabase } from './db.js';

// Map an agent's free-text profession_preset to a canonical handbook field key.
// Extend this as more handbooks are authored. Unknown/empty → null (no referencer).
const ALIASES: Record<string, string> = {
  smm: 'social_media_management',
  social_media: 'social_media_management',
  'social media': 'social_media_management',
  'social media manager': 'social_media_management',
  'social media management': 'social_media_management',
  social_media_manager: 'social_media_management',
  social_media_management: 'social_media_management',
};

export function resolveField(preset: string | null | undefined): string | null {
  if (!preset) return null;
  const norm = preset.trim().toLowerCase();
  if (ALIASES[norm]) return ALIASES[norm];
  const underscored = norm.replace(/\s+/g, '_');
  if (ALIASES[underscored]) return ALIASES[underscored];
  // Fall back: if a handbook is keyed exactly by the normalized preset, use it.
  return underscored || null;
}

// The index + title for a field, for injection into Harvey's context. null if no
// handbook exists for that field (Harvey then advises without a referencer).
// Consultant Harvey loads the WHOLE Codex as his preparation (no Donna to retrieve
// sections). Sizes are modest (biggest ~24k tokens) so the full_md rides the cached
// static prefix. Returns null if the field has no handbook.
export async function getHandbookFull(
  field: string | null,
): Promise<{ field: string; title: string | null; full_md: string } | null> {
  if (!field) return null;
  const { data } = await supabase
    .from('domain_handbooks')
    .select('field, title, full_md')
    .eq('field', field)
    .maybeSingle();
  if (!data || !data.full_md) return null;
  return { field: data.field, title: data.title, full_md: data.full_md };
}

export async function getHandbookIndex(
  field: string | null,
): Promise<{ field: string; title: string | null; index_md: string } | null> {
  if (!field) return null;
  const { data } = await supabase
    .from('domain_handbooks')
    .select('field, title, index_md')
    .eq('field', field)
    .maybeSingle();
  if (!data || !data.index_md) return null;
  return { field: data.field, title: data.title, index_md: data.index_md };
}

// Slice a section (e.g. "§7.1" / "7.1"), a chapter ("Chapter 7" / "ch7" / "7"),
// or an appendix ("Appendix C" / "C") out of full_md. Returns null if not found.
export async function getSection(field: string | null, ref: string): Promise<string | null> {
  if (!field) return null;
  const { data } = await supabase
    .from('domain_handbooks')
    .select('full_md')
    .eq('field', field)
    .maybeSingle();
  const md = data?.full_md as string | undefined;
  if (!md) return null;
  return sliceSection(md, ref);
}

// Pure slicer — exported for testing. Format-TOLERANT: a section marker §N or §N.M
// may appear as a markdown heading ("## §5", "### §5.3") OR as bolded inline text
// ("**§5.3 — ...**"), depending on how a Codex was authored. We locate the marker
// wherever it is and slice to the next marker of the SAME-OR-HIGHER level, so the
// engine adapts to the Codex rather than demanding one rigid heading style.
export function sliceSection(md: string, refRaw: string): string | null {
  const lines = md.split('\n');
  const ref = refRaw.trim();

  // A line "opens" section §id if it contains §id as a heading or bolded marker,
  // where id is followed by a non-digit (so §5 doesn't match §5.3's line, and
  // §5.3 doesn't match §5.31). Matches: "## §5 —", "### §5.3 —", "**§5.3 —**".
  const markerFor = (id: string) =>
    new RegExp(`(^#{1,4}\\s*§\\s*${escapeRe(id)}(?!\\d)|^\\*\\*\\s*§\\s*${escapeRe(id)}(?!\\d))`);
  // Any section marker at all (to know where the current section ends).
  const ANY_MARKER = /^(#{1,4}\s*§\s*\d|#{1,4}\s+(HALF|Appendix|Chapter)\b|\*\*\s*§\s*\d)/;

  // §-section, e.g. "§7.1", "7.1", "§5", "5"
  const secMatch = ref.match(/^§?\s*(\d+(?:\.\d+)?)/);
  if (secMatch) {
    const id = secMatch[1];
    const open = markerFor(id);
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
      if (open.test(lines[i])) { start = i; break; }
    }
    if (start < 0) {
      // Fallbacks for the older SMM heading style ("### §id", "## Chapter n").
      const legacy = grab(lines, new RegExp(`^#{2,3} §${escapeRe(id)}(\\D|$)`), ['#### ', '### ', '## ', '# ']);
      return legacy;
    }
    // Slice to the next marker of same-or-higher level. For a subsection (§N.M) the
    // next §marker (any level) stops it; for a top-level §N, the next §K heading or
    // a HALF/Chapter/Appendix break stops it.
    const isSub = id.includes('.');
    const result: string[] = [lines[start]];
    for (let i = start + 1; i < lines.length; i++) {
      const ln = lines[i];
      if (isSub) {
        if (ANY_MARKER.test(ln)) break;
      } else {
        if (/^#{1,4}\s*§\s*\d/.test(ln)) break;
        if (/^#{1,2}\s+(HALF|Appendix|Chapter)\b/.test(ln)) break;
      }
      result.push(ln);
    }
    const text = result.join('\n').trim();
    return text || null;
  }

  // Chapter, e.g. "Chapter 7", "ch 7", "ch7"
  const chMatch = ref.match(/^(?:chapter|ch)\.?\s*(\d+)$/i) || ref.match(/^(\d+)$/);
  if (chMatch) {
    const n = chMatch[1];
    return grab(lines, new RegExp(`^## Chapter ${escapeRe(n)}(\\D|$)`), ['## ', '# ']);
  }

  // Appendix, e.g. "Appendix C" or "C"
  const apMatch = ref.match(/^(?:appendix\s*)?([A-I])$/i);
  if (apMatch) {
    const letter = apMatch[1].toUpperCase();
    return grab(lines, new RegExp(`^### (?:Appendix )?${escapeRe(letter)}[\\.\\s]`), ['### ', '## ', '# ']);
  }

  return null;
}

function grab(lines: string[], header: RegExp, stops: string[]): string | null {
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (header.test(lines[i])) { start = i; break; }
  }
  if (start < 0) return null;
  const out = [lines[start]];
  for (let i = start + 1; i < lines.length; i++) {
    if (stops.some((s) => lines[i].startsWith(s))) break;
    out.push(lines[i]);
  }
  return out.join('\n').trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
