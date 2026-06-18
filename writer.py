#!/usr/bin/env python3
# Piece 1c-weld (dream-os) — re-route the bride↔vendor pipe into binders.
#
# A couple's enquiry now opens a BINDER on the vendor (via Kriya's hands) instead
# of writing the old typed `leads` row. couple_enquiries.vendor_lead_id keeps a
# valid pointer (now a binder id; it was never a hard FK to leads). One ledger:
# an enquiry logged by a bride and one logged by the vendor land in the same shape.
#
# Drops:  src/lib/vendor/enquiryBinder.js  (the weld helper, dedupe-by-phone)
# Rewires: src/api/couple/enquire.js  — createLead → enquiryToBinder
#
# leads.js / createLead are LEFT IN PLACE (other readers still use them until the
# read-surface piece moves; this only changes where NEW enquiries land).
# Anchor-guarded + idempotent.

import base64, os, sys
ROOT = os.getcwd()

HELPER_B64 = "Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSACi8vIHNyYy9saWIvdmVuZG9yL2VucXVpcnlCaW5kZXIuanMKLy8gVGhlIFdFTEQ6IGEgYnJpZGUgZW5xdWlyeSBiZWNvbWVzIGEgYmluZGVyIG9uIHRoZSB2ZW5kb3Ig4oCUIHRoZSB2ZW5kb3LihpRicmlkZQovLyBwaXBlIG5vdyBmbG93cyB0aHJvdWdoIHRoZSBuZXcgbGVkZ2VyLCBub3QgdGhlIG9sZCB0eXBlZCBgbGVhZHNgIHRhYmxlLgovLwovLyBNaXJyb3JzIGNyZWF0ZUxlYWQncyBjb250cmFjdCAoZGVkdXBlIGJ5IHBob25lOyByZXR1cm4geyBiaW5kZXIsIGRlZHVwZWQgfSkKLy8gc28gY291cGxlL2VucXVpcmUuanMgc3dhcHMgY2xlYW5seSBhbmQgY291cGxlX2VucXVpcmllcy52ZW5kb3JfbGVhZF9pZCBrZWVwcwovLyBhIHZhbGlkIHBvaW50ZXIgKG5vdyBhIGJpbmRlciBpZDsgdGhlIGNvbHVtbiB3YXMgbmV2ZXIgYSBoYXJkIEZLIHRvIGxlYWRzKS4KLy8KLy8gVXNlcyBLcml5YSdzIGJpbmRlciBoYW5kcyBkaXJlY3RseSDigJQgc2FtZSBwcmltaXRpdmVzIE15cmEgZHJpdmVzIOKAlCBzbyBhbgovLyBlbnF1aXJ5IGxvZ2dlZCBieSBhIGJyaWRlIGFuZCBhbiBlbnF1aXJ5IGxvZ2dlZCBieSB0aGUgdmVuZG9yIGxhbmQgaW4gdGhlCi8vIFNBTUUgc2hhcGUsIGluIHRoZSBTQU1FIGNhYmluZXQuIE9uZSBsZWRnZXIsIHR3byBkb29ycyBpbi4KJ3VzZSBzdHJpY3QnOwoKY29uc3QgeyBleGVjdXRlS3JpeWFUb29sIH0gPSByZXF1aXJlKCcuLi8uLi9hZ2VudC9rcml5YVByaW1pdGl2ZXMnKTsKCi8vIENyZWF0ZSAob3IgZmluZCkgYSBiaW5kZXIgZm9yIGFuIGluYm91bmQgZW5xdWlyeSBvbiB0aGlzIHZlbmRvci4KLy8gICBzdXBhYmFzZSwgdmVuZG9ySWQsIHsgbmFtZSwgcGhvbmUsIG5vdGUsIGRhdGUgfQovLyBSZXR1cm5zIHsgb2ssIGJpbmRlcjogeyBpZCB9LCBkZWR1cGVkIH0uCmFzeW5jIGZ1bmN0aW9uIGVucXVpcnlUb0JpbmRlcihzdXBhYmFzZSwgdmVuZG9ySWQsIHBhcmFtcykgewogIGNvbnN0IHsgbmFtZSwgcGhvbmUsIG5vdGUsIGRhdGUgfSA9IHBhcmFtcyB8fCB7fTsKCiAgLy8gRGVkdXBlIGJ5IHBob25lIOKAlCB0aGUgYmluZGVyIGVxdWl2YWxlbnQgb2YgY3JlYXRlTGVhZCdzIHBob25lIGNoZWNrLgogIGlmIChwaG9uZSkgewogICAgY29uc3QgeyBkYXRhOiBleGlzdGluZyB9ID0gYXdhaXQgc3VwYWJhc2UKICAgICAgLmZyb20oJ2JpbmRlcnMnKQogICAgICAuc2VsZWN0KCdpZCcpCiAgICAgIC5lcSgndmVuZG9yX2lkJywgdmVuZG9ySWQpCiAgICAgIC5lcSgncGhvbmUnLCBwaG9uZSkKICAgICAgLmVxKCdoaWRkZW4nLCBmYWxzZSkKICAgICAgLmxpbWl0KDEpCiAgICAgIC5tYXliZVNpbmdsZSgpOwogICAgaWYgKGV4aXN0aW5nKSB7CiAgICAgIC8vIEFwcGVuZCBhIGxpbmUgdG8gdGhlIG5vdGUgc28gdGhlIHJlcGVhdCBlbnF1aXJ5IGlzIG9uIHJlY29yZCwgYnV0IGRvbid0CiAgICAgIC8vIG9wZW4gYSBkdXBsaWNhdGUgYmluZGVyLgogICAgICBpZiAobm90ZSkgewogICAgICAgIGF3YWl0IGV4ZWN1dGVLcml5YVRvb2woc3VwYWJhc2UsIHZlbmRvcklkLCAna3JpeWFfbm90ZV9hcHBlbmQnLCB7IGJpbmRlcl9pZDogZXhpc3RpbmcuaWQsIG5vdGUgfSk7CiAgICAgIH0KICAgICAgcmV0dXJuIHsgb2s6IHRydWUsIGJpbmRlcjogZXhpc3RpbmcsIGRlZHVwZWQ6IHRydWUgfTsKICAgIH0KICB9CgogIC8vIE9wZW4gYSBmcmVzaCBiaW5kZXI6IGNsaWVudCBmaXJzdCAob3BlbnMgaXQpLCB0aGVuIGF0dGFjaCB0aGUgcmVzdCBieSBpZC4KICBjb25zdCBvcGVuZWQgPSBhd2FpdCBleGVjdXRlS3JpeWFUb29sKHN1cGFiYXNlLCB2ZW5kb3JJZCwgJ2tyaXlhX2NsaWVudCcsIHsKICAgIGNsaWVudDogbmFtZSB8fCAnRHJlYW0gV2VkZGluZyBlbnF1aXJ5JywKICB9KTsKICBjb25zdCBiaW5kZXJJZCA9IG9wZW5lZC5iaW5kZXJfaWQ7CiAgaWYgKCFiaW5kZXJJZCkgcmV0dXJuIHsgb2s6IGZhbHNlLCBlcnJvcjogb3BlbmVkLmRpc3BsYXkgfHwgJ2NvdWxkIG5vdCBvcGVuIGJpbmRlcicgfTsKCiAgaWYgKHBob25lKSBhd2FpdCBleGVjdXRlS3JpeWFUb29sKHN1cGFiYXNlLCB2ZW5kb3JJZCwgJ2tyaXlhX3Bob25lJywgeyBiaW5kZXJfaWQ6IGJpbmRlcklkLCBwaG9uZSB9KTsKICBpZiAoZGF0ZSkgIGF3YWl0IGV4ZWN1dGVLcml5YVRvb2woc3VwYWJhc2UsIHZlbmRvcklkLCAna3JpeWFfZGF0ZScsICB7IGJpbmRlcl9pZDogYmluZGVySWQsIGRhdGUgfSk7CiAgaWYgKG5vdGUpICBhd2FpdCBleGVjdXRlS3JpeWFUb29sKHN1cGFiYXNlLCB2ZW5kb3JJZCwgJ2tyaXlhX25vdGUnLCAgeyBiaW5kZXJfaWQ6IGJpbmRlcklkLCBub3RlIH0pOwogIC8vIEV2ZXJ5IGluYm91bmQgZW5xdWlyeSBlbnRlcnMgYXMgYSBMRUFEIOKAlCBuZXZlciBhIGNsaWVudCB1bnRpbCB0aGUgb3duZXIgc2F5cyBzby4KICBhd2FpdCBleGVjdXRlS3JpeWFUb29sKHN1cGFiYXNlLCB2ZW5kb3JJZCwgJ2tyaXlhX3N0YWdlJywgeyBiaW5kZXJfaWQ6IGJpbmRlcklkLCBzdGFnZTogJ2xlYWQnIH0pOwoKICByZXR1cm4geyBvazogdHJ1ZSwgYmluZGVyOiB7IGlkOiBiaW5kZXJJZCB9LCBkZWR1cGVkOiBmYWxzZSB9Owp9Cgptb2R1bGUuZXhwb3J0cyA9IHsgZW5xdWlyeVRvQmluZGVyIH07Cg=="

