import { useState } from 'react'
import RevealHeading from '../components/RevealHeading.jsx'

const fields = [
  { name: 'name', label: 'שם', type: 'text' },
  { name: 'email', label: 'אימייל', type: 'email' },
  { name: 'phone', label: 'טלפון', type: 'tel' },
]

export default function Contact() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-40 md:px-10">
      <RevealHeading
        tag="h1"
        lines={['נתחיל לתרגם חלומות למוצרים?']}
        className="font-display text-4xl leading-tight md:text-6xl"
      />
      <RevealHeading
        tag="p"
        lines={['נראה לי שאת מתאימה לי דווקא, נדבר?']}
        className="mt-6 text-lg text-ink/70 md:text-xl"
      />
      <RevealHeading
        tag="p"
        lines={[
          'נתחיל לעבוד יחד ולעשות את המקסימום כדי להפוך את הקונספט שלך למוצר אמיתי ומוגמר?',
        ]}
        className="mt-2 text-lg text-ink/70 md:text-xl"
      />
      <RevealHeading
        tag="p"
        lines={['כמה פרטים טכניים ונבדוק התאמה:']}
        className="mt-8 text-sm tracking-[0.25em] text-clay"
      />

      {sent ? (
        <p className="mt-14 font-display text-2xl text-brass">
          תודה! ההודעה נשלחה, נחזור אליך בהקדם.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-12 flex max-w-xl flex-col gap-8">
          {fields.map((f) => (
            <label key={f.name} className="group flex flex-col gap-2">
              <span className="text-sm text-ink/60">{f.label}</span>
              <input
                type={f.type}
                name={f.name}
                required
                className="border-b border-line bg-transparent py-2 text-lg outline-none transition-colors focus:border-ink"
              />
            </label>
          ))}
          <label className="group flex flex-col gap-2">
            <span className="text-sm text-ink/60">הודעה</span>
            <textarea
              name="message"
              rows={4}
              required
              className="resize-none border-b border-line bg-transparent py-2 text-lg outline-none transition-colors focus:border-ink"
            />
          </label>

          <button
            type="submit"
            className="mt-4 w-fit rounded-full bg-ink px-10 py-4 text-sm tracking-wide text-bone transition-colors hover:bg-brass"
          >
            שליחה
          </button>
        </form>
      )}
    </main>
  )
}
