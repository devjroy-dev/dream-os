#!/usr/bin/env python3
"""
TDW_09 Sitting 1 — Phase 1 census instrument.
P-A route enumeration · P-B literal extraction · P-C cascade resolution + WCAG AA.

FAILURE MODES ARE DECLARED, NOT HIDDEN. See MODES at foot of file.
Anything P-C cannot resolve is emitted UNRESOLVED. Never GREEN by default.
"""
import os, re, json, sys, math
from collections import defaultdict

# Runnable from any working directory (protocol §9: a cure nobody can re-run
# stops being a cure — so does an audit). Point TDW_PWA at a dreamos-pwa clone.
PWA = os.environ.get("TDW_PWA") or os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "dreamos-pwa")
PWA = os.path.abspath(PWA)
if not os.path.isdir(os.path.join(PWA, "app")):
    sys.exit(f"TDW_PWA does not point at a dreamos-pwa clone: {PWA}\n"
             f"usage: TDW_PWA=/path/to/dreamos-pwa python3 tools/tdw09_census.py")

# ─────────────────────────── colour primitives ───────────────────────────
NAMED = {
    'white': (255,255,255), 'black': (0,0,0), 'transparent': None,
    'red': (255,0,0), 'none': None, 'inherit': None, 'currentcolor': None,
}

def parse_color(v):
    """→ (r,g,b,a) or None if unresolvable/transparent."""
    if v is None: return None
    v = v.strip().strip('\'"').strip()
    if not v: return None
    low = v.lower()
    if low in NAMED:
        c = NAMED[low]
        return None if c is None else (c[0], c[1], c[2], 1.0)
    m = re.fullmatch(r'#([0-9a-fA-F]{3})', v)
    if m:
        h = m.group(1)
        return (int(h[0]*2,16), int(h[1]*2,16), int(h[2]*2,16), 1.0)
    m = re.fullmatch(r'#([0-9a-fA-F]{6})', v)
    if m:
        h = m.group(1)
        return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), 1.0)
    m = re.fullmatch(r'#([0-9a-fA-F]{8})', v)
    if m:
        h = m.group(1)
        return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), int(h[6:8],16)/255.0)
    m = re.fullmatch(r'rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.%]+)\s*)?\)', v, re.I)
    if m:
        r,g,b = (int(float(m.group(i))) for i in (1,2,3))
        a = m.group(4)
        if a is None: al = 1.0
        elif a.endswith('%'): al = float(a[:-1])/100.0
        else: al = float(a)
        return (r,g,b,al)
    return None   # gradients, var() already substituted upstream, calc(), etc.

def composite(fg, bg):
    """Alpha-composite fg over opaque bg → opaque rgb."""
    if fg is None: return None
    if fg[3] >= 0.999: return (fg[0], fg[1], fg[2])
    if bg is None: return None
    a = fg[3]
    return tuple(round(fg[i]*a + bg[i]*(1-a)) for i in range(3))

def rel_lum(rgb):
    def ch(c):
        c = c/255.0
        return c/12.92 if c <= 0.03928 else ((c+0.055)/1.055) ** 2.4
    r,g,b = rgb
    return 0.2126*ch(r) + 0.7152*ch(g) + 0.0722*ch(b)

def contrast(a, b):
    l1, l2 = rel_lum(a), rel_lum(b)
    if l1 < l2: l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)

# ─────────────────────────── CSS custom properties ───────────────────────────
THEMES = [':root', 'html.theme-light', 'html.theme-flair']

def load_css_vars():
    """Collect --var: value declarations per selector block from the global sheets."""
    varmap = defaultdict(list)   # name -> [(file, selector, value, important)]
    for fn in ('app/globals.css', 'app/globals-v2.css'):
        p = os.path.join(PWA, fn)
        if not os.path.exists(p): continue
        txt = open(p, encoding='utf-8', errors='replace').read()
        txt = re.sub(r'/\*.*?\*/', '', txt, flags=re.S)
        for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', txt):
            sel = m.group(1).strip().splitlines()[-1].strip()
            for d in re.finditer(r'(--[A-Za-z0-9_-]+)\s*:\s*([^;]+);', m.group(2)):
                v = d.group(2).strip()
                imp = '!important' in v
                varmap[d.group(1)].append((fn, sel, v.replace('!important','').strip(), imp))
    return varmap

