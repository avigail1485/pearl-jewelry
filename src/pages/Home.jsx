import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import ServicesMarquee from '../components/ServicesMarquee.jsx'
import ProcessSteps from '../components/ProcessSteps.jsx'
import RevealHeading from '../components/RevealHeading.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import { projects } from '../data/content.js'

export default function Home() {
  return (
    <main>
      <Hero />
      <ServicesMarquee />
      <ProcessSteps />

      <section className="mx-auto max-w-7xl px-6 py-28 md:px-10">
        <RevealHeading
          tag="p"
          lines={['לפני הכל – לכל מוצר יש סיפור. אולי יש כאלו שיראו בו סתם חפץ, אבל אותי הוא מצית בסקרנות.']}
          className="max-w-3xl font-display text-2xl leading-snug md:text-4xl"
        />
        <RevealHeading
          tag="p"
          lines={[
            'אני קולטת את הצורך, מרותקת לתהליכי הפיתוח והתכנון, ומתחילה לשרטט את השלב הבא של הרעיון שלך.',
            'המוצר שלך הולך לספר סיפור של חדשנות.',
          ]}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70"
        />

        <div className="mt-16 flex items-baseline justify-between border-b border-line pb-6">
          <span className="font-display text-3xl md:text-4xl">#הפרויקטים</span>
          <Link to="/projects" className="text-sm tracking-wide text-brass hover:underline">
            לכל הפרויקטים ←
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    </main>
  )
}
