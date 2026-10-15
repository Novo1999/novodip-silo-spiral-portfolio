import { portfolioData } from "@/data/portfolio";

/**
 * The silo only shows one floor at a time, so this server-rendered,
 * visually hidden outline gives crawlers and screen readers the whole
 * portfolio as a linear document.
 */
export default function SeoContent() {
  const { profile, experience, projects, capabilities, about } = portfolioData;

  return (
    <div className="sr-only">
      <header>
        <h1>
          {profile.name} — {profile.title}
        </h1>
        <p>{profile.tagline}</p>
        <p>
          {profile.location} · {profile.status}
        </p>
      </header>

      <section aria-labelledby="seo-experience">
        <h2 id="seo-experience">Experience</h2>
        {experience.map((exp) => (
          <article key={exp.company}>
            <h3>
              {exp.role} — {exp.company}
            </h3>
            <p>{exp.period}</p>
            <ul>
              {exp.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section aria-labelledby="seo-projects">
        <h2 id="seo-projects">Selected work</h2>
        {projects.map((project) => (
          <article key={project.id}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <p>Built with {project.stack.join(", ")}</p>
            <ul>
              {project.liveUrl && (
                <li>
                  <a href={project.liveUrl}>{project.title} live site</a>
                </li>
              )}
              {project.demoUrl && (
                <li>
                  <a href={project.demoUrl}>{project.title} demo video</a>
                </li>
              )}
              {project.frontendUrl && (
                <li>
                  <a href={project.frontendUrl}>{project.title} source code</a>
                </li>
              )}
              {project.backendUrl && (
                <li>
                  <a href={project.backendUrl}>{project.title} backend source</a>
                </li>
              )}
            </ul>
          </article>
        ))}
      </section>

      <section aria-labelledby="seo-skills">
        <h2 id="seo-skills">Capabilities and skills</h2>
        <h3>Frontend &amp; Mobile</h3>
        <p>{capabilities.frontendAndMobile.join(", ")}</p>
        <h3>Backend</h3>
        <p>{capabilities.backend.join(", ")}</p>
        <h3>Tools</h3>
        <p>{capabilities.tools.join(", ")}</p>
      </section>

      <section aria-labelledby="seo-about">
        <h2 id="seo-about">About</h2>
        <p>{about.headline}</p>
        <p>{about.bio}</p>
      </section>

      <section aria-labelledby="seo-contact">
        <h2 id="seo-contact">Contact</h2>
        <ul>
          <li>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </li>
          <li>
            <a href={profile.socials.github}>GitHub</a>
          </li>
          <li>
            <a href={profile.socials.linkedin}>LinkedIn</a>
          </li>
          <li>
            <a href={profile.socials.resume}>Resume (PDF)</a>
          </li>
        </ul>
      </section>
    </div>
  );
}