VARS = load_css_vars()

def _theme_pick(cands, theme):
    """Cascade-ish pick: !important under the theme > theme block > :root."""
    if not cands: return None
    def sel_matches(sel):
        s = sel.strip()
        if theme == ':root':
            return s in (':root', 'html', 'body', ':root, html')
        return s.startswith(theme)
    imp = [c for c in cands if c[3] and sel_matches(c[1])]
    if imp: return imp[-1][2]
    hit = [c for c in cands if sel_matches(c[1])]
    if hit: return hit[-1][2]
    if theme != ':root':
        root = [c for c in cands if c[1].strip() in (':root','html','body')]
        if root: return root[-1][2]
    vals = {c[2] for c in cands}
    return next(iter(vals)) if len(vals) == 1 else None

def resolve_var(expr, theme=':root', depth=0):
    if depth > 6 or expr is None: return None
    m = re.fullmatch(r'var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*(.+?)\s*)?\)', expr.strip())
    if not m: return expr
    name, fallback = m.group(1), m.group(2)
    v = _theme_pick(VARS.get(name, []), theme)
    if v is None:
        return resolve_var(fallback, theme, depth+1) if fallback else None
    return resolve_var(v, theme, depth+1)

# ─── per-file JS palette constants (the tree's fifth palette home) ───
CONSTS = {}
def load_file_consts(txt):
    """const A = { ink:'#..', .. }  and  const GOLD = '#..'  → flat name->literal."""
    out = {}
    for m in re.finditer(r'\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*\{', txt):
        s = m.end() - 1
        e = balanced(txt, s)
        if e < 0: continue
        body = txt[s+1:e-1]
        if len(body) > 4000: continue
        for d in re.finditer(r'([A-Za-z_$][\w$]*)\s*:\s*([\'"])(.*?)\2', body):
            out[f'{m.group(1)}.{d.group(1)}'] = d.group(3)
            out.setdefault(d.group(1), d.group(3))
    for m in re.finditer(r'\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*([\'"])(#[0-9a-fA-F]{3,8}|rgba?\([^)\'"]*\))\2', txt):
        out[m.group(1)] = m.group(3)
    return out

# ─────────────────────────── JSX style extraction ───────────────────────────
STYLE_PROPS = ('color','background','backgroundColor','fontSize','fontWeight','lineHeight','opacity')

def balanced(txt, start):
    """start points at the '{' opening a JSX expression. Return end index (exclusive)."""
    d = 0; i = start; n = len(txt)
    instr = None
    while i < n:
        c = txt[i]
        if instr:
            if c == '\\': i += 2; continue
            if c == instr: instr = None
        elif c in '"\'`': instr = c
        elif c == '{': d += 1
        elif c == '}':
            d -= 1
            if d == 0: return i+1
        i += 1
    return -1

def parse_style_obj(src):
    """src is the inner text of style={{ ... }}. → dict of interesting props."""
    out = {}
    for prop in STYLE_PROPS:
        # prop: value  — value up to a comma at depth 0
        for m in re.finditer(r'(?<![A-Za-z])' + prop + r'\s*:\s*', src):
            i = m.end(); d = 0; instr = None; buf = []
            while i < len(src):
                c = src[i]
                if instr:
                    buf.append(c)
                    if c == '\\': buf.append(src[i+1] if i+1 < len(src) else ''); i += 2; continue
                    if c == instr: instr = None
                    i += 1; continue
                if c in '"\'`': instr = c; buf.append(c); i += 1; continue
                if c in '([{': d += 1
                elif c in ')]}':
                    if d == 0: break
                    d -= 1
                elif c == ',' and d == 0: break
                buf.append(c); i += 1
            val = ''.join(buf).strip()
            if val and prop not in out:
                out[prop] = val
    return out

