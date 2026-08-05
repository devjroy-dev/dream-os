#!/usr/bin/env python3
# tools/tdw09_ia_map.py — TDW_09 UX Blueprint · the IA-map instrument.
#
# THREE PASSES, deliberately differing failure modes (the census-method law):
#   P-A  route enumeration    — filesystem walk of app/**/page.{tsx,jsx,js}.
#        FAILURE MODE: silent on anything mounted outside the app router;
#        blind to middleware rewrites (read separately, by hand, from
#        middleware.ts — the instrument does not parse it and says so).
#   P-B  edge extraction      — regex scan for router.push/replace,
#        <Link href>, window.location, redirect(), <a href>.
#        FAILURE MODE: blind to hrefs assembled in variables/helpers before
#        the call site; blind to server-driven navigation; a route navigated
#        only via a computed string is invisible here (the F-08.42 class).
#   P-C  edge resolution      — each extracted href matched against P-A's
#        route patterns (dynamic segments match any one segment).
#        FAILURE MODE: template hrefs whose variables cannot be read
#        statically emit UNRESOLVED, never a verdict. External hrefs emit
#        EXTERNAL. UNRESOLVED is never an edge and never an orphan-acquittal.
#
# Orphan/dead-end verdicts are therefore FLOORS: an "orphan" here means
# "no statically visible inbound edge", which is exactly F-09.8's screen-1
# class — it is a lead to hand-verify, not a conviction. The instrument
# prints this sentence in its own output so no reader mistakes the grade.
#
# Exits 1 with a named reason when TDW_PWA is unset or not a pwa clone —
# a check whose failure mode is a silent zero is not a check.

import json, os, re, sys
from collections import defaultdict

pwa = os.environ.get("TDW_PWA")
if not pwa:
    sys.exit("TDW_PWA is unset — point it at a dreamos-pwa clone. Refusing to guess.")
app = os.path.join(pwa, "app")
pkg = os.path.join(pwa, "package.json")
if not os.path.isdir(app) or not os.path.isfile(pkg):
    sys.exit(f"{pwa} does not look like a dreamos-pwa clone (no app/ or package.json).")
name = json.load(open(pkg)).get("name")
if name != "web":
    sys.exit(f"package.json name is {name!r}, expected 'web' — wrong tree. Refusing.")

# ── P-A · routes ─────────────────────────────────────────────────────────────
routes = {}  # route -> file
for root, dirs, files in os.walk(app):
    dirs[:] = [d for d in dirs if d not in ("node_modules", "api")]
    for f in files:
        if re.fullmatch(r"page\.(tsx|jsx|js)", f):
            rel = os.path.relpath(os.path.join(root, f), app)
            segs = [s for s in os.path.dirname(rel).split(os.sep)
                    if s and not (s.startswith("(") and s.endswith(")"))]
            route = "/" + "/".join(segs)
            routes[route if route != "/" else "/"] = os.path.relpath(
                os.path.join(root, f), pwa)

def pattern(route):
    parts = route.strip("/").split("/") if route != "/" else []
    return [("*" if p.startswith("[") else p) for p in parts]

pats = {r: pattern(r) for r in routes}

def lane_of(rel):
    # the source file's lane, used ONLY to break otherwise-ambiguous
    # suffix matches: app/demo/** and components/demo/** are the demo lane, etc.
    m = re.match(r"(?:app|components|lib)[/\\](\(?[a-z-]+\)?)", rel)
    return (m.group(1).strip("()") if m else None)

def resolve(href, src_lane=None):
    """Return (verdict, route|None). Verdicts: ROUTE, EXTERNAL, UNRESOLVED, MISS."""
    if re.match(r"^(https?:|mailto:|tel:|instagram:|whatsapp:|wa\.me|//)", href):
        return "EXTERNAL", None
    if href.startswith("${"):
        # variable-PREFIX template: resolve by unique route-suffix match.
        # The literal tail after the variable is the evidence; the prefix is not.
        tail = re.sub(r"^\$\{[^}]+\}", "", href).split("?")[0].split("#")[0]
        tparts = [p for p in tail.strip("/").split("/") if p]
        tparts = ["*" if "${" in p else p for p in tparts]
        if not tparts:
            return "UNRESOLVED", None
        # a LITERAL tail segment must match a LITERAL pattern segment — a
        # route-side [param] swallowing 'list' would make /crew/[token] a
        # "match" for `${base}/list`, which is how the first draft of this
        # resolver lied. Only href-side ${} wildcards match anything.
        hits = [r for r, pat in pats.items()
                if len(pat) >= len(tparts)
                and all(tp == "*" or pp == tp
                        for pp, tp in zip(pat[-len(tparts):], tparts))]
        if len(hits) > 1 and src_lane:
            lane_hits = [h for h in hits
                         if h.strip("/").split("/")[0] == src_lane]
            if len(lane_hits) == 1:
                hits = lane_hits   # broken by the source file's own lane
        if len(hits) == 1:
            return "ROUTE", hits[0]
        return "UNRESOLVED", None   # zero or still-ambiguous — never a guess
    if "${" in href or href.startswith("#"):
        # normalise mid-string `${x}` → one wildcard segment and retry
        norm = re.sub(r"\$\{[^}]*\}", "*", href)
        if "${" in norm or norm.startswith("#"):
            return "UNRESOLVED", None
        href = norm
    path = href.split("?")[0].split("#")[0].rstrip("/") or "/"
    parts = path.strip("/").split("/") if path != "/" else []
    for r, pat in pats.items():
        if len(pat) != len(parts):
            continue
        if all(pp in ("*",) or pp == sp or sp == "*" for pp, sp in zip(pat, parts)):
            return "ROUTE", r
    return "MISS", path

