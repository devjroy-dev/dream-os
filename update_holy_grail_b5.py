p = 'docs/DEVS_HOLY_GRAIL.md'
with open(p) as f: c = f.read()

c = c.replace(
    "| Bride B-5 | dream-os | ⬜ Next — start here |",
    "| Bride B-5 | dream-os | ✅ Done |"
)
c = c.replace(
    "| Bride B-6 | dreamos-pwa | ⬜ Wire DreamAI canvas |",
    "| Bride B-6 | dreamos-pwa | ⬜ Next — start here |"
)
c = c.replace(
    "**Last updated:** 2026-05-22 (B-4 extended — Circle scrapbook + My People + member feed + Moments placeholder + journey CRUD + dreamai/frost text selection fix + light mode contrast)",
    "**Last updated:** 2026-05-22 (B-5 complete — POST /couple/chat SSE bridge to brideEngine. Haiku, word-by-word streaming, couple_self conversation, history persisted.)"
)

with open(p, 'w') as f: f.write(c)
print("Holy Grail updated.")
