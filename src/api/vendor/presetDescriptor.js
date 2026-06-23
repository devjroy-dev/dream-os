'use strict';
// src/api/vendor/presetDescriptor.js
// Vendor Suit — maps an engine profession_preset (categoryPreset.js RHS) to the
// one-line owner_descriptor written into agent_owner at agent-birth, which Victor
// reads via loadOwner ("[Your owner] <name> — <descriptor>."). The six wedding
// presets; professions.ts doesn't carry these keys, so the map lives here.
// Unknown preset -> null (Victor then works from the name + craft, no descriptor line).
const PRESET_DESCRIPTOR = {
  makeup_artist:   'a makeup artist',
  wedding_planner: 'an event and wedding planner',
  photographer:    'a wedding photographer',
  designer:        'a designer',
  venue_decorator: 'a venue and décor specialist',
  jeweller:        'a jeweller',
};

function presetDescriptor(preset) {
  if (!preset) return null;
  return PRESET_DESCRIPTOR[String(preset).trim().toLowerCase()] || null;
}

module.exports = { PRESET_DESCRIPTOR, presetDescriptor };
