'use strict';
// src/lib/collab/roles.js · CE-47 · CLB-2a · THE COLLAB ROLE LIST (ruled 6 October 2026): the roles a call can ask for.
// The eleven vendor categories (their one home is src/agent/categories.js) plus three roles that are people, not vendor
// businesses: model, stylist, studio. Vendor categories and vendor sign-up are untouched; this list is for calls and
// for the collaborator join only. 0197's CHECK on both role columns is this list, word for word (b282 pins it).
const { VENDOR_CATEGORIES } = require('../../agent/categories');

const EXTRA_ROLES = Object.freeze(['model', 'stylist', 'studio']);
const COLLAB_ROLES = Object.freeze([...VENDOR_CATEGORIES, ...EXTRA_ROLES]);

function isCollabRole(r) { return COLLAB_ROLES.includes(r); }

module.exports = { EXTRA_ROLES, COLLAB_ROLES, isCollabRole };
