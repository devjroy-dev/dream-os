'use strict';
// src/lib/partners/seams.js · CE-47 · PTN-A1 · THE SEAMS, DECLARED AND NOT CALLED (the chair: "behind a seam, not called yet").
// A2 fills these when CLB-2a and PRO's doors land. Nothing in A1 calls them; b290 §7 proves no caller exists.
//   createCallFor     <- CLB-2a (src/lib/collab, a server function): makes a forwarded request a real call for a TDW vendor
//   addPartnerInterest<- CLB-2a src/lib/collab/interest.js: a suggested person enters the call's Interested list
//   onPostCreated     <- CLB-2a src/lib/collab/events.js: once per new call, for matching partners
//   kitFor / verifiedWeddingsFor <- PRO: the media kit check code and verified weddings
const NOT_YET = (name, owner) => async () => { throw new Error(`${name} is not wired yet: it arrives with ${owner} (PTN-A2)`); };
module.exports = Object.freeze({
  createCallFor:       NOT_YET('createCallFor', 'CLB-2a'),
  addPartnerInterest:  NOT_YET('addPartnerInterest', 'CLB-2a'),
  onPostCreated:       NOT_YET('onPostCreated', 'CLB-2a'),
  kitFor:              NOT_YET('kitFor', 'PRO'),
  verifiedWeddingsFor: NOT_YET('verifiedWeddingsFor', 'PRO'),
});