TAG_RE = re.compile(r'<(/?)([A-Za-z][A-Za-z0-9_.]*)')

def surface_tree(path, want_consts=False):
    """Elements with true [start,end] SPANS, so ancestry is containment, not a
    depth counter. (The depth-counter draft leaked a fixed-position sibling's
    background onto later elements — caught by hand-verification at
    app/admin/collab/page.tsx:67 and rewritten rather than tuned.)"""
    txt = open(path, encoding='utf-8', errors='replace').read()
    txt = re.sub(r'/\*.*?\*/', lambda m: ' '*len(m.group(0)), txt, flags=re.S)
    txt = re.sub(r'//[^\n]*', lambda m: ' '*len(m.group(0)), txt)

    styles = {}
    for m in re.finditer(r'style=\{\{', txt):
        st = m.end() - 1
        e = balanced(txt, st)
        if e < 0: continue
        sd = parse_style_obj(txt[st+1:e-1])
        if sd: styles[m.start()] = sd

    elems = []          # (open_start, open_end, close_end, tag, styledict|None)
    stack = []
    for m in TAG_RE.finditer(txt):
        closing, tag = m.group(1), m.group(2)
        j = m.end(); d = 0; instr = None; selfclose = False
        while j < len(txt):
            c = txt[j]
            if instr:
                if c == '\\': j += 2; continue
                if c == instr: instr = None
            elif c in '"\'': instr = c
            elif c == '{': d += 1
            elif c == '}': d -= 1
            elif d == 0 and c == '>':
                selfclose = txt[j-1] == '/'
                break
            j += 1
        if closing:
            # pop to the matching open tag; unmatched closers are ignored
            for k in range(len(stack)-1, -1, -1):
                if stack[k][3] == tag:
                    op = stack.pop(k)
                    del stack[k:]
                    elems.append((op[0], op[1], j+1, op[3], op[4]))
                    break
            continue
        sd = None
        for off, sdict in styles.items():
            if m.start() < off < j: sd = sdict; break
        if selfclose:
            elems.append((m.start(), j+1, j+1, tag, sd))
        else:
            stack.append((m.start(), j+1, None, tag, sd))
    for op in stack:                     # unclosed at EOF — span to EOF, declared
        elems.append((op[0], op[1], len(txt), op[3], op[4]))

    nodes = []
    for (s0, s1, e1, tag, sd) in elems:
        if sd is None: continue
        anc = [a for a in elems
               if a[0] < s0 and a[2] >= e1 and a[4] is not None]
        anc.sort(key=lambda a: a[0])
        nodes.append({'start': s0, 'line': txt[:s0].count('\n')+1,
                      'tag': tag, 'style': sd, 'anc': [a[4] for a in anc]})
    nodes.sort(key=lambda n: n['start'])
    return (nodes, load_file_consts(txt)) if want_consts else nodes

def resolve_value(v, consts=None, theme=':root', depth=0):
    if v is None or depth > 5: return None
    v = v.strip()
    if v.startswith('var('):
        v = resolve_var(v, theme)
        if v is None: return None
        return resolve_value(v, consts, theme, depth+1)
    raw = v.strip().strip('\'"')
    if consts and raw in consts:
        return resolve_value(consts[raw], consts, theme, depth+1)
    if not raw or raw.startswith('$') or '?' in raw or '`' in raw or '${' in raw:
        return None            # runtime-conditional: UNRESOLVED, never guessed
    return raw

def bg_of(v):
    """background shorthand → colour, or None if gradient/image/none."""
    if v is None: return None
    if 'gradient' in v or 'url(' in v: return None
    return v.split()[0] if ' ' in v.strip() else v

