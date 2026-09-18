// Same schema, same inputs, zod 3 vs zod 4. Which verdicts changed — WITHOUT a compile error?
// Run:  npm i --no-save zod3@npm:zod@3.25.76   &&   node probe/compare.js
const z3 = require("zod3");
const z4 = require("zod");

const CASES = [
  ["z.string().uuid()", (z) => z.string().uuid(), [
    "9b2c4e6a-1f3d-4b8e-9c7a-2d5e8f1a3b6c",
    "00000000-0000-0000-0000-000000000000",
    "9b2c4e6a-1f3d-0b8e-9c7a-2d5e8f1a3b6c",
    "9b2c4e6a-1f3d-4b8e-fc7a-2d5e8f1a3b6c",
    "9B2C4E6A-1F3D-4B8E-9C7A-2D5E8F1A3B6C",
    "9b2c4e6a1f3d4b8e9c7a2d5e8f1a3b6c",
  ]],
  ["z.string().email()", (z) => z.string().email(), [
    "ada@example.com", "ada+tag@example.com", "ada@localhost", "\"ada lovelace\"@example.com",
    "ada@[127.0.0.1]", "ADA@EXAMPLE.COM", "ada..b@example.com", "ada.@example.com", ".ada@example.com",
    "ada@sub.example.co.uk", "ada@example", "ada@-example.com", "üser@example.de", "ada@exämple.de",
    "a@b.c", "ada@example.com.", " ada@example.com", "ada@example.c", "ada!#$%&'*@example.com",
  ]],
  ["z.string().url()", (z) => z.string().url(), [
    "https://example.com", "http://localhost:3000", "ftp://files.example.com", "mailto:ada@example.com",
    "example.com", "www.example.com", "https://example", "https://exa mple.com", "javascript:alert(1)",
    "http://[::1]:8080/x", "https://example.com/path?q=1#frag", "HTTPS://EXAMPLE.COM", "https://例え.jp",
  ]],
  ["ip: v3 .ip()  vs  v4 union(ipv4, ipv6)", (z, v) => (v === 3 ? z.string().ip() : z.union([z.ipv4(), z.ipv6()])), [
    "10.0.0.7", "256.1.1.1", "::1", "2001:db8::1", "1.2.3", "01.2.3.4", "::ffff:10.0.0.7", "10.0.0.7/24", "fe80::1%eth0",
  ]],
  ["z.number()", (z) => z.number(), [1, 1.5, Infinity, -Infinity, NaN, "1", 1e309, -0]],
  ["z.number().int()", (z) => z.number().int(), [1, 2 ** 53, 2 ** 53 + 2, 1e21, 9007199254740993, -0]],
  ["z.string().datetime()", (z) => z.string().datetime(), [
    "2026-09-18T10:00:00Z", "2026-09-18T10:00:00.123Z", "2026-09-18T10:00:00+05:30", "2026-09-18 10:00:00Z",
    "2026-09-18T10:00Z", "2026-13-01T00:00:00Z", "2026-02-30T00:00:00Z", "2026-09-18T24:00:00Z",
  ]],
  ["z.coerce.number()", (z) => z.coerce.number(), ["", " ", "0x10", "1e3", null, true, [], "12px", undefined]],
  ["z.string().max(1)  (length rules)", (z) => z.string().max(1), ["a", "é", "é", "😀", "👨‍👩‍👧"]],
  ["object.default({}) with inner defaults", (z) => z.object({ theme: z.enum(["light", "dark"]).default("light") }).default({}), [undefined]],
  ["z.enum([...])", (z) => z.enum(["light", "dark"]), ["light", "LIGHT", "Light ", ""]],
  ["z.boolean()", (z) => z.boolean(), [true, "true", 1, 0]],
  ["z.object({a: number}) strips unknown keys", (z) => z.object({ a: z.number() }), [{ a: 1, b: 2 }, { a: 1, toString: 5 }]],
];

const show = (v) => (v === undefined ? "undefined" : typeof v === "number" ? String(v) : JSON.stringify(v));
const verdict = (r) => (r.success ? "ok " + show(r.data) : "FAIL");

let changed = 0, total = 0;
for (const [label, make, inputs] of CASES) {
  const s3 = make(z3, 3), s4 = make(z4, 4);
  const rows = [];
  for (const x of inputs) {
    total++;
    const a = verdict(s3.safeParse(x)), b = verdict(s4.safeParse(x));
    if (a !== b) { changed++; rows.push([show(x), a, b]); }
  }
  if (rows.length) {
    console.log(`\n${label}`);
    for (const [x, a, b] of rows) console.log(`  ${x.padEnd(44)} v3: ${a.padEnd(16)} v4: ${b}`);
  }
}
console.log(`\n${changed} of ${total} inputs get a DIFFERENT answer from zod 4 — and none of these were compile errors.`);
