// src/lib/site/styles.js · TDW · CE-46 · WEB-4 cut 2 · THE ONE HOME OF THE SIX STYLES, THEIR PALETTES, THE FONT PAIRS AND THE TRADE WORDS.
//
// The chair's Q8 ruling (30 September 2026): the server is the one home of the registry, and colours travel to the
// renderer already resolved, so the pwa keeps no second copy. R-42.6: every colour here names its provenance: WEB-3's
// handoff ZIP (sha256 6d444afa3ee321d582aaf56b3b938976fa51c0a4d3a1e4ab204d9b7b63dc3347), the prototype source file and the
// line of the palette's block (and of the style's :root block where a role is inherited from it). The values are copied
// byte for byte. r3: WEB-3 fixed the seven failing palettes AT SOURCE in that handoff (muted inks darkened; two roles
// added, `atx` the accent as text on the paper and `atd` the accent as text on the deep band), so these values replace the
// live artifacts'. r4: the chair's packet of 30 September (TDW_OPEN_WEB4) carries the same kit, byte for byte.
//
// THE STYLE-TO-PAIR MAP is WEB-3's (Q7), read from each prototype's own font list in the handoff; the first is the default.
//
// WHICH PAIRS THE GATE HOLDS depends on how each style draws its roles (WEB-3's rendered-text bench, benches/contrast.cjs,
// measures every text on its real ground). Each style declares its own below as `gate`: [text role, the role it sits on,
// target, which one moves]. The base pairs apply to every style; a pair naming a role the palette lacks is skipped.
'use strict';

const STYLE_IDS = Object.freeze(['couture', 'noir', 'heritage', 'aurora', 'gallery', 'riviera']);

// The eight approved pairings (design system Day 1 §3, approved by the chair on the founder's delegation, 30 Sept).
const FONT_PAIRS = Object.freeze({
  bodoni_inter_tight:     { display: 'Bodoni Moda', text: 'Inter Tight' },
  cormorant_manrope:      { display: 'Cormorant Garamond', text: 'Manrope' },
  italiana_jost:          { display: 'Italiana', text: 'Jost' },
  marcellus_mulish:       { display: 'Marcellus', text: 'Mulish' },
  fraunces_jakarta:       { display: 'Fraunces', text: 'Plus Jakarta Sans' },
  instrument_serif_sans:  { display: 'Instrument Serif', text: 'Instrument Sans' },
  gilda_figtree:          { display: 'Gilda Display', text: 'Figtree' },
  cormorant_figtree:      { display: 'Cormorant Garamond', text: 'Figtree' },
});

// The pairs every style is held to, then each style's own (from where its prototype actually puts text and labels).
// ink/ground is the page's text AND the heart-count badge (the ground colour on an ink disc, 9px, every style: engine.css
// .n; the chair's word of 30 September); the ratio is the same pair either way round.
const BASE_GATE = Object.freeze([
  ['ink', 'ground', 4.5, 'text'], ['muted', 'ground', 4.5, 'text'], ['ink', 'soft', 4.5, 'text'],
  ['on_deep', 'deep', 4.5, 'fill'], ['tick_ink', 'tick_bg', 4.5, 'fill'],
]);
// Each style: its decorative band, the layer she can switch off (design §2 "Decoration is a section"), the pairs it
// offers (WEB-3's map, the eight's numbers in design §3 order: couture 1 2 6, noir 3 1 2, heritage 4 2 8, aurora 5 6,
// gallery 6 1 3, riviera 7 8 2), and its own gate pairs with the prototype rule each stands for.
const STYLES = Object.freeze({
  couture:  { label: 'Couture',  band: 'rolling_words', layer: 'rolling_words',
    pairs: ['bodoni_inter_tight', 'cormorant_manrope', 'instrument_serif_sans'],
    gate: [['on_accent', 'accent', 4.5, 'fill']] },                                  // .btn-w:hover
  noir:     { label: 'Noir',     band: 'spotlight',     layer: 'film_grain',
    pairs: ['italiana_jost', 'bodoni_inter_tight', 'cormorant_manrope'],
    gate: [['accent', 'ground', 4.5, 'text'], ['on_accent', 'accent', 4.5, 'fill']] }, // accent as small text; .chip.on
  heritage: { label: 'Heritage', band: 'craft',         layer: 'paper_texture',
    pairs: ['marcellus_mulish', 'cormorant_manrope', 'cormorant_figtree'],
    // atx: the accent as small text on the paper (.caps, .crumb); atd: the accent as small text on the deep band
    // (#reviews .caps, footer .caps, .q .by); the label on vermilion (.btn-main); the footer name on the band (.fname, 56px)
    gate: [['atx', 'ground', 4.5, 'text'], ['atd', 'deep', 4.5, 'text'], ['on_accent', 'verm', 4.5, 'fill'], ['accent', 'deep', 3, 'text']] },
  aurora:   { label: 'Aurora',   band: 'pinned_story',  layer: null,
    pairs: ['fraunces_jakarta', 'instrument_serif_sans'],
    gate: [['accent', 'ground', 3, 'text']] },                                        // .emono
  gallery:  { label: 'Gallery',  band: 'walk_up',       layer: null,
    pairs: ['instrument_serif_sans', 'bodoni_inter_tight', 'italiana_jost'],
    gate: [] },
  riviera:  { label: 'Riviera',  band: 'drone_drift',   layer: 'moving_sunlight',
    pairs: ['gilda_figtree', 'cormorant_figtree', 'cormorant_manrope'],
    gate: [['atx', 'ground', 4.5, 'text'], ['on_accent', 'atx', 4.5, 'fill']] },   // .btn-main, .chip.on
});
const gatePairsFor = (style) => [...BASE_GATE, ...((STYLES[style] || { gate: [] }).gate)];

