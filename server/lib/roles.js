import { SELECTABLE_ROLES } from "../../shared/roles.js";

const ALLOWED = new Set(SELECTABLE_ROLES);

const LEGACY = {
  user: "User",
  USER: "User",
  admin: "Admin",
  vip: "Vip",
  owner: "Owner",
  known_red: "known",
};

export const ALLOWED_ROLES = Array.from(ALLOWED);
const HIERARCHY = [
  "Owner",
  "Admin",
  "OG",
  "COMBOSS",
  "RUNNERUP",
  "Vip",
  "Known",
  "known",
  "User",
];
const ROLE_WEIGHT = new Map(HIERARCHY.map((role, index) => [role, index]));

function normalizeToken(input) {
  const s = String(input || "").trim();
  if (ALLOWED.has(s)) return s;
  return LEGACY[s] || s;
}

/** Parse JSON roles from DB, fallback to single tag. */
export function parseRoles(rolesText, tagFallback) {
  if (rolesText) {
    try {
      const arr = JSON.parse(rolesText);
      if (Array.isArray(arr) && arr.length) {
        const out = arr.map((r) => normalizeToken(r)).filter((r) => ALLOWED.has(r));
        if (out.length) return out;
      }
    } catch {
      /* fall through */
    }
  }
  const t = normalizeToken(tagFallback || "User");
  return ALLOWED.has(t) ? [t] : ["User"];
}

export function serializeRoles(roles) {
  const out = [];
  const seen = new Set();
  for (const r of roles || []) {
    const n = normalizeToken(r);
    if (ALLOWED.has(n) && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  if (out.length === 0) out.push("User");
  return JSON.stringify(out);
}

export function validateRoleList(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return { ok: false, error: "At least one role is required" };
  }
  const out = [];
  const seen = new Set();
  for (const r of roles) {
    const n = normalizeToken(r);
    if (!ALLOWED.has(n)) {
      return { ok: false, error: "Invalid role" };
    }
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  if (out.length === 0) {
    return { ok: false, error: "At least one role is required" };
  }
  return { ok: true, json: JSON.stringify(out) };
}

export function getTopRole(roles) {
  const list = Array.isArray(roles) && roles.length ? roles : ["User"];
  return list
    .slice()
    .sort((a, b) => (ROLE_WEIGHT.get(a) ?? 999) - (ROLE_WEIGHT.get(b) ?? 999))[0];
}

export function sortUsersByHierarchy(users) {
  return users.slice().sort((a, b) => {
    const aRole = getTopRole(a.roles);
    const bRole = getTopRole(b.roles);
    const rank = (ROLE_WEIGHT.get(aRole) ?? 999) - (ROLE_WEIGHT.get(bRole) ?? 999);
    if (rank !== 0) return rank;
    return String(a.username || "").localeCompare(String(b.username || ""));
  });
}

export { normalizeToken, ALLOWED };
