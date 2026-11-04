/*
  Accounts for the prototype. Everything lives in this browser:
  - email + password accounts are real here (the password is stored only as a salted SHA-256 hash);
  - "Continue with Google" runs the same flow without contacting Google (production needs OAuth on a server,
    e.g. Supabase Auth or Firebase Auth).
  Storage can be blocked (private mode): every read/write is guarded and the app keeps working in memory.
*/

export type User = {
  id: string
  name: string
  username: string
  email: string
  provider: "password" | "google"
  createdAt: string
}

type StoredUser = User & { salt?: string; hash?: string }

const USERS = "agora.users"
const SESSION = "agora.session"

let memoryUsers: StoredUser[] = []
let memorySession: string | null = null

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS) ?? "[]") as StoredUser[]
  } catch {
    return memoryUsers
  }
}
function writeUsers(list: StoredUser[]) {
  memoryUsers = list
  try {
    localStorage.setItem(USERS, JSON.stringify(list))
  } catch {
    /* memory only */
  }
}

export function sessionUser(): User | null {
  let id = memorySession
  try {
    id = localStorage.getItem(SESSION) ?? id
  } catch {
    /* memory only */
  }
  const u = readUsers().find((x) => x.id === id)
  return u ? strip(u) : null
}
function setSession(id: string | null) {
  memorySession = id
  try {
    if (id) localStorage.setItem(SESSION, id)
    else localStorage.removeItem(SESSION)
  } catch {
    /* memory only */
  }
}

function strip(u: StoredUser): User {
  const { salt: _s, hash: _h, ...rest } = u
  return rest
}

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())
/** Latin letters, digits, dot and underscore, 3–20 chars: safe in links and @mentions. */
export const usernameOk = (u: string) => /^[a-z0-9._]{3,20}$/.test(u)
export const normalizeUsername = (u: string) => u.trim().toLowerCase().replace(/^@/, "")

export function usernameTaken(u: string, exceptId?: string) {
  return readUsers().some((x) => x.username === normalizeUsername(u) && x.id !== exceptId)
}

export type AuthError = "email_taken" | "username_taken" | "bad_credentials" | "no_account" | "weak_password" | "bad_email" | "bad_username" | "bad_name"

export const authErrorCopy: Record<AuthError, string> = {
  email_taken: "כבר יש חשבון עם האימייל הזה. אפשר להתחבר אליו.",
  username_taken: "שם המשתמש הזה תפוס. נסו שם אחר.",
  bad_credentials: "האימייל או הסיסמה לא נכונים.",
  no_account: "לא מצאנו חשבון עם האימייל הזה. אפשר להירשם.",
  weak_password: "הסיסמה צריכה לפחות 8 תווים.",
  bad_email: "האימייל לא נראה תקין. בדקו שוב.",
  bad_username: "שם משתמש: 3 עד 20 תווים, באותיות אנגליות, ספרות, נקודה או קו תחתון.",
  bad_name: "כתבו שם להצגה, לפחות 2 תווים.",
}

export async function signUp(input: { name: string; username: string; email: string; password: string }): Promise<User | AuthError> {
  const name = input.name.trim()
  const username = normalizeUsername(input.username)
  const email = input.email.trim().toLowerCase()
  if (name.length < 2) return "bad_name"
  if (!usernameOk(username)) return "bad_username"
  if (!emailOk(email)) return "bad_email"
  if (input.password.length < 8) return "weak_password"
  const users = readUsers()
  if (users.some((u) => u.email === email)) return "email_taken"
  if (users.some((u) => u.username === username)) return "username_taken"
  const salt = newId()
  const user: StoredUser = { id: newId(), name, username, email, provider: "password", createdAt: new Date().toISOString(), salt, hash: await hashPassword(input.password, salt) }
  writeUsers([...users, user])
  setSession(user.id)
  return strip(user)
}

export async function signIn(emailRaw: string, password: string): Promise<User | AuthError> {
  const email = emailRaw.trim().toLowerCase()
  if (!emailOk(email)) return "bad_email"
  const u = readUsers().find((x) => x.email === email)
  if (!u) return "no_account"
  if (u.provider !== "password" || !u.salt || (await hashPassword(password, u.salt)) !== u.hash) return "bad_credentials"
  setSession(u.id)
  return strip(u)
}

/** Google step 1 (prototype): no network; the profile is completed by completeGoogle(). */
export function googleSession(): { pending: true } {
  return { pending: true }
}

export function completeGoogle(input: { name: string; username: string }): User | AuthError {
  const name = input.name.trim()
  const username = normalizeUsername(input.username)
  if (name.length < 2) return "bad_name"
  if (!usernameOk(username)) return "bad_username"
  const users = readUsers()
  if (users.some((u) => u.username === username)) return "username_taken"
  const user: StoredUser = { id: newId(), name, username, email: "", provider: "google", createdAt: new Date().toISOString() }
  writeUsers([...users, user])
  setSession(user.id)
  return strip(user)
}

export function updateProfile(id: string, patch: { name: string; username: string }): User | AuthError {
  const name = patch.name.trim()
  const username = normalizeUsername(patch.username)
  if (name.length < 2) return "bad_name"
  if (!usernameOk(username)) return "bad_username"
  if (usernameTaken(username, id)) return "username_taken"
  const users = readUsers().map((u) => (u.id === id ? { ...u, name, username } : u))
  writeUsers(users)
  const u = users.find((x) => x.id === id)
  return u ? strip(u) : "no_account"
}

export function signOut() {
  setSession(null)
}

/** A friendly default handle from a display name (Latin only; Hebrew names start empty). */
export function suggestUsername(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 16)
  return base.length >= 3 ? base : ""
}
