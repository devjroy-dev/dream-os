// scripts/_noop_middleware.js — a pass-through middleware for benches that drive
// a router directly. `requireAdmin` is injected past deliberately: a guard bench
// is about the guard, and an auth cell belongs with auth.
module.exports = (req, res, next) => next();
