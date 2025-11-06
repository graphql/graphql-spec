import { execFileSync } from "node:child_process";
import https from "node:https";

// ---------- flags / utils
const RAW_ARGS = process.argv.slice(2);
const DEBUG = RAW_ARGS.includes("--debug");
const logd = (...xs) => { if (DEBUG) console.error(...xs) };

const collator = new Intl.Collator("en", { sensitivity: "base" });
const cmp = (a, b) => collator.compare(a, b);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const toLower = (s) => (s || "").toLowerCase();
function die(msg, code = 1) { console.error(msg); process.exit(code) }

function normalizeName(s) {
  return (s || "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
function pickBetterName(current, candidate) {
  if (!current) return (candidate || "").trim();
  const c = current.trim();
  const d = (candidate || "").trim();
  if (!c && d) return d;
  const spaceC = /\s/.test(c), spaceD = /\s/.test(d);
  if (spaceD && !spaceC) return d;
  if (d.length > c.length) return d;
  return c;
}
function sanitizeDisplayName(raw, fallback) {
  const s = (raw || "").trim();
  if (!s) return fallback;
  if (/moved\s+to\s+@/i.test(s)) return fallback;
  if (/@/.test(s)) return fallback;
  if (/^\s*[-–—]+\s*$/.test(s)) return fallback;
  return s;
}

function parseArgs() {
  const args = RAW_ARGS.filter(x => x !== "--debug");
  if (args.length === 0) die("Usage: node scripts/generate-contributor-list.mjs <git-range> [-- <paths...>] [--debug]");
  const dd = args.indexOf("--");
  return { range: args[0], paths: dd === -1 ? [] : args.slice(dd + 1) };
}

function execGit(argv, opts = {}) {
  try {
    return execFileSync("git", argv, { encoding: "utf8", maxBuffer: 1024 * 1024 * 400, ...opts });
  } catch (e) {
    die(`git ${argv.join(" ")} failed: ${e.message}`);
  }
}
function repoNameWithOwner() {
  let url = "";
  try { url = execGit(["remote", "get-url", "origin"]).trim(); } catch { }
  const m = url.match(/github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/i);
  if (m?.groups) return `${m.groups.owner}/${m.groups.repo}`;
  die("Could not determine GitHub repo from 'origin' remote.");
}
function revList(range, paths) {
  const args = ["rev-list", range];
  if (paths.length) args.push("--", ...paths);
  const out = execGit(args);
  return out.split(/\r?\n/).filter(Boolean);
}
function parseCoAuthorLines(message) {
  const out = [];
  const re = /^[ \t]*Co-authored-by:\s*(.+?)\s*<([^>]+)>/gim;
  let m;
  while ((m = re.exec(message))) out.push({ name: m[1].trim(), email: m[2].trim() });
  return out;
}
function loginFromNoreply(email) {
  const m = email.toLowerCase().match(/^(?:\d+\+)?([a-z0-9-]+)@users\.noreply\.github\.com$/i);
  return m ? m[1] : "";
}
function candidateHandlesFromEmailAndName(email, name) {
  const cands = new Set();
  const local = email.split("@")[0];
  const bare = local.replace(/[._]/g, "");
  const bareNoDigits = bare.replace(/\d+$/, "");
  cands.add(bare); cands.add(bareNoDigits);
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0], last = parts[parts.length - 1];
    cands.add(`${first}${last}`);
    cands.add(`${first}-${last}`);
    cands.add(`${first}_${last}`);
    cands.add(`${first[0]}${last}`);
    if (last.length >= 3) cands.add(`${first}${last.slice(0, 3)}`);
  }
  const nameParts = name.split(/\s+/).filter(Boolean);
  if (nameParts.length >= 2) {
    const f = nameParts[0].replace(/[^A-Za-z0-9-]/g, "");
    const l = nameParts[nameParts.length - 1].replace(/[^A-Za-z0-9-]/g, "");
    if (f && l) {
      cands.add(`${f}${l}`);
      cands.add(`${f}-${l}`);
      cands.add(`${f[0]}${l}`);
    }
  }
  const q = name.match(/'([^']{1,39})'/); if (q) cands.add(q[1]);
  const p = name.match(/\(([^) ]{1,39})\)/); if (p) cands.add(p[1]);
  return Array.from(cands).filter(s => /^[A-Za-z0-9-]{2,39}$/.test(s));
}

