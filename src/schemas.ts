import { z } from "zod";

export enum Plan {
  Free = "free",
  Pro = "pro",
  Team = "team",
}

/** An IP address, v4 or v6 (zod 4 split the old `z.string().ip()` into two schemas). */
const Ip = z.union([z.ipv4(), z.ipv6()]);

/** A new account, as posted by the signup form. */
export const Signup = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().min(1).max(80),
  age: z.number().int().min(13).optional(),
  website: z.url().optional(),
  ip: Ip,
  plan: z.enum(Plan),
  /** feature flags, e.g. { beta: true } */
  flags: z.record(z.string(), z.boolean()),
  prefs: z
    .object({
      theme: z.enum(["light", "dark"]).default("light"),
      /** comes in as a string from the form; stored as a number */
      retries: z.string().transform(Number).prefault("3"),
    })
    // `.prefault` takes the *input* shape and runs it through parsing, so the
    // inner defaults are applied (zod 4's `.default` expects the output shape).
    .prefault({}),
});
export type Signup = z.infer<typeof Signup>;

/** Service config, usually read from environment variables (so: strings). */
export const Config = z.object({
  port: z.string().transform(Number).prefault("8080"),
  hosts: z.array(Ip).min(1),
  timeoutMs: z.number().positive().default(5000),
});
export type Config = z.infer<typeof Config>;

/** A webhook handler: (event, payloadBytes) => void, checked at the boundary. */
export const Hook = z.function({
  input: [z.string(), z.number()],
  output: z.void(),
});
