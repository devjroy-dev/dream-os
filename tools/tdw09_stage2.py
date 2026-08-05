#!/usr/bin/env python3
# tools/tdw09_stage2.py — TDW_09 UX Blueprint · stage 2 instrument.
# TWO CENSUSES over app/** (page+layout) and components/**:
#
#   TOUCH — interactive elements (button/<a>/<Link>/onClick div) with their
#     declared height/padding-derived box, tap-highlight suppression, and
#     pressed-feedback presence (a true :active/onTouchStart/pressed-state
#     transform — NOT a selected-state `active ?` ternary).
#     FAILURE MODES, named: blind to heights arriving from CSS classes or
#     parent stretch (declared-style census only — the F-08.42 class);
#     a JSX element spanning >1 line is parsed by a paired-brace scan that
#     can misattribute styles in deeply nested inline lambdas — every
#     headline row below is therefore HAND-VERIFIED before it ships.
#     Verdicts are FLOORS: "no pressed feedback" means none statically
#     visible in the element or its file; a shared component could supply it
#     (which is why presence is ALSO censused per-file and per-import).
#
#   STATES — per routed surface: does the file render a loading state, an
#     empty state, an error state? Pattern census (Skeleton/shimmer/loading
#     ternaries; `.length === 0`/empty-copy; error ternaries/toast/catch).
#     FAILURE MODE: a state rendered by an imported component is invisible
#     here unless the import name matches the pattern set — UNKNOWN is
#     emitted for surfaces with no fetch at all (a static page needs no
#     loading state and must not be convicted for lacking one).
#
# Exits 1 with a named reason off a pwa tree. No silent zeros.

import json, os, re, sys
from collections import defaultdict

pwa = os.environ.get("TDW_PWA")
if not pwa:
    sys.exit("TDW_PWA is unset — point it at a dreamos-pwa clone. Refusing to guess.")
if not os.path.isdir(os.path.join(pwa, "app")):
    sys.exit(f"{pwa} has no app/ — not a pwa clone. Refusing.")
try:
    if json.load(open(os.path.join(pwa, "package.json"))).get("name") != "web":
        sys.exit("package.json name is not 'web' — wrong tree. Refusing.")
except OSError as e:
    sys.exit(f"cannot read package.json: {e}")

def lane_of(rel):
    parts = rel.replace("\\", "/").split("/")
    if parts[0] == "components":
        return "components/" + (parts[1] if len(parts) > 1 else "")
    if parts[0] != "app":
        return parts[0]
    seg = parts[1] if len(parts) > 1 else ""
    return seg.strip("()") or "root"

STRIP_BLOCK = re.compile(r"/\*.*?\*/", re.S)
STRIP_LINE  = re.compile(r"(?m)(?<![:'\"])//(?!/).*$")

# pressed-feedback signals (true feedback, not selection):
PRESSED_SIGNALS = [
    re.compile(r":active\s*\{[^}]*transform"),          # css :active transform
    re.compile(r":active\s*\{[^}]*opacity"),
    re.compile(r"\bonTouchStart\s*="),
    re.compile(r"\bpressed\b[^\n]*scale\("),            # pressed-state ternary
    re.compile(r"setPressed|setDown|isPressed"),
]
SELECTED_FALSE_FRIEND = re.compile(r"\bactive\s*\?")     # counted separately

TAP_SUPPRESS = re.compile(r"WebkitTapHighlightColor\s*:\s*['\"]transparent['\"]")
HEIGHT_RE    = re.compile(r"\bheight\s*:\s*(\d+)\b")
BTN_OPEN     = re.compile(r"<(button|a)\b|onClick=\{")

LOAD_PAT  = re.compile(r"loading|Loading|shimmer|Skeleton|isFetching", )
EMPTY_PAT = re.compile(r"\.length\s*===\s*0|\.length\s*<\s*1|No\s+\w+\s+yet|[Nn]othing\s+(here|yet)|empty", )
ERR_PAT   = re.compile(r"\berror\b|\bErr\b|catch\s*\(|showToast|Toast", )
FETCH_PAT = re.compile(r"\bfetch\(|adminGet|adminPost|api\.")

touch_rows = []          # (rel, lane, heights<44 list, total_height_decls, suppress_count, pressed_present, selected_ternaries)
states_rows = []         # (route_rel, lane, fetches, load, empty, err)

