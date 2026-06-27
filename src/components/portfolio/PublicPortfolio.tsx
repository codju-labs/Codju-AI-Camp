import React, { useEffect, useMemo, useState } from "react";
import {
  FaArrowUpRightFromSquare,
  FaBookOpen,
  FaBrain,
  FaChartColumn,
  FaCheck,
  FaClock,
  FaFolderOpen,
  FaGamepad,
  FaGlobe,
  FaGraduationCap,
  FaLocationDot,
  FaMusic,
  FaPuzzlePiece,
  FaRegAddressCard,
  FaRegImage,
  FaScrewdriverWrench,
  FaUser,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

type ProjectDay = {
  key: string;
  label: string;
  title: string;
  category: string;
};

type Project = {
  dayKey: string;
  dayLabel: string;
  dayTitle: string;
  category: string;
  title: string;
  description: string;
  projectUrl: string;
  thumbnailUrl: string;
  toolsUsed: string[];
  sourceType: "link" | "upload";
  fileType?: string;
  isPublished: boolean;
};

type Profile = {
  slug: string;
  displayName: string;
  headline: string;
  bio: string;
  schoolName: string;
  city: string;
  avatarUrl: string;
  fingerprintTraits: string[];
  isPublic: boolean;
};

type Payload = {
  profile: Profile;
  projectDays: ProjectDay[];
  projects: Project[];
};

const DAY_ICONS: Record<string, IconName> = {
  "day-1": "image",
  "day-2": "book",
  "day-3": "cards",
  "day-4": "chart",
  "day-5": "music",
  "day-6": "puzzle",
  "day-7": "globe",
  "day-8": "game",
};

type IconName =
  | "sparkles"
  | "image"
  | "book"
  | "cards"
  | "chart"
  | "music"
  | "puzzle"
  | "globe"
  | "game"
  | "folder"
  | "tools"
  | "brain"
  | "clock"
  | "school"
  | "map"
  | "user"
  | "check"
  | "external";

const ICONS: Record<IconName, IconType> = {
  sparkles: FaWandMagicSparkles,
  image: FaRegImage,
  book: FaBookOpen,
  cards: FaRegAddressCard,
  chart: FaChartColumn,
  music: FaMusic,
  puzzle: FaPuzzlePiece,
  globe: FaGlobe,
  game: FaGamepad,
  folder: FaFolderOpen,
  tools: FaScrewdriverWrench,
  brain: FaBrain,
  clock: FaClock,
  school: FaGraduationCap,
  map: FaLocationDot,
  user: FaUser,
  check: FaCheck,
  external: FaArrowUpRightFromSquare,
};

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const IconComponent = ICONS[name];
  return <IconComponent aria-hidden="true" className={className} />;
}

function getSlugFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[0] === "portfolio" ? parts[1] || "" : "";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AI";
}

function isImageUrl(url = "", fileType = "") {
  return fileType.startsWith("image/")
    || /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(url);
}

function visualUrl(project: Project) {
  if (project.thumbnailUrl) return project.thumbnailUrl;
  if (isImageUrl(project.projectUrl, project.fileType || "")) return project.projectUrl;
  return "";
}

function outcomeForDay(dayKey: string) {
  const outcomes: Record<string, string> = {
    "day-1": "Used visual design and prompts to communicate an idea.",
    "day-2": "Built a story with characters, scenes, and a clear sequence.",
    "day-3": "Turned learning material into simple study aids.",
    "day-4": "Organized ideas into a clear presentation.",
    "day-5": "Explored music, mood, lyrics, and AI-assisted composition.",
    "day-6": "Created an interactive web experience from an idea.",
    "day-7": "Published a website for others to visit.",
    "day-8": "Designed a playable game loop with goals and feedback.",
  };
  return outcomes[dayKey] || "Created and shared a digital artifact.";
}