// The 18 curated palettes, three per style, the first of each style its default. Roles as design §2 names them:
// ground, ink, muted ink, line, soft ground, accent, text-on-accent; the style's own extras (deep band, metal gradient,
// washes) beside them.
const PALETTES = Object.freeze([
  { id: 'couture.ink', style: 'couture', label: 'Ivory and ink',
    roles: { ground: '#ffffff', ink: '#0b0b0b', muted: '#6b6b6b', line: 'rgba(11,11,11,.12)', soft: '#f4f2ef', accent: '#0b0b0b', on_accent: '#ffffff' },
    extras: { tick_bg: '#efedea', tick_ink: '#0b0b0b' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/couture.html:11' },
  { id: 'couture.emerald', style: 'couture', label: 'Emerald',
    roles: { ground: '#f7f5f0', ink: '#10231c', muted: '#5a6b63', line: 'rgba(16,35,28,.14)', soft: '#ecebe3', accent: '#1f4d3a', on_accent: '#f7f5f0' },
    extras: { tick_bg: '#1f4d3a', tick_ink: '#f7f5f0' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/couture.html:19 over :root at :11' },
  { id: 'couture.rose', style: 'couture', label: 'Rosewood',
    roles: { ground: '#fbf6f4', ink: '#2a1618', muted: '#7d6164', line: 'rgba(42,22,24,.13)', soft: '#f3e7e3', accent: '#7e2f3b', on_accent: '#fbf6f4' },
    extras: { tick_bg: '#f1e1dc', tick_ink: '#2a1618' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/couture.html:20 over :root at :11' },
  { id: 'noir.gold', style: 'noir', label: 'Black and gold',
    roles: { ground: '#0a0908', ink: '#efe6d6', muted: '#9b9183', line: 'rgba(212,178,110,.22)', soft: '#16130f', accent: '#d4b26e', on_accent: '#0a0908' },
    extras: { g1: '#977432', g2: '#e9cf8f', g3: '#b8924a' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/noir.html:10' },
  { id: 'noir.wine', style: 'noir', label: 'Wine and rose gold',
    roles: { ground: '#12070a', ink: '#f2e4e1', muted: '#a58d8e', line: 'rgba(226,160,150,.22)', soft: '#1d0d11', accent: '#e3a597', on_accent: '#0a0908' },
    extras: { g1: '#b6625c', g2: '#f3c3b3', g3: '#c07a6c' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/noir.html:13 over :root at :10' },
  { id: 'noir.midnight', style: 'noir', label: 'Midnight and champagne',
    roles: { ground: '#060a12', ink: '#e6e9ef', muted: '#8d94a3', line: 'rgba(200,205,220,.2)', soft: '#0e1320', accent: '#d9d2c0', on_accent: '#0a0908' },
    extras: { g1: '#757a89', g2: '#f1ead7', g3: '#aeb2bd' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/noir.html:14 over :root at :10' },
  { id: 'heritage.marigold', style: 'heritage', label: 'Marigold and vermilion',
    roles: { ground: '#f6efe3', ink: '#3b0f0f', muted: '#7a5a4f', line: 'rgba(59,15,15,.16)', soft: '#eee3d2', accent: '#d98b12', on_accent: '#fff8ec' },
    extras: { verm: '#b8321f', deep: '#3b0f0f', on_deep: '#f6e6c8', atx: '#955f0c', atd: '#d98b12' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/heritage.html:10' },
  { id: 'heritage.peacock', style: 'heritage', label: 'Peacock and old gold',
    roles: { ground: '#f1efe6', ink: '#0f3b3a', muted: '#4f6a66', line: 'rgba(15,59,58,.16)', soft: '#e5e3d6', accent: '#b88a2e', on_accent: '#fff8ec' },
    extras: { verm: '#0f5c57', deep: '#0c3432', on_deep: '#ecdcb4', atx: '#876522', atd: '#be8f30' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/heritage.html:12 over :root at :10' },
  { id: 'heritage.rani', style: 'heritage', label: 'Rani pink and saffron',
    roles: { ground: '#fbf1ee', ink: '#4a0d2b', muted: '#855a68', line: 'rgba(74,13,43,.15)', soft: '#f3e3de', accent: '#e08a1e', on_accent: '#fff8ec' },
    extras: { verm: '#b0205e', deep: '#4a0d2b', on_deep: '#f8dcc0', atx: '#9a5f15', atd: '#e08a1e' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/heritage.html:13 over :root at :10' },
  { id: 'aurora.blush', style: 'aurora', label: 'Blush and peach',
    roles: { ground: '#fbf3f1', ink: '#2b1f2e', muted: '#7c6a78', line: 'rgba(43,31,46,.12)', soft: 'rgba(255,255,255,.5)', accent: '#c2527a', on_accent: '#fff' },
    extras: { b1: '#f7b8c9', b2: '#ffd2b0', b3: '#d6c4f7', b4: '#bfe3f2', glass: 'rgba(255,255,255,.38)', gline: 'rgba(255,255,255,.7)', grad: 'linear-gradient(110deg,#c2527a,#d86c44 35%,#8f6ad6 70%,#c2527a)' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/aurora.html:9' },
  { id: 'aurora.lagoon', style: 'aurora', label: 'Mint and lilac',
    roles: { ground: '#f0f7f5', ink: '#15302d', muted: '#5b736f', line: 'rgba(43,31,46,.12)', soft: 'rgba(255,255,255,.5)', accent: '#2e8f86', on_accent: '#fff' },
    extras: { b1: '#a8e6d2', b2: '#c3d6ff', b3: '#e3cbf7', b4: '#fff0b8', glass: 'rgba(255,255,255,.38)', gline: 'rgba(255,255,255,.7)', grad: 'linear-gradient(110deg,#2e8f86,#5b7fd6 40%,#a36ad0 75%,#2e8f86)' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/aurora.html:12 over :root at :9' },
  { id: 'aurora.dusk', style: 'aurora', label: 'Dusk (dark)',
    roles: { ground: '#16121f', ink: '#f3ecf6', muted: '#b0a2bb', line: 'rgba(255,255,255,.14)', soft: 'rgba(255,255,255,.08)', accent: '#f0a07c', on_accent: '#1a1422' },
    extras: { b1: '#6d3f86', b2: '#c9665a', b3: '#34479a', b4: '#b0467e', glass: 'rgba(40,28,54,.42)', gline: 'rgba(255,255,255,.16)', grad: 'linear-gradient(110deg,#f0a07c,#f3c3e0 40%,#a9a6ff 75%,#f0a07c)' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/aurora.html:13 over :root at :9' },
  { id: 'gallery.white', style: 'gallery', label: 'White wall',
    roles: { ground: '#fbfbf9', ink: '#141414', muted: '#6e6e6a', line: 'rgba(20,20,20,.14)', soft: '#efefeb', accent: '#141414', on_accent: '#fbfbf9' },
    extras: { mat: '#ffffff', frame: '#1b1b1b' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/gallery.html:9' },
  { id: 'gallery.grey', style: 'gallery', label: 'Gallery grey',
    roles: { ground: '#e6e5e0', ink: '#141414', muted: '#5f5e59', line: 'rgba(20,20,20,.14)', soft: '#dcdbd5', accent: '#141414', on_accent: '#fbfbf9' },
    extras: { mat: '#ffffff', frame: '#1b1b1b' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/gallery.html:11 over :root at :9' },
  { id: 'gallery.night', style: 'gallery', label: 'Night gallery (dark)',
    roles: { ground: '#1b1b1a', ink: '#ecebe6', muted: '#9a9994', line: 'rgba(236,235,230,.14)', soft: '#252524', accent: '#ecebe6', on_accent: '#1b1b1a' },
    extras: { mat: '#f4f2ec', frame: '#0c0c0c' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/gallery.html:12 over :root at :9' },
  { id: 'riviera.amalfi', style: 'riviera', label: 'Sand and sea',
    roles: { ground: '#f4ede3', ink: '#22343c', muted: '#616d6e', line: 'rgba(34,52,60,.15)', soft: '#ebe2d4', accent: '#4f8697', on_accent: '#fdfaf4' },
    extras: { sun: '#f0c978', terra: '#c8745a', card: '#fffdf8', deep: '#2f5f6e', on_deep: '#f4ede3', atx: '#437180' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/riviera.html:9' },
  { id: 'riviera.goa', style: 'riviera', label: 'Coral and palm',
    roles: { ground: '#f7eee4', ink: '#2c3a2e', muted: '#646e61', line: 'rgba(34,52,60,.15)', soft: '#eee2d2', accent: '#d56f55', on_accent: '#fdfaf4' },
    extras: { sun: '#f3b562', terra: '#4f7a5a', card: '#fffdf8', deep: '#3f6b52', on_deep: '#f7eee4', atx: '#b4482c' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/riviera.html:11 over :root at :9' },
  { id: 'riviera.santorini', style: 'riviera', label: 'White and cobalt',
    roles: { ground: '#f6f6f2', ink: '#14305a', muted: '#5f6d85', line: 'rgba(34,52,60,.15)', soft: '#e9eaea', accent: '#2451a3', on_accent: '#fdfaf4' },
    extras: { sun: '#f2d27a', terra: '#2451a3', card: '#fffdf8', deep: '#1d3f82', on_deep: '#f6f6f2', atx: '#2451a3' },
    source: 'WEB-3 handoff 6d444afa3ee3 prototypes/riviera.html:12 over :root at :9' },
]);
const PALETTE_BY_ID = Object.freeze(Object.fromEntries(PALETTES.map((p) => [p.id, p])));
const palettesOf = (style) => PALETTES.filter((p) => p.style === style);

// The trade words (design §4). The style is hers; the words follow her trade across the whole site.
const TRADE_WORDS = Object.freeze({
  looks:  { items: 'Looks',  item: 'look',  request: 'Request this look' },
  work:   { items: 'Work',   item: 'story', request: 'Ask about a similar shoot' },
  acts:   { items: 'Acts',   item: 'act',   request: 'Request this act' },
  events: { items: 'Events', item: 'event', request: 'Plan an event like this' },
});
// The estate's trade keys (siteModel TRADE_LOOK's set) to the row that names them. `other` reads as looks.
const TRADE_ROW = Object.freeze({
  makeup: 'looks', hairstylist: 'looks', designer: 'looks', jewellery: 'looks',
  photography: 'work',
  performer: 'acts', content_creator: 'acts',
  planning: 'events', decor: 'events', venue_catering: 'events',
  other: 'looks',
});
const tradeRowFor = (category) => TRADE_ROW[category] || 'looks';

module.exports = { STYLE_IDS, STYLES, BASE_GATE, gatePairsFor, FONT_PAIRS, PALETTES, PALETTE_BY_ID, palettesOf, TRADE_WORDS, TRADE_ROW, tradeRowFor };
