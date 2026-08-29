// src/lib/corsOptions.js
//
// THE CORS OPTIONS, IN ONE HOME — F-39.2 (CE-39 band 1, cured step 2a).
//
// WHY IT MOVED OUT OF src/index.js. The options object was inline and
// unexportable, so nothing could assert its behaviour without booting the whole
// server. The cure is one field, `maxAge: 600`, and a cell that drives a real
// OPTIONS request through a throwaway express app and reads
// `Access-Control-Max-Age` off the wire — behaviour, not spelling. That cell
// needs the object; hence this file. `src/index.js` consumes it and adds nothing.
//
// THE DEFECT. With no `maxAge`, Chrome caches a preflight for 5 seconds, so every
// credentialed `/api/v2/vendor/*` call the PWA makes pays an OPTIONS round trip
// first — the founder's Network tab showed OPTIONS+GET pairs for every `/me`.
// 600 seconds is ten minutes of silence per origin+route, and nothing else here
// changes: the origin list, the credentials flag, the methods and the header
// allow-list are byte-for-byte what index.js carried.
//
// Locked origin list: production domains + Vercel shell + local dev.
// Add new origins here when new deploy targets are introduced.
'use strict';

const ALLOWED_ORIGINS = [
  'https://thedreamwedding.in',
  'https://www.thedreamwedding.in',
  'https://thedreamai.in',
  'https://www.thedreamai.in',
  'https://dreamos-pwa.vercel.app',
  'https://demo.thedreamwedding.in',
  'https://demodiscover.thedreamwedding.in',
  'https://demobride.thedreamwedding.in',
  'https://demodreamer.thedreamwedding.in',
  'http://localhost:3000',
  'http://localhost:3001',
];

const PREFLIGHT_MAX_AGE_SECONDS = 600;

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    // dreamos-pwa Vercel previews
    if (/^https:\/\/dreamos-pwa[a-z0-9-]*\.vercel\.app$/.test(origin)) return cb(null, true);
    // dreamai Vercel previews
    if (/^https:\/\/dreamai[a-z0-9-]*\.vercel\.app$/.test(origin)) return cb(null, true);
    // GitHub Codespaces (dev)
    if (/^https:\/\/[a-z0-9-]+-\d+\.app\.github\.dev$/.test(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // F-07.85 (CE F-3 end-state): `x-admin-password` REMOVED. The credential has
  // left the client, so the header it travelled in is no longer allowlisted —
  // a browser that tried to send it now fails preflight, which is the point.
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  // F-39.2: the preflight is cached, not repeated.
  maxAge: PREFLIGHT_MAX_AGE_SECONDS,
};

module.exports = { corsOptions, ALLOWED_ORIGINS, PREFLIGHT_MAX_AGE_SECONDS };