function iconForTrait(trait: string): IconName {
  const normalized = trait.toLowerCase();
  if (normalized.includes("poster") || normalized.includes("visual")) return "image";
  if (normalized.includes("comic") || normalized.includes("story")) return "book";
  if (normalized.includes("flash") || normalized.includes("card")) return "cards";
  if (normalized.includes("song") || normalized.includes("music")) return "music";
  if (normalized.includes("website") || normalized.includes("web")) return "globe";
  if (normalized.includes("game")) return "game";
  if (normalized.includes("app")) return "puzzle";
  if (normalized.includes("story")) return "book";
  if (normalized.includes("design")) return "image";
  if (normalized.includes("prompt")) return "sparkles";
  if (normalized.includes("research")) return "brain";
  if (normalized.includes("music")) return "music";
  if (normalized.includes("presentation")) return "chart";
  if (normalized.includes("coding")) return "puzzle";
  if (normalized.includes("problem")) return "tools";
  return "sparkles";
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.25em] text-purple-600">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-extrabold tracking-normal text-gray-900 sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-500 md:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ProjectVisual({ project, large = false }: { project: Project; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const image = visualUrl(project);
  if (image && !failed) {
    return (
      <img
        src={image}
        alt={project.title}
        onError={() => setFailed(true)}
        className={`w-full object-cover ${large ? "h-full" : "aspect-[16/10]"}`}
      />
    );
  }

  return (
    <div className={`flex w-full items-center justify-center bg-gradient-to-br from-purple-100 via-indigo-100 to-sky-100 p-8 text-center ${large ? "h-full" : "aspect-[16/10]"}`}>
      <div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-purple-200 bg-white">
          <Icon name={DAY_ICONS[project.dayKey] || "sparkles"} className="h-8 w-8 text-purple-600" />
        </div>
        <p className="mt-4 text-lg font-extrabold text-gray-800">{project.dayTitle}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-500">
          {project.sourceType === "upload" ? "Uploaded creation" : "Linked creation"}
        </p>
      </div>
    </div>
  );
}

