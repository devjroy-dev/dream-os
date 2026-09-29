# CE-46 · ELZ-4 · LAYER A2 · F-44.250 · THE PRICE GUARD WITH THE SWITCH OFF · HANDOVER

Built on 1ed3847 (layer A landed, walked 30 September 2026). The chair minted F-44.250 from the walk and ruled cure (a) the same day, with
the founder's sentence and the P1 (a) fold.

## 0 · The finding (the walk's rows, DEV440, Sarah 9625759924)

With the switch ON, S1 (04:03:33) and S2 (04:04:33) went out verbatim. The switch went OFF at about 04:04:56 and was honoured in code on the
next turn (no price_state offered or called after it). But at 04:05:15 and 04:06:22 she wrote "Packages start from Rs 60,000 for
photography, and Rs 80,000 for photographs and film together..." : her own earlier replies, read back from the thread history and
recombined. The guard ran only when the switch was on, so with it off a figure already in the thread (or one the model invents) was stopped
only by the prompt. Not a delay: the switch is read fresh every turn.

## 1 · What ships (6 paths)

src/lib/vendor/couplePriceState.js · priceGuard runs in two modes and names its mode. ON: unchanged (rate_min, a quoted matched total, the
client's own figures pass). OFF, or no starting price: only the client's own figures pass. S0, the founder's words: "The price depends on your
date and what you need, so {studio} will confirm it with you. When is your event?" (offSentence). figuresIn also reads a bare comma-grouped
amount ("60,000", "1,50,000") as a figure. P1 (a) FOLDED: a trailing plural "s" is folded on both sides (not "ss"), so "photograph and films"
names "Photographs and film"; a package is still named only when exactly one fits (a tie is S1).

src/agent/engine.js · the guard runs on EVERY turn: a refused reply becomes S1 with the switch on, S0 with it off; the log line names the
mode (`[couple-agent] price guard (switch off) refused [60000,80000]; S0 sent instead`); the audit row carries mode. Off, the prompt and
the tools are still F-44.230's, byte for byte (b142d 2.1, 3.1).

scripts/b142d · 36 cells, --mutate 11. New: 1.13 the fold (the walk's 04:04:02 words), 1.14 a fold tie gives S1, 1.15 a bare "60,000",
1.16 S0; 3.9 THE WALK'S EXACT THREAD (S1 and S2 in her history, switch off, her 04:05:15 reply refused as [60000,80000], S0 sent, no price
tool); 3.10 her budget passes with the switch off; 3.11 a figure-free reply untouched. RE-AIMED by label: 1.12 and 3.7 (they pinned "off: the
guard does not run", the defect); 1.10 re-pinned (its answer names the mode). Mutations: M1 and M6 re-anchored; M8 (F-44.250 undone), M9
(the fold removed), M10 (S1 instead of S0 when off), M11 (bare amounts unread) new.

scripts/b115 · runCoupleAgenticTurn re-pinned by label (6), 539a9aa9d2b83922 to 0dc4fae4b3232d5e (b115's own body() reproduces the old pin
at 1ed3847); cap 990 unchanged (964 lines).

## 2 · Proof (ELZ-4's container, engine built, keys unset)

BOTH WAYS: this b142d on a clean 1ed3847 reads 28/36, red on exactly 1.10, 1.12, 1.13, 1.14, 1.15, 1.16, 3.7, 3.9; green there on 3.10 and
3.11 (today holds). Cured 36/36; --mutate 11/11, every file restored by sha256. SHIFTED CLOCKS (1 October 2026 IST, 31 December 2027 23:50
IST, 29 February 2028): b142d 36/36, b115 25/25.
THE DIFFERENTIAL, a clean worktree of 1ed3847 against this layer, one bench at a time, dirt checked after each (zero both sides):
- the 28 direct readers (engine.js, couplePriceState.js, b142d): exits identical; cells identical but b142d (29 to 36); output differs only
  in b142d;
- the 78 benches reading the files that call the couple turn (index.js, vendorInbound, ownNumber/turn, relayToCouple, enquiryAlert,
  closerSoul), beyond the direct set: exits and cells identical; output differs only in b08_p5_closer_scenarios' transcript path and time;
  the named base's reds (b05_arc_m4, b05_arc_m6, b05_p4_crons, b07_p5, b08_p5_oow_relay, b10_p2_bridge, b39_telemetry, b59_g34_reminders)
  byte-identical both sides.

## 3 · The walk (DEV440, Sarah 9625759924, on the shared line)

The walk rebuilds the thread's history itself rather than trusting the session window. Switch ON. Sarah: "How much do you charge?" gives S1
(Rs 60,000). Sarah: "How much for photograph and films" gives S2 (Rs 80,000; the fold, which gave S1 on 30 September). Switch OFF. Sarah:
"How much do you charge?" gives S0 exactly, and Railway logs `price guard (switch off) refused [...]` if she reached for a figure. Sarah:
"Our budget is 2 lakh" is not refused (her own figure). DEV440 ends as W0 found it (60000, false).

## 4 · Disclosed

No paid run. W-1: elizaSoul.js and listenerDoor.js unmoved. OFF, S0 replaces the WHOLE reply (the ruling: one fixed sentence), so a date
answer in the same reply is lost on that turn; she asks "When is your event?" in its place. A bare comma-grouped number the model writes that
is not money (say "1,000 guests" unprompted) is now refused too; one the client wrote passes.
