import React, { useEffect, useState } from "react";
import {
  FaArrowUpRightFromSquare,
  FaFolderOpen,
  FaGraduationCap,
  FaLocationDot,
  FaRegImage,
  FaWandMagicSparkles,
} from "react-icons/fa6";

type DirectoryPortfolio = {
  slug: string;
  displayName: string;
  headline: string;
  bio: string;
  schoolName: string;
  city: string;
  avatarUrl: string;
  fingerprintTraits: string[];
  projectCount: number;
  featuredProject: {
    title: string;
    category: string;
    thumbnailUrl: string;
    projectUrl: string;
    dayTitle: string;
  } | null;
  createdLabels: string[];
  updatedAt: string;
  url: string;
};

type DirectoryPayload = {
  portfolios: DirectoryPortfolio[];
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AI";
}

function titleCase(value = "") {
  return value
    .trim()
    .split(/(\s+|-)/)
    .map((part) => {
      if (!part.trim() || part === "-") return part;
      if (/^[A-Z0-9]{2,3}$/.test(part)) return part;
      const lower = part.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

function PortfolioDirectorySkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 py-10 text-gray-900 sm:px-5 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div className="h-10 w-28 animate-pulse rounded-full bg-white" />
          <div className="h-10 w-32 animate-pulse rounded-full bg-white" />
        </div>
        <div className="mx-auto mt-16 max-w-3xl text-center">
          <div className="mx-auto h-5 w-44 animate-pulse rounded-full bg-purple-100" />
          <div className="mx-auto mt-5 h-12 w-full max-w-xl animate-pulse rounded-2xl bg-purple-100" />
          <div className="mx-auto mt-4 h-5 w-full max-w-lg animate-pulse rounded-full bg-indigo-100" />
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="rounded-3xl border-2 border-purple-100 bg-white p-5">
              <div className="h-40 animate-pulse rounded-2xl bg-purple-50" />
              <div className="mt-5 flex items-center gap-3">
                <div className="h-14 w-14 animate-pulse rounded-full bg-purple-100" />
                <div className="min-w-0 flex-1">
                  <div className="h-5 w-36 animate-pulse rounded-full bg-gray-100" />
                  <div className="mt-2 h-4 w-48 animate-pulse rounded-full bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export function PortfolioDirectory() {
  const [portfolios, setPortfolios] = useState<DirectoryPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/public/portfolios")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load portfolios.");
        return payload as DirectoryPayload;
      })
      .then((payload) => setPortfolios(payload.portfolios || []))
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PortfolioDirectorySkeleton />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 py-10 text-gray-900 sm:px-5 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <nav className="flex items-center justify-between gap-4">
          <a href="/" className="inline-flex items-center no-underline" aria-label="Codju AI Creator Camp home">
            <img
              src="/assets/logo.webp"
              alt="Codju"
              className="h-9 w-auto"
              width={92}
              height={36}
            />
          </a>
          <a
            href="/learn"
            className="rounded-full border-2 border-purple-100 bg-white px-4 py-2 text-sm font-extrabold text-purple-700 no-underline transition hover:border-purple-300"
          >
            Student Login
          </a>
        </nav>

        <section className="mx-auto mt-16 max-w-3xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-purple-600">
            Student Showcase
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-normal text-gray-900 sm:text-5xl">
            Published AI Creator Camp Portfolios
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-500 md:text-base">
            Explore the posters, comics, songs, websites, games, and final projects students have chosen to share.
          </p>
        </section>

        {error && (
          <div className="mx-auto mt-10 max-w-2xl rounded-3xl border-2 border-red-100 bg-white p-6 text-center font-bold text-red-700">
            {error}
          </div>
        )}

        {!error && portfolios.length === 0 && (
          <div className="mx-auto mt-10 max-w-2xl rounded-3xl border-2 border-purple-100 bg-white p-8 text-center">
            <FaWandMagicSparkles aria-hidden="true" className="mx-auto h-8 w-8 text-purple-600" />
            <h2 className="mt-4 text-2xl font-extrabold text-gray-900">No portfolios published yet</h2>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              Student portfolios will appear here as soon as creations are published.
            </p>
          </div>
        )}

        {!error && portfolios.length > 0 && (
          <section className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => (
              <a
                key={portfolio.slug}
                href={portfolio.url}
                className="group overflow-hidden rounded-3xl border-2 border-purple-100 bg-white text-gray-900 no-underline transition hover:-translate-y-1 hover:border-purple-300"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-purple-100 via-indigo-100 to-sky-100">
                  {portfolio.featuredProject?.thumbnailUrl ? (
                    <img
                      src={portfolio.featuredProject.thumbnailUrl}
                      alt={titleCase(portfolio.featuredProject.title)}
                      className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FaRegImage aria-hidden="true" className="h-10 w-10 text-purple-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-purple-700">
                    {portfolio.projectCount} creations
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3">
                    {portfolio.avatarUrl ? (
                      <img
                        src={portfolio.avatarUrl}
                        alt={titleCase(portfolio.displayName)}
                        className="h-14 w-14 rounded-full border-2 border-purple-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7b2fc8] text-sm font-extrabold text-white">
                        {initials(titleCase(portfolio.displayName))}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-extrabold text-gray-900">
                        {titleCase(portfolio.displayName)}
                      </h2>
                      <p className="mt-1 line-clamp-1 text-xs font-bold text-gray-500">
                        {portfolio.headline || "AI Creator Camp portfolio"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-gray-500">
                    {portfolio.schoolName && (
                      <span className="inline-flex items-center gap-1.5">
                        <FaGraduationCap aria-hidden="true" className="h-3.5 w-3.5 text-purple-500" />
                        {portfolio.schoolName}
                      </span>
                    )}
                    {portfolio.city && (
                      <span className="inline-flex items-center gap-1.5">
                        <FaLocationDot aria-hidden="true" className="h-3.5 w-3.5 text-indigo-500" />
                        {portfolio.city}
                      </span>
                    )}
                  </div>

                  {portfolio.createdLabels.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {portfolio.createdLabels.slice(0, 4).map((label) => (
                        <span key={label} className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[11px] font-bold text-gray-700">
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-purple-700">
                    <FaFolderOpen aria-hidden="true" className="h-4 w-4" />
                    View portfolio
                    <FaArrowUpRightFromSquare aria-hidden="true" className="h-3.5 w-3.5" />
                  </div>
                </div>
              </a>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