// ---------- GraphQL
const REPO = repoNameWithOwner();
const [OWNER, NAME] = REPO.split("/");
function getToken() {
  const env = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  if (env) return env;
  try { return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim(); } catch { return ""; }
}
const TOKEN = getToken();
if (!TOKEN) console.error("Warning: no GITHUB_TOKEN/GH_TOKEN (or gh auth token). Resolution will be limited.");

async function graphql(query, variables) {
  const body = JSON.stringify(variables ? { query, variables } : { query });
  const options = {
    hostname: "api.github.com",
    path: "/graphql",
    method: "POST",
    headers: {
      "User-Agent": "contributors-table-graphql",
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };
  return await new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(data || "{}");
          if (json.errors && DEBUG) console.error("GraphQL errors:", JSON.stringify(json.errors, null, 2));
          resolve(json);
        } catch { resolve({}); }
      });
    });
    req.on("error", () => resolve({}));
    req.write(body);
    req.end();
  });
}

// Batch fetch commit author + message for SHAs; count primary-author occurrences per login
async function fetchCommitsByOidBatch(oids) {
  const out = new Map(); // oid -> { login | "", name, email, message }
  const authorCount = new Map(); // login -> # of primary authored commits in range
  const chunkSize = 40;
  for (let i = 0; i < oids.length; i += chunkSize) {
    const chunk = oids.slice(i, i + chunkSize);
    const fields = chunk.map((oid, idx) => `
      c${idx}: object(oid: "${oid}") {
        ... on Commit {
          message
          author { user { login } name email }
        }
      }`).join("\n");
    const q = `query($owner:String!, $name:String!) { repository(owner:$owner, name:$name) { ${fields} } }`;
    const res = await graphql(q, { owner: OWNER, name: NAME });
    const repo = res?.data?.repository || {};
    for (let idx = 0; idx < chunk.length; idx++) {
      const node = repo[`c${idx}`];
      if (!node) continue;
      const info = {
        login: node?.author?.user?.login || "",
        name: node?.author?.name || "",
        email: node?.author?.email || "",
        message: node?.message || "",
      };
      out.set(chunk[idx], info);
      const L = info.login;
      if (L) authorCount.set(L, (authorCount.get(L) || 0) + 1);
    }
  }
  return { commitInfo: out, authorCount };
}

// GraphQL user search helpers (users only)
async function searchUsersByNameExact(name) {
  if (!TOKEN) return "";
  const queryStr = `"${name.replace(/"/g, '\\"')}" in:name type:user`;
  const q = `query($q:String!){ search(type: USER, query: $q, first: 25) { nodes { ... on User { login name } } } }`;
  const r = await graphql(q, { q: queryStr });
  const nodes = r?.data?.search?.nodes ?? [];
  const target = normalizeName(name);
  for (const it of nodes) {
    if (!it?.login) continue;
    if (normalizeName(it.name || "") === target) return it.login;
  }
  return "";
}
async function searchUsersByLoginToken(token) {
  if (!TOKEN) return "";
  const q = `query($q:String!){ search(type: USER, query: $q, first: 5) { nodes { ... on User { login name } } } }`;
  const r = await graphql(q, { q: `${token} in:login type:user` });
  const items = r?.data?.search?.nodes ?? [];
  if (items.length === 1) return items[0]?.login || "";
  return "";
}
async function fetchProfileNames(logins) {
  const out = new Map();
  const chunkSize = 40;
  for (let i = 0; i < logins.length; i += chunkSize) {
    const chunk = logins.slice(i, i + chunkSize);
    const fields = chunk.map((login, idx) => `u${idx}: user(login: "${login}") { login name }`).join("\n");
    const q = `query { ${fields} }`;
    const r = await graphql(q);
    const data = r?.data || {};
    for (let idx = 0; idx < chunk.length; idx++) {
      const u = data[`u${idx}`];
      out.set(chunk[idx], (u?.name || "").trim());
    }
  }
  return out;
}