# ── P-B · edges ──────────────────────────────────────────────────────────────
EDGE_RE = [
    ("push",    re.compile(r"router\.(?:push|replace)\(\s*[`'\"]([^`'\"]+)[`'\"]")),
    ("Link",    re.compile(r"<Link[^>]*\bhref=\{?[`'\"]([^`'\"]+)[`'\"]")),
    ("a",       re.compile(r"<a[^>]*\bhref=\{?[`'\"]([^`'\"]+)[`'\"]")),
    ("loc",     re.compile(r"window\.location(?:\.href)?\s*=\s*[`'\"]([^`'\"]+)[`'\"]")),
    ("locfn",   re.compile(r"window\.location\.(?:replace|assign)\(\s*[`'\"]([^`'\"]+)[`'\"]")),
    ("redir",   re.compile(r"\bredirect\(\s*[`'\"]([^`'\"]+)[`'\"]")),
    # the estate's dominant idiom: nav config objects ({ href: '/vendor/…' })
    # rendered later through <Link href={item.href}>. Caught at the object
    # literal, where the truth lives. Restricted to root-relative strings so
    # data fields named `href` pointing at images/CDNs don't pollute the graph.
    ("objhref", re.compile(r"\b(?:href|path|route|deeplink)\s*:\s*[`'\"](/[^`'\"]*)[`'\"]")),
    # variable-prefix templates — the demo lane's idiom: path: `${base}/studio`.
    # Captured whole; resolved by UNIQUE route-suffix match below. Ambiguity
    # (a suffix matching >1 route) emits UNRESOLVED, never a guess.
    ("varpfx",  re.compile(r"\b(?:href|path|route|deeplink)\s*:\s*`(\$\{[^}]+\}/[^`]*)`")),
]
DYNAMIC_NAV = re.compile(r"router\.(?:push|replace)\(\s*(?![`'\"])")  # computed arg

edges = []       # (src_file, kind, raw, verdict, target_route)
dynamic_sites = []  # nav calls with computed args — P-B's named blindness, counted
scan_dirs = [os.path.join(pwa, d) for d in ("app", "components", "lib")]
for base in scan_dirs:
    for root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d != "node_modules"]
        for f in files:
            if not f.endswith((".tsx", ".ts", ".jsx", ".js")):
                continue
            p = os.path.join(root, f)
            rel = os.path.relpath(p, pwa)
            try:
                src = open(p, encoding="utf-8", errors="replace").read()
            except OSError as e:
                sys.exit(f"cannot read {rel}: {e}")
            # strip comments BEFORE scanning: the estate documents retired
            # edges verbatim in comments ("WHAT STOOD HERE" blocks), and a
            # scanner that reads them resurrects the dead into the graph.
            # Line-preserving strip so nothing else shifts.
            src = re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), src, flags=re.S)
            src = re.sub(r"(?m)(?<![:'\"])//(?!/).*$", "", src)
            for kind, rx in EDGE_RE:
                for m in rx.finditer(src):
                    raw = m.group(1)
                    verdict, tgt = resolve(raw, lane_of(rel))
                    edges.append((rel, kind, raw, verdict, tgt))
            for m in DYNAMIC_NAV.finditer(src):
                dynamic_sites.append(rel)

# ── attribute edges to source routes ────────────────────────────────────────
# a file under app/ belongs to its nearest route; a component/lib file's edges
# are attributed to every route whose page file (or transitive layout) is not
# derived here — DECLARED LIMIT: component-borne edges are listed under the
# component, not multiplied across consumers. The map reads them as shared
# chrome, which is what they are.
LAYOUT_RE = re.compile(r"layout\.(tsx|jsx|js)$")

def descendants(rel_dir):
    """All routes at or beneath an app-relative directory — a layout's edges
    belong to every screen it wraps, or a persistent sidebar makes every
    leaf beneath it a false dead-end."""
    prefix = rel_dir.rstrip(os.sep) + os.sep
    out = []
    for r, f in routes.items():
        fdir = os.path.dirname(f) + os.sep
        if fdir.startswith(prefix) or fdir == rel_dir + os.sep:
            out.append(r)
    return out