export function PublicPortfolio() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const slug = getSlugFromPath();
    if (!slug) {
      fetch("/api/portfolio")
        .then(async (response) => {
          const payload = await response.json();
          if (!response.ok) throw new Error("Open a creator portfolio link to view it.");
          return payload as Payload;
        })
        .then((payload) => {
          setData(payload);
          if (payload.profile.slug) {
            window.history.replaceState(null, "", `/portfolio/${payload.profile.slug}`);
          }
        })
        .catch((fetchError) => setError(fetchError.message))
        .finally(() => setLoading(false));
      return;
    }

    fetch(`/api/public/portfolio/${encodeURIComponent(slug)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Portfolio not found.");
        return payload as Payload;
      })
      .then(setData)
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setLoading(false));
  }, []);

  const featuredProject = useMemo(
    () => data?.projects.find((project) => project.thumbnailUrl)
      ?? data?.projects[0],
    [data],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-purple-50 px-4 py-20 text-gray-900">
        <div className="mx-auto max-w-4xl rounded-3xl border-2 border-purple-100 bg-white p-8 text-center font-bold shadow-sm">
          Loading portfolio...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-purple-50 px-4 py-20 text-gray-900">
        <div className="mx-auto max-w-4xl rounded-3xl border-2 border-purple-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-extrabold uppercase tracking-widest text-purple-600">
            Creator portfolio
          </p>
          <h1 className="mt-3 text-3xl font-extrabold">Portfolio unavailable</h1>
          <p className="mt-3 text-gray-500">{error || "This portfolio is not public yet."}</p>
        </div>
      </main>
    );
  }

  const { profile, projects, projectDays } = data;
  const completedDays = new Set(projects.map((project) => project.dayKey));
  const createdLabels = projects.map((project) => project.dayTitle);
  const outcomes = projects.map((project) => ({
    id: project.dayKey,
    title: project.dayTitle,
    text: outcomeForDay(project.dayKey),
    icon: DAY_ICONS[project.dayKey] || "sparkles",
  }));
  const dnaTraits = profile.fingerprintTraits.length
    ? profile.fingerprintTraits
    : Array.from(new Set(projects.map((project) => project.category))).slice(0, 5);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-gray-900">
      <nav className="fixed left-0 right-0 top-0 z-40 border-b border-purple-100 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-5 lg:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="#top" className="text-lg font-extrabold text-gray-900 no-underline">
            {profile.displayName.split(" ")[0] || "Creator"}.
          </a>
          <div className="hidden items-center gap-8 text-sm font-bold text-gray-500 md:flex">
            <a href="#snapshot" className="no-underline transition hover:text-purple-700">Snapshot</a>
            <a href="#journey" className="no-underline transition hover:text-purple-700">Journey</a>
            <a href="#projects" className="no-underline transition hover:text-purple-700">Projects</a>
            <a href="#outcomes" className="no-underline transition hover:text-purple-700">Outcomes</a>
          </div>
        </div>
      </nav>

      <section id="top" className="relative flex min-h-[78vh] items-center overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 pb-14 pt-28 sm:px-5 lg:px-12">
        <div className="absolute left-[-12rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-purple-100/80 blur-3xl" />
        <div className="absolute right-[-10rem] top-24 h-[30rem] w-[30rem] rounded-full bg-indigo-100/80 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[30%] h-[28rem] w-[28rem] rounded-full bg-sky-100/80 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <div className="relative mx-auto">
            <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-purple-200 to-indigo-200 opacity-70 blur-2xl" />
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="relative h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg sm:h-40 sm:w-40"
              />
            ) : (
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-purple-500 to-indigo-500 text-4xl font-extrabold text-white shadow-lg sm:h-40 sm:w-40">
                {initials(profile.displayName)}
              </div>
            )}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#7b2fc8] px-4 py-1.5 text-xs font-extrabold text-white shadow-md">
              AI Creator Camp
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-full border-2 border-purple-100 bg-white px-4 py-2 text-sm font-bold text-purple-700 no-underline transition hover:border-purple-300"
            >
              <Icon name="sparkles" className="h-4 w-4 text-purple-500" />
              Codju AI Creator Camp
            </a>
            <h1 className="mt-5 bg-gradient-to-r from-purple-700 via-[#7b2fc8] to-indigo-500 bg-clip-text text-4xl font-extrabold leading-tight tracking-normal text-transparent sm:text-5xl md:text-6xl">
              {profile.displayName}
            </h1>
            <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-bold text-gray-500">
              {profile.schoolName && (
                <span className="inline-flex items-center gap-2">
                  <Icon name="school" className="h-4 w-4 text-purple-500" />
                  {profile.schoolName}
                </span>
              )}
              {profile.city && (
                <span className="inline-flex items-center gap-2">
                  <Icon name="map" className="h-4 w-4 text-indigo-500" />
                  {profile.city}
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <Icon name="folder" className="h-4 w-4 text-purple-500" />
                {projects.length} creations
              </span>
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-bold text-gray-800 sm:text-xl">
              {profile.headline || "AI creator, builder, and storyteller"}
            </p>
            {profile.bio && (
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-500 md:text-base">
                {profile.bio}
              </p>
            )}
            <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
              {[...createdLabels, ...profile.fingerprintTraits].slice(0, 6).map((label) => (
                <span
                  key={label}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-purple-100 bg-white/80 px-3 py-1.5 text-xs font-extrabold text-gray-700 shadow-sm backdrop-blur"
                >
                  <Icon name={iconForTrait(label)} className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="snapshot" className="relative mx-auto max-w-6xl px-4 py-10 sm:px-5 lg:px-0">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Creations", value: projects.length, icon: "folder" as IconName },
            { label: "Days Explored", value: completedDays.size, icon: "clock" as IconName },
            { label: "Tools Listed", value: projects.reduce((sum, project) => sum + project.toolsUsed.length, 0), icon: "tools" as IconName },
            { label: "Strengths", value: dnaTraits.length, icon: "brain" as IconName },
          ].map((card) => (
            <div key={card.label} className="rounded-3xl border-2 border-purple-100 bg-white p-5 shadow-sm">
              <Icon name={card.icon} className="h-7 w-7 text-purple-600" />
              <div className="mt-4 text-4xl font-extrabold text-gray-900">{card.value}</div>
              <div className="mt-1 text-sm font-semibold text-gray-500">{card.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="journey" className="relative bg-purple-50/60 px-4 py-16 sm:px-5 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Learning Journey"
            title="Creations Published"
            subtitle="A clean look at the work this student has chosen to share from the camp."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {projects.map((project, index) => {
              const day = projectDays.find((item) => item.key === project.dayKey) || {
                key: project.dayKey,
                label: project.dayLabel,
                title: project.dayTitle,
                category: project.category,
              };
              return (
                <article
                  key={day.key}
                  className="rounded-3xl border-2 border-purple-100 bg-white p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                      <Icon name={DAY_ICONS[day.key] || "sparkles"} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold uppercase tracking-widest text-purple-600">
                      {day.label}
                      </div>
                      <h3 className="mt-1 text-xl font-extrabold text-gray-900">
                        {project.title || day.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-500">
                        {project.description || `${day.title} creation published from the camp.`}
                      </p>
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex rounded-full bg-[#7b2fc8] px-4 py-2 text-xs font-extrabold text-white no-underline transition hover:bg-[#6f2ab4]"
                      >
                        Open creation
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {featuredProject && (
        <section className="relative bg-white px-4 py-12 sm:px-5 lg:px-12">
          <div className="mx-auto max-w-6xl">
          <div className="relative h-[380px] overflow-hidden rounded-[2rem] border-2 border-purple-100 bg-white sm:h-[460px]">
            <ProjectVisual project={featuredProject} large />
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-7 sm:max-w-xl sm:p-12">
              <span className="mb-3 inline-flex w-fit rounded-full bg-purple-50 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-purple-600">
                Spotlight · {featuredProject.category}
              </span>
              <h3 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                {featuredProject.title}
              </h3>
              {featuredProject.description && (
                <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500 sm:text-base">
                  {featuredProject.description}
                </p>
              )}
              <a
                href={featuredProject.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-fit rounded-full bg-[#7b2fc8] px-5 py-3 text-sm font-extrabold text-white no-underline transition hover:bg-[#6f2ab4]"
              >
                Explore creation
              </a>
            </div>
          </div>
          </div>
        </section>
      )}

      <section id="projects" className="relative bg-purple-50/60 px-4 py-16 sm:px-5 lg:px-12">
        <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Projects Showcase"
          title="Everything They Created"
          subtitle="Posters, comics, songs, websites and games are collected here as the student publishes them."
        />
        {projects.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.dayKey}
                className="group overflow-hidden rounded-3xl border-2 border-purple-100 bg-white transition hover:-translate-y-1"
              >
                <div className="relative overflow-hidden">
                  <ProjectVisual project={project} />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-purple-700">
                    {project.dayLabel}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-purple-600">
                    {project.category}
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold text-gray-900">{project.title}</h3>
                  {project.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500">
                      {project.description}
                    </p>
                  )}
                  {project.toolsUsed.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.toolsUsed.slice(0, 4).map((tool) => (
                        <span key={tool} className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[11px] font-bold text-gray-700">
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex rounded-full border border-purple-200 px-4 py-2 text-xs font-extrabold text-purple-700 no-underline transition hover:border-purple-400 hover:bg-purple-50"
                  >
                    Open creation
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/60">
            No creations have been published yet.
          </div>
        )}
        </div>
      </section>

      <section id="outcomes" className="relative mx-auto max-w-6xl px-4 py-16 sm:px-5 lg:px-0">
        <SectionHeading
          eyebrow="Learning Outcomes"
          title="What They Practiced"
          subtitle="Each published creation maps to a concrete learning outcome from the camp."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(outcomes.length ? outcomes : [{
            id: "default",
            title: "Creator Practice",
            text: "Used AI tools to plan, create, improve, and share digital work.",
            icon: "sparkles" as IconName,
          }]).map((outcome) => (
            <div key={outcome.id} className="rounded-3xl border-2 border-purple-100 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100">
                <Icon name={outcome.icon} className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-gray-900">{outcome.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{outcome.text}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
