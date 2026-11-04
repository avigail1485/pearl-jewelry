import { useEffect, useState, type FormEvent } from "react"
import { ArrowRight, Check, Eye, EyeOff, Loader2, Mail } from "lucide-react"
import {
  authErrorCopy, completeGoogle, normalizeUsername, signIn, signUp, suggestUsername, usernameOk, usernameTaken, type AuthError, type User,
} from "../../data/auth"
import { useNav } from "../../nav"
import Sheet from "../ui/Sheet"
import Button from "../ui/Button"
import Field, { inputCls } from "../ui/Field"
import Illustration from "../ui/Illustration"

type Step = "choose" | "email" | "google" | "complete"

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function UsernameField({ value, onChange, error, selfId }: { value: string; onChange: (v: string) => void; error?: string; selfId?: string }) {
  const u = normalizeUsername(value)
  const status = !u ? "" : !usernameOk(u) ? "invalid" : usernameTaken(u, selfId) ? "taken" : "free"
  return (
    <Field
      label="שם משתמש"
      htmlFor="auth-username"
      error={error}
      hint={status === "free" ? "פנוי" : status === "taken" ? "תפוס, נסו שם אחר" : "יופיע בפרופיל שלכם, באנגלית: אותיות, ספרות, נקודה או קו תחתון"}
    >
      <div dir="ltr" className="flex items-center rounded-2xl bg-lavender ring-blue focus-within:bg-white focus-within:ring-2">
        <span className="ps-4 text-[16px] text-ink-2" aria-hidden="true">@</span>
        <input
          id="auth-username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="text"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\s/g, ""))}
          placeholder="your.name…"
          className="min-w-0 flex-1 bg-transparent px-2 py-3.5 text-[16px] outline-none placeholder:text-mute"
        />
        {status === "free" && <Check size={18} className="me-4 text-blue" aria-hidden="true" />}
      </div>
    </Field>
  )
}