def audit_surface(relpath, theme=':root'):
    path = os.path.join(PWA, relpath)
    nodes, consts = surface_tree(path, want_consts=True)
    pairs, unresolved, typ = [], [], []

    def bg_from(sd):
        raw = sd.get('backgroundColor') or bg_of(sd.get('background'))
        if raw is None: return ('none', None)
        if 'gradient' in str(raw) or 'url(' in str(raw): return ('image', None)
        rv = resolve_value(raw, consts, theme)
        if rv is None: return ('unresolved', str(raw)[:60])
        c = parse_color(rv)
        if c is None: return ('unresolved', str(rv)[:60])
        return ('ok', (c, rv))

    for n in nodes:
        sd, line, tag = n['style'], n['line'], n['tag']

        # effective background = nearest resolvable ancestor (or self) background
        chain = n['anc'] + [sd]
        eff, label, why = None, None, None
        for a in chain:
            kind, val = bg_from(a)
            if kind == 'ok':
                c, rv = val
                if c[3] >= 0.999: eff, label = (c[0], c[1], c[2]), rv
                else:
                    comp = composite(c, eff) if eff else None
                    if comp: eff, label = comp, rv
                    else: eff, label, why = None, None, f'alpha bg {rv} over unknown'
            elif kind == 'image': eff, label, why = None, None, 'ancestor background is a gradient/image'
            elif kind == 'unresolved': eff, label, why = None, None, f'ancestor background unresolved: {val}'

        fs = resolve_value(sd.get('fontSize'), consts, theme)
        fw = resolve_value(sd.get('fontWeight'), consts, theme)
        lh = resolve_value(sd.get('lineHeight'), consts, theme)
        fsn = None
        if fs:
            mm = re.fullmatch(r'([\d.]+)(px)?', str(fs))
            if mm: fsn = float(mm.group(1))
        fwn = 0
        if fw:
            mw = re.fullmatch(r'(\d+)', str(fw))
            if mw: fwn = int(mw.group(1))
        if fsn is not None: typ.append((line, tag, fsn, fwn, lh))

        craw = sd.get('color')
        if craw is None: continue
        rv = resolve_value(craw, consts, theme)
        c = parse_color(rv) if rv else None
        if c is None:
            unresolved.append((line, tag, f'text colour unresolved: {str(craw)[:60]}')); continue
        if eff is None:
            unresolved.append((line, tag, why or 'no ancestor background declared')); continue
        op = composite(c, eff)
        if op is None:
            unresolved.append((line, tag, 'alpha text over unknown background')); continue
        ratio = contrast(op, eff)
        large = bool(fsn and (fsn >= 24 or (fsn >= 18.66 and fwn >= 700)))
        req = 3.0 if large else 4.5
        pairs.append({'line': line, 'tag': tag, 'fg': rv, 'bg': label,
                      'fg_eff': '#%02X%02X%02X' % op, 'bg_eff': '#%02X%02X%02X' % eff,
                      'ratio': round(ratio, 2), 'req': req, 'size': fsn,
                      'weight': fwn, 'large': large, 'pass': ratio >= req})
    return pairs, unresolved, typ

# ─────────────────────────── drivers ───────────────────────────
def routes():
    out = []
    for root, dirs, files in os.walk(os.path.join(PWA, 'app')):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.next')]
        for f in files:
            if f in ('page.tsx','page.jsx','page.js'):
                out.append(os.path.relpath(os.path.join(root, f), PWA))
    return sorted(out)

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
    rs = routes()
    if mode == 'routes':
        for r in rs: print(r)
        print('TOTAL', len(rs))
    else:
        allpairs, allunres, alltyp = {}, {}, {}
        for r in rs:
            try:
                p, u, t = audit_surface(r)
            except Exception as e:
                allunres[r] = [(0,'-',f'PARSE FAILURE: {type(e).__name__}: {e}')]
                continue
            allpairs[r], allunres[r], alltyp[r] = p, u, t
        json.dump({'pairs': allpairs, 'unresolved': allunres, 'type': alltyp},
                  open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'census.json'),'w'), indent=1)
        np = sum(len(v) for v in allpairs.values())
        nf = sum(1 for v in allpairs.values() for x in v if not x['pass'])
        nu = sum(len(v) for v in allunres.values())
        print(f'surfaces={len(rs)} resolved_pairs={np} FAIL={nf} UNRESOLVED={nu}')