// ---------- main
async function main() {
  const { range, paths } = parseArgs();

  const shas = revList(range, paths);
  if (!shas.length) die("No commits in the specified range/path.");

  // 1) Commit info + primary author counts
  const { commitInfo, authorCount } = await fetchCommitsByOidBatch(shas);

  // 2) Collect authors and co-authors
  const loginBestName = new Map();     // login -> name hint
  const pool = [];                     // [{ name, email }] to resolve (co-authors + primaries with missing login)

  for (const sha of shas) {
    const info = commitInfo.get(sha);
    if (!info) continue;
    const { login, name, email, message } = info;

    if (login) {
      loginBestName.set(login, pickBetterName(loginBestName.get(login) || "", name));
    } else {
      const guess = loginFromNoreply(email);
      if (guess) loginBestName.set(guess, pickBetterName(loginBestName.get(guess) || "", name));
      else pool.push({ name, email });
    }
    for (const ca of parseCoAuthorLines(message)) pool.push(ca);
  }

  // 3) Resolve pool (GraphQL users search only)
  const emailToLogin = new Map(); // emailLower -> login
  const concurrency = 8;
  let idx = 0;

  async function worker() {
    while (idx < pool.length) {
      const i = idx++;
      const { name, email } = pool[i];
      const ekey = toLower(email);
      if (emailToLogin.has(ekey)) continue;

      let login = loginFromNoreply(email);
      if (!login) login = await searchUsersByNameExact(name);
      if (!login) {
        const cands = candidateHandlesFromEmailAndName(email, name);
        for (const cand of cands) {
          const solo = await searchUsersByLoginToken(cand);
          if (solo) { login = solo; break; }
        }
      }
      if (!login && DEBUG) logd(`Unresolved: "${name}" <${email}>`);
      emailToLogin.set(ekey, login || "");
      if (login) loginBestName.set(login, pickBetterName(loginBestName.get(login) || "", name));

      if (i % 10 === 0) await sleep(60);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  // 4) Build candidate rows (resolved only), fetch profile names
  const resolvedLogins = Array.from(loginBestName.keys());
  const profileNames = await fetchProfileNames(resolvedLogins);

  const candidates = resolvedLogins.map(login => {
    const prof = (profileNames.get(login) || "").trim();
    const hint = (loginBestName.get(login) || "").trim();
    const display = sanitizeDisplayName(prof || hint || login, prof || login);
    return { login, display, authorCommits: authorCount.get(login) || 0 };
  });

  // 5) Collapse duplicate people with the same display name
  const byDisplay = new Map(); // normName -> best candidate
  const score = (x) => (x.authorCommits > 0 ? 2 : 0) + (x.display.toLowerCase() !== x.login.toLowerCase() ? 1 : 0);
  for (const c of candidates) {
    const key = normalizeName(c.display);
    if (!byDisplay.has(key)) { byDisplay.set(key, c); continue; }
    const cur = byDisplay.get(key);
    if (score(c) > score(cur) || (score(c) === score(cur) && c.login.toLowerCase() < cur.login.toLowerCase())) {
      if (DEBUG) logd(`Collapsed duplicate "${c.display}": keeping ${c.login} over ${cur.login}`);
      byDisplay.set(key, c);
    }
  }
  const resolvedRows = Array.from(byDisplay.values())
    .filter((v, i, arr) => arr.findIndex(x => x.login.toLowerCase() === v.login.toLowerCase()) === i)
    .map(({ display, login }) => ({ name: display, gh: `[@${login}](https://github.com/${login})`, login }));

  // 6) Unmatched → show email (dedupe by name+email)
  const unmatched = [];
  const seenUnk = new Set();
  for (const { name, email } of pool) {
    const login = emailToLogin.get(toLower(email));
    if (login) continue;
    const nm = sanitizeDisplayName(name || "(Unknown)", name || "(Unknown)");
    const key = normalizeName(nm) + "|" + email.toLowerCase();
    if (seenUnk.has(key)) continue;
    seenUnk.add(key);
    unmatched.push({ name: nm, gh: email, login: "" });
  }

  // 7) Merge, sort, output
  const allRows = [...resolvedRows, ...unmatched];
  allRows.sort((a, b) => cmp(a.name, b.name));

  console.log("| Author | Github");
  console.log("| ----------------------------- | ---------------------------------");
  for (const r of allRows) {
    console.log(`| ${r.name} | ${r.gh}`);
  }
}

main().catch((e) => die(String(e)));