def owner(rel):
    if not rel.startswith("app" + os.sep):
        return None
    d = os.path.dirname(rel)
    while d and d != "app":
        candidate = None
        for ext in ("tsx", "jsx", "js"):
            if os.path.isfile(os.path.join(pwa, d, f"page.{ext}")):
                candidate = os.path.relpath(os.path.join(pwa, d, f"page.{ext}"), pwa)
                break
        if candidate:
            for r, f in routes.items():
                if f == candidate:
                    return r
        d = os.path.dirname(d)
    return "/" if "/" in routes else None

# ── layout-imported chrome: a BottomNav imported by app/vendor/layout.tsx is
# on every vendor screen; its edges belong to the lane, or the lane's screens
# all read as false dead-ends. Import resolution is deliberately shallow
# (one hop, literal specifiers only) and says so.
import_rx = re.compile(r"import\s+[^;]*?from\s+['\"]([^'\"]+)['\"]")
def resolve_import(spec, importer_dir):
    if spec.startswith("@/"):
        cand = os.path.join(pwa, spec[2:])
    elif spec.startswith("."):
        cand = os.path.normpath(os.path.join(pwa, importer_dir, spec))
    else:
        return None
    for suf in (".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"):
        if os.path.isfile(cand + suf):
            return os.path.relpath(cand + suf, pwa)
    return None

edges_by_file = defaultdict(list)
for rel, kind, raw, verdict, tgt in edges:
    if verdict == "ROUTE":
        edges_by_file[rel].append(tgt)

layout_chrome = defaultdict(set)   # layout dir -> set of target routes via imported chrome
for root, dirs, files in os.walk(app):
    dirs[:] = [d for d in dirs if d not in ("node_modules", "api")]
    for f in files:
        if not re.fullmatch(r"layout\.(tsx|jsx|js)", f):
            continue
        lp = os.path.join(root, f)
        lrel_dir = os.path.relpath(root, pwa)
        s = open(lp, encoding="utf-8", errors="replace").read()
        for m in import_rx.finditer(s):
            comp = resolve_import(m.group(1), lrel_dir)
            if comp and not comp.startswith("app" + os.sep):
                for tgt in edges_by_file.get(comp, []):
                    layout_chrome[lrel_dir].add(tgt)

inbound = defaultdict(set)
outbound = defaultdict(set)
chrome_edges = []
unresolved = misses = external = 0
for rel, kind, raw, verdict, tgt in edges:
    is_layout = bool(LAYOUT_RE.search(os.path.basename(rel))) and rel.startswith("app" + os.sep)
    src_route = owner(rel)
    if verdict == "ROUTE":
        if is_layout:
            for r in descendants(os.path.dirname(rel)):
                outbound[r].add(tgt)
                inbound[tgt].add(f"layout:{os.path.dirname(rel)}")
        elif src_route:
            outbound[src_route].add(tgt)
            inbound[tgt].add(src_route)
        else:
            chrome_edges.append((rel, raw, tgt))
            inbound[tgt].add(f"chrome:{rel}")
    elif verdict == "UNRESOLVED":
        unresolved += 1
    elif verdict == "MISS":
        misses += 1
    else:
        external += 1

# spread layout-imported chrome edges across each layout's descendants
for lrel_dir, tgts in layout_chrome.items():
    for r in descendants(lrel_dir):
        for tgt in tgts:
            outbound[r].add(tgt)
            inbound[tgt].add(f"chrome-of:{lrel_dir}")

orphans = sorted(r for r in routes if not inbound.get(r))
deadends = sorted(r for r in routes if not outbound.get(r))

out = {
    "routes": {r: routes[r] for r in sorted(routes)},
    "inbound": {r: sorted(v) for r, v in sorted(inbound.items())},
    "outbound": {r: sorted(v) for r, v in sorted(outbound.items())},
    "orphans_floor": orphans,
    "deadends_floor": deadends,
    "edge_totals": {"resolved": sum(len(v) for v in outbound.values()) + len(chrome_edges),
                    "unresolved": unresolved, "miss": misses, "external": external,
                    "dynamic_nav_sites": len(dynamic_sites)},
}
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "ia_map.json"), "w") as f:
    json.dump(out, f, indent=1)

print(f"routes={len(routes)} edges_resolved={out['edge_totals']['resolved']} "
      f"unresolved={unresolved} miss={misses} external={external} "
      f"dynamic_nav_sites={len(dynamic_sites)}")
print(f"orphans_FLOOR={len(orphans)} deadends_FLOOR={len(deadends)}")
print("VERDICT GRADE: orphan/dead-end lists are FLOORS from statically visible "
      "edges only — leads to hand-verify, never convictions. UNRESOLVED is never GREEN.")
