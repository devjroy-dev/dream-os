# TDW · CE-47 · ADS-2 · THE SERVER CUT · dream-os · 2 October 2026

Base 6e43161. The server halves of the app cut that landed as dreamos-pwa 29c784ec.

## The funds
meta.adAccounts also reads funding_source_details. meta.fundsFrom (pure, exported) reads Meta's own line, "Available
balance (₹200.00 INR)", into { amount: 200, currency: 'INR' } (commas and paise kept: "₹1,200.50" is 1200.5; another
currency keeps its code). Anything else, a card ("Visa *4417") or no line, is null. gapsFrom puts funds on each
choose.accounts entry. The app draws "Funds: Rs …" only for INR.

## The rupee lock, server half (CE-47's ruling, 1 Oct 2026)
/prepare and /run refuse an account whose currency is known and not INR, right after the account is known and before
the account-facts read or any create call; /manage refuses a resume of an ad whose stored currency is not INR, before
Meta. The line: "TDW runs ads on rupee accounts for now." (code ADS_NOT_INR). A rupee account prepares as before.

## Proof
b144 97 pass, 0 fail (88 on the clean tip; 9 new): 8.1 and 8.2 the parser both ways; 8.3 the chooser's wire carries
funds for the prepaid account and null for the card; 8.4 a dollar account refused at /prepare and /run with the plain
line and no Meta call after; 8.5 a dollar ad cannot be resumed, nothing reaches Meta; 8.6 a rupee account still prepares.
M17 (the run lock removed), M18 (a card read as funds), M19 (the resume lock removed): each reds a child run, restored by
sha. The radius (every bench reading meta.js or vendor/ads.js) is b144 alone.

## A currency that is missing (CE-47's note, 3 Oct 2026)
The lock refuses only a currency that is present and not INR; an account with no currency passes. It stands because
Meta always returns a currency for an ad account (read in its /me/adaccounts answer); a missing one would be Meta's
fault, not a vendor's choice. If that ever shows, the lock is the place to close it.