export default function AuthSheet() {
  const nav = useNav()
  const req = nav.authRequest
  const [step, setStep] = useState<Step>("choose")
  const [mode, setMode] = useState<"signin" | "signup">("signup")
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<AuthError | null>(null)

  // Every sign-in request starts fresh
  useEffect(() => {
    if (!req) return
    setStep("choose")
    setErr(null)
    setPassword("")
    setBusy(false)
  }, [req])

  useEffect(() => {
    if (step !== "google") return
    const t = window.setTimeout(() => setStep("complete"), 900)
    return () => window.clearTimeout(t)
  }, [step])

  if (!req) return null

  const finish = (u: User) => {
    nav.setUser(u)
    nav.toast(`ברוכים הבאים, ${u.name}`)
    nav.closeAuth(true)
  }

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    const res = mode === "signup" ? await signUp({ name, username, email, password }) : await signIn(email, password)
    setBusy(false)
    if (typeof res === "string") return setErr(res)
    finish(res)
  }

  const submitGoogle = (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    const res = completeGoogle({ name, username })
    if (typeof res === "string") return setErr(res)
    finish(res)
  }

  const fieldErr = (k: AuthError[]) => (err && k.includes(err) ? authErrorCopy[err] : undefined)
  const back = (
    <button type="button" onClick={() => (setStep("choose"), setErr(null))} className="-mt-1 mb-2 flex min-h-10 items-center gap-1 self-start text-[14px] font-medium text-ink-2 hover:text-ink">
      <ArrowRight size={16} />
      חזרה
    </button>
  )

  return (
    <Sheet title={step === "complete" ? "עוד צעד קטן" : mode === "signin" && step === "email" ? "כניסה" : "התחברות לאגורה"} onClose={() => nav.closeAuth(false)}>
      {step === "choose" && (
        <div className="flex flex-col gap-4">
          <Illustration name="verified" size={120} />
          <div className="text-center">
            <h3 className="text-[20px] font-bold">{req.reason}</h3>
            <p className="mt-1 text-[14px] text-ink-2">חשבון אחד בחינם, ואפשר לחפש ולשמור גם בלי.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setErr(null)
              setStep("google")
            }}
            className="flex h-[52px] items-center justify-center gap-3 rounded-2xl bg-white text-[16px] font-semibold ring-1 ring-inset ring-line transition-transform hover:ring-ink/30 active:scale-[0.98]"
          >
            <GoogleMark />
            המשך עם Google
          </button>
          <Button block variant="soft" icon={<Mail size={18} />} onClick={() => setStep("email")}>
            המשך עם אימייל וסיסמה
          </Button>
          <p className="text-center text-[12px] text-ink-2">
            בהתחברות אתם מאשרים את{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={() => {
                nav.closeAuth(false)
                nav.push({ name: "rules" })
              }}
            >
              כללי הקהילה
            </button>
            . לא נפרסם דבר בשמכם.
          </p>
        </div>
      )}

      {step === "google" && (
        <div className="flex flex-col items-center gap-3 py-10 text-[15px] font-medium" role="status">
          <Loader2 size={28} className="animate-spin text-blue" aria-hidden="true" />
          מתחברים עם Google…
        </div>
      )}

      {step === "complete" && (
        <form onSubmit={submitGoogle} className="flex flex-col gap-4" noValidate>
          <p className="text-[15px] text-ink-2">כך יראו אתכם מוסרים ומקבלים באגורה.</p>
          <Field label="שם להצגה" htmlFor="auth-gname" error={fieldErr(["bad_name"])}>
            <input
              id="auth-gname"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!username) setUsername(suggestUsername(e.target.value))
              }}
              placeholder="למשל: יוסי כהן…"
              className={`${inputCls} text-[16px]`}
            />
          </Field>
          <UsernameField value={username} onChange={setUsername} error={fieldErr(["bad_username", "username_taken"])} />
          <Button block type="submit">
            סיום והמשך
          </Button>
        </form>
      )}

      {step === "email" && (
        <form onSubmit={submitEmail} className="flex flex-col gap-4" noValidate>
          {back}
          <div role="tablist" aria-label="סוג כניסה" className="grid grid-cols-2 gap-1 rounded-2xl bg-lavender p-1">
            {(["signup", "signin"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => (setMode(m), setErr(null))}
                className={`h-10 rounded-xl text-[14px] font-semibold ${mode === m ? "bg-white text-ink shadow-sm" : "text-ink-2"}`}
              >
                {m === "signup" ? "חשבון חדש" : "כבר יש לי חשבון"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <>
              <Field label="שם להצגה" htmlFor="auth-name" error={fieldErr(["bad_name"])}>
                <input id="auth-name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: יוסי כהן…" className={`${inputCls} text-[16px]`} />
              </Field>
              <UsernameField value={username} onChange={setUsername} error={fieldErr(["bad_username", "username_taken"])} />
            </>
          )}

          <Field label="אימייל" htmlFor="auth-email" error={fieldErr(["bad_email", "email_taken", "no_account"])}>
            <input
              id="auth-email"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com…"
              className={`${inputCls} text-left text-[16px]`}
            />
          </Field>

          <Field label="סיסמה" htmlFor="auth-password" error={fieldErr(["weak_password", "bad_credentials"])} hint={mode === "signup" ? "לפחות 8 תווים" : undefined}>
            <div className="flex items-center rounded-2xl bg-lavender ring-blue focus-within:bg-white focus-within:ring-2">
              <input
                id="auth-password"
                name="password"
                type={show ? "text" : "password"}
                dir="ltr"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-left text-[16px] outline-none"
              />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "הסתרת הסיסמה" : "הצגת הסיסמה"} aria-pressed={show} className="flex h-12 w-12 items-center justify-center text-ink-2">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          <Button block type="submit" disabled={busy} icon={busy ? <Loader2 size={18} className="animate-spin" /> : undefined}>
            {busy ? (mode === "signup" ? "יוצרים חשבון…" : "נכנסים…") : mode === "signup" ? "יצירת חשבון" : "כניסה"}
          </Button>
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => nav.toast(email ? `שלחנו קישור לאיפוס הסיסמה ל-${email.trim()}` : "כתבו קודם את האימייל שלכם")}
              className="min-h-10 text-[14px] font-medium text-ink-2 underline underline-offset-4"
            >
              שכחתי סיסמה
            </button>
          )}
        </form>
      )}
    </Sheet>
  )
}