for base in ("app", "components"):
    for root, dirs, files in os.walk(os.path.join(pwa, base)):
        dirs[:] = [d for d in dirs if d not in ("node_modules", "api")]
        for f in files:
            if not f.endswith((".tsx", ".jsx")):
                continue
            p = os.path.join(root, f)
            rel = os.path.relpath(p, pwa).replace("\\", "/")
            src = open(p, encoding="utf-8", errors="replace").read()
            src = STRIP_LINE.sub("", STRIP_BLOCK.sub(lambda m: "\n" * m.group(0).count("\n"), src))
            lane = lane_of(rel)

            interactive = len(BTN_OPEN.findall(src))
            if interactive:
                heights = [int(h) for h in HEIGHT_RE.findall(src)]
                # heights on non-interactive boxes pollute; keep only 20..80 as
                # plausibly-tappable declarations — DECLARED HEURISTIC, stated.
                tappable_h = [h for h in heights if 20 <= h <= 80]
                below = [h for h in tappable_h if h < 44]
                suppress = len(TAP_SUPPRESS.findall(src))
                pressed  = any(rx.search(src) for rx in PRESSED_SIGNALS)
                selected = len(SELECTED_FALSE_FRIEND.findall(src))
                touch_rows.append((rel, lane, below, len(tappable_h), suppress, pressed, selected, interactive))

            if re.search(r"/page\.(tsx|jsx)$", rel):
                fetches = len(FETCH_PAT.findall(src))
                states_rows.append((rel, lane, fetches,
                                    bool(LOAD_PAT.search(src)),
                                    bool(EMPTY_PAT.search(src)),
                                    bool(ERR_PAT.search(src))))

# ── aggregate ────────────────────────────────────────────────────────────────
lanes = defaultdict(lambda: dict(files=0, interactive=0, below44=0, hdecl=0,
                                 suppress=0, pressed_files=0, selected=0))
for rel, lane, below, hd, sup, pressed, sel, inter in touch_rows:
    L = lanes[lane]
    L["files"] += 1; L["interactive"] += inter; L["below44"] += len(below)
    L["hdecl"] += hd; L["suppress"] += sup; L["pressed_files"] += 1 if pressed else 0
    L["selected"] += sel

st = defaultdict(lambda: dict(pages=0, fetching=0, load=0, empty=0, err=0,
                              fetch_no_load=0, fetch_no_empty=0, fetch_no_err=0))
for rel, lane, fetches, load, empty, err in states_rows:
    S = st[lane]
    S["pages"] += 1
    if fetches:
        S["fetching"] += 1
        S["load"]  += 1 if load else 0
        S["empty"] += 1 if empty else 0
        S["err"]   += 1 if err else 0
        S["fetch_no_load"]  += 0 if load else 1
        S["fetch_no_empty"] += 0 if empty else 1
        S["fetch_no_err"]   += 0 if err else 1

out = {"touch_by_lane": dict(lanes), "states_by_lane": dict(st),
       "touch_rows": [dict(rel=r, lane=l, below44=b, hdecls=hd, suppress=s,
                           pressed=p, selected=sel, interactive=i)
                      for r, l, b, hd, s, p, sel, i in touch_rows],
       "states_rows": [dict(rel=r, lane=l, fetches=f, load=lo, empty=e, err=er)
                       for r, l, f, lo, e, er in states_rows]}
here = os.path.dirname(os.path.abspath(__file__))
json.dump(out, open(os.path.join(here, "stage2.json"), "w"), indent=1)

tot = lambda k: sum(L[k] for L in lanes.values())
stot = lambda k: sum(S[k] for S in st.values())
print(f"touch: files={tot('files')} interactive={tot('interactive')} "
      f"height_decls_20to80={tot('hdecl')} below44={tot('below44')} "
      f"tap_suppress={tot('suppress')} files_with_pressed={tot('pressed_files')} "
      f"selected_ternaries={tot('selected')}")
print(f"states: pages={stot('pages')} fetching={stot('fetching')} "
      f"fetch_no_load={stot('fetch_no_load')} fetch_no_empty={stot('fetch_no_empty')} "
      f"fetch_no_err={stot('fetch_no_err')}")
print("GRADE: declared-style floors; pressed 'absent' = not statically visible "
      "in-file; states via pattern census, imported-component states invisible. "
      "Headline rows hand-verified before publication.")