OLD_REQUIRE = "const { createLead }   = require('../../lib/vendor/leads');"
NEW_REQUIRE = ("const { createLead }   = require('../../lib/vendor/leads');\n"
               "const { enquiryToBinder } = require('../../lib/vendor/enquiryBinder');  // weld: enquiries → binders")

OLD_CALL = """    const leadRes = await createLead(supabase, vendor.id, {
      name:        bride_name || 'Dream Wedding enquiry',
      phone:       bride_phone || null,
      source:      'discover',
      raw_message: `${bride_name || 'A bride'} enquired via the Discover feed on The Dream Wedding.`,
    });
    vendorLeadId = leadRes?.lead?.id || null;"""

NEW_CALL = """    const binderRes = await enquiryToBinder(supabase, vendor.id, {
      name:  bride_name || 'Dream Wedding enquiry',
      phone: bride_phone || null,
      note:  `${bride_name || 'A bride'} enquired via the Discover feed on The Dream Wedding.`,
    });
    vendorLeadId = binderRes?.binder?.id || null;"""

def expect():
    if not os.path.isdir(os.path.join(ROOT, "src", "api", "couple")):
        print("ERROR: run from dream-os repo root. Aborting."); sys.exit(1)

def main():
    expect()
    # 1. drop the helper
    helper = os.path.join(ROOT, "src", "lib", "vendor", "enquiryBinder.js")
    open(helper, "wb").write(base64.b64decode(HELPER_B64))
    print("OK: wrote src/lib/vendor/enquiryBinder.js")

    # 2. rewire enquire.js
    path = os.path.join(ROOT, "src", "api", "couple", "enquire.js")
    if not os.path.isfile(path):
        print("SKIP: enquire.js not found."); return
    s = open(path, encoding="utf-8").read()
    if "enquiryToBinder" in s:
        print("SKIP: enquire.js already routes to binders."); return
    if OLD_REQUIRE in s:
        s = s.replace(OLD_REQUIRE, NEW_REQUIRE, 1); print("OK: added enquiryToBinder require.")
    else:
        print("SKIP: require anchor not found — add by hand.")
    if OLD_CALL in s:
        s = s.replace(OLD_CALL, NEW_CALL, 1); print("OK: swapped createLead → enquiryToBinder.")
    else:
        print("SKIP: createLead call anchor not found — swap by hand.")
    open(path, "w", encoding="utf-8").write(s)
    print("\nPiece 1c-weld written. New enquiries land as binders; leads.js left intact for other readers.")

if __name__ == "__main__":
    main()
