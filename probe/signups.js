// The upgrade is green: build passes, tests pass. Now run YESTERDAY's traffic through it.
// Same signups, the zod 3 schema (as it was on main) vs the migrated zod 4 schema (dist/).
// Run:  npm i --no-save zod3@npm:zod@3.25.76  &&  npm run build  &&  node probe/signups.js
const z3 = require("zod3");
const { parseSignup } = require("../dist/src");

// The schema exactly as it was on main (zod 3).
const Plan = { Free: "free", Pro: "pro", Team: "team" };
const Signup3 = z3.object({
  id: z3.string().uuid(),
  email: z3.string().email(),
  name: z3.string().min(1).max(80),
  age: z3.number().int().min(13).optional(),
  website: z3.string().url().optional(),
  ip: z3.string().ip(),
  plan: z3.nativeEnum(Plan),
  flags: z3.record(z3.boolean()),
  prefs: z3.object({
    theme: z3.enum(["light", "dark"]).default("light"),
    retries: z3.string().transform(Number).default("3"),
  }).default({}),
});

// Legacy ids: minted years ago by a home-grown generator — 32 random hex digits in
// UUID shape. They never set the RFC 4122 version/variant bits. Seeded, so this is reproducible.
let seed = 20260918;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
const hex = (n) => Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(rnd() * 16)]).join("");
const legacyId = () => `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)}`;

const names = ["Ada", "Grace", "Linus", "Margaret", "Ken", "Barbara", "Dennis", "Radia", "Tim", "Hedy", "Alan", "Katherine"];
const signups = names.map((name, i) => ({
  id: legacyId(),
  email: `${name.toLowerCase()}@example.com`,
  name,
  ip: i === 4 ? "fe80::1%eth0" : `10.0.${i}.7`,          // one office host on link-local IPv6 with a zone id
  plan: ["free", "pro", "team"][i % 3],
  flags: { beta: i % 2 === 0 },
}));

let ok3 = 0, ok4 = 0;
console.log("signup                                     zod 3     zod 4");
for (const s of signups) {
  const a = Signup3.safeParse(s).success;
  const r = parseSignup(s);
  const b = r.ok;
  ok3 += a; ok4 += b;
  const why = b ? "" : "   ← " + r.problems[0];
  console.log(`${s.name.padEnd(10)} ${s.id}   ${a ? "ok  " : "FAIL"}      ${b ? "ok" : "FAIL"}${why}`);
}
console.log(`\nzod 3 accepted ${ok3}/${signups.length}.  zod 4 accepts ${ok4}/${signups.length}.  The build is green. The tests are green.`);
