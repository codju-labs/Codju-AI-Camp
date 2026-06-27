import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

type ProjectDay = {
  key: string;
  label: string;
  title: string;
  category: string;
};

type PortfolioProject = {
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
  assetKey?: string;
  fileType?: string;
  isPublished: boolean;
};

type PortfolioProfile = {
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

type PortfolioPayload = {
  profile: PortfolioProfile;
  projectDays: ProjectDay[];
  fingerprintTraits: string[];
  projects: PortfolioProject[];
};

const EMPTY_PROFILE: PortfolioProfile = {
  slug: "",
  displayName: "",
  headline: "",
  bio: "",
  schoolName: "",
  city: "",
  avatarUrl: "",
  fingerprintTraits: [],
  isPublic: true,
};

const UPLOAD_DAYS = new Set(["day-1", "day-2", "day-3", "day-4", "day-5"]);

const DAY_HINTS: Record<string, { action: string; accept: string; limit: string; placeholder: string }> = {
  "day-1": {
    action: "Upload poster image/PDF or paste a share link.",
    accept: "image/png,image/jpeg,image/webp,application/pdf",
    limit: "Max 6 MB",
    placeholder: "My Future City Poster",
  },
  "day-2": {
    action: "Upload comic image/PDF or paste a Canva/Drive link.",
    accept: "image/png,image/jpeg,image/webp,application/pdf",
    limit: "Max 10 MB",
    placeholder: "Robo & Me Comic",
  },
  "day-3": {
    action: "Upload flash cards as image/PDF or paste a share link.",
    accept: "image/png,image/jpeg,image/webp,application/pdf",
    limit: "Max 8 MB",
    placeholder: "Solar System Flash Cards",
  },
  "day-4": {
    action: "Upload exported slides as PDF/image or paste a deck link.",
    accept: "application/pdf,image/png,image/jpeg,image/webp",
    limit: "Max 12 MB",
    placeholder: "Save the Bees Presentation",
  },
  "day-5": {
    action: "Upload audio or paste a song link.",
    accept: "audio/mpeg,audio/mp3,audio/wav,audio/mp4,audio/aac",
    limit: "Max 15 MB",
    placeholder: "Dream Big Original Song",
  },
  "day-6": {
    action: "Paste the live app link.",
    accept: "",
    limit: "Link only",
    placeholder: "Kindness Bot App",
  },
  "day-7": {
    action: "Paste the live website link.",
    accept: "",
    limit: "Link only",
    placeholder: "Eco Heroes Website",
  },
  "day-8": {
    action: "Paste the playable game link.",
    accept: "",
    limit: "Link only",
    placeholder: "Space Defender",
  },
};

function projectForDay(projects: PortfolioProject[], day: ProjectDay): PortfolioProject {
  return projects.find((project) => project.dayKey === day.key) ?? {
    dayKey: day.key,
    dayLabel: day.label,
    dayTitle: day.title,
    category: day.category,
    title: "",
    description: "",
    projectUrl: "",
    thumbnailUrl: "",
    toolsUsed: [],
    sourceType: "link",
    isPublished: false,
  };
}

function publicUrl(slug: string) {
  if (!slug) return "";
  return `${window.location.origin}/portfolio/${slug}`;
}

function formatTools(tools: string[]) {
  return tools.join(", ");
}

function parseTools(value: string) {
  return value.split(",").map((tool) => tool.trim()).filter(Boolean).slice(0, 8);
}

async function compressImage(file: File, maxSize = 900, quality = 0.82) {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  bitmap.close();
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
    type: "image/webp",
  });
}

export function PortfolioEditor() {
  const [profile, setProfile] = useState<PortfolioProfile>(EMPTY_PROFILE);
  const [days, setDays] = useState<ProjectDay[]>([]);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [fingerprintOptions, setFingerprintOptions] = useState<string[]>([]);
  const [activeDay, setActiveDay] = useState("");
  const [draftProject, setDraftProject] = useState<PortfolioProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCreation, setUploadingCreation] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeDayMeta = useMemo(
    () => days.find((day) => day.key === activeDay),
    [activeDay, days],
  );
  const activeHint = activeDay ? DAY_HINTS[activeDay] : null;
  const shareUrl = profile.slug ? publicUrl(profile.slug) : "";

  useEffect(() => {
    fetch("/api/portfolio")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load portfolio.");
        return data as PortfolioPayload;
      })
      .then((data) => {
        setProfile({ ...EMPTY_PROFILE, ...data.profile });
        setDays(data.projectDays);
        setProjects(data.projects);
        setFingerprintOptions(data.fingerprintTraits || []);
        const firstDay = data.projectDays[0]?.key ?? "";
        setActiveDay(firstDay);
        if (data.projectDays[0]) {
          setDraftProject(projectForDay(data.projects, data.projectDays[0]));
        }
      })
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setLoading(false));
  }, []);

  function selectDay(day: ProjectDay) {
    setActiveDay(day.key);
    setDraftProject(projectForDay(projects, day));
    setMessage("");
    setError("");
  }

  function replaceProject(data: PortfolioPayload, dayKey = activeDay) {
    setProfile(data.profile);
    setProjects(data.projects);
    const day = days.find((item) => item.key === dayKey);
    if (day) setDraftProject(projectForDay(data.projects, day));
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/portfolio/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save profile.");
      replaceProject(data);
      setMessage("Profile saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true);
    setMessage("");
    setError("");
    try {
      const upload = await compressImage(file, 900, 0.82);
      const body = new FormData();
      body.set("file", upload);
      const response = await fetch("/api/portfolio/avatar", {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to upload photo.");
      replaceProject(data);
      setMessage("Profile photo uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function uploadCreation(file: File) {
    if (!draftProject || !UPLOAD_DAYS.has(draftProject.dayKey)) return;
    setUploadingCreation(true);
    setMessage("");
    setError("");

    try {
      const upload = file.type.startsWith("image/")
        ? await compressImage(file, 1800, 0.86)
        : file;
      const body = new FormData();
      body.set("file", upload);
      const response = await fetch(`/api/portfolio/projects/${draftProject.dayKey}/upload`, {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to upload creation.");
      setDraftProject({
        ...draftProject,
        projectUrl: data.url,
        thumbnailUrl: upload.type.startsWith("image/") ? data.url : draftProject.thumbnailUrl,
        sourceType: "upload",
        assetKey: data.assetKey,
        fileType: data.fileType,
      });
      setMessage("File uploaded. Add a title and publish it.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload creation.");
    } finally {
      setUploadingCreation(false);
    }
  }

  async function saveProject(event: FormEvent) {
    event.preventDefault();
    if (!draftProject) return;
    setSavingProject(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/portfolio/projects/${draftProject.dayKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draftProject,
          toolsUsed: formatTools(draftProject.toolsUsed),
          sourceType: draftProject.sourceType || "link",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to publish creation.");
      replaceProject(data, draftProject.dayKey);
      setMessage("Creation published.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to publish creation.");
    } finally {
      setSavingProject(false);
    }
  }

  async function unpublishProject() {
    if (!draftProject) return;
    setSavingProject(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/portfolio/projects/${draftProject.dayKey}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to hide creation.");
      replaceProject(data, draftProject.dayKey);
      setMessage("Creation hidden from your public portfolio.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to hide creation.");
    } finally {
      setSavingProject(false);
    }
  }

  function toggleFingerprint(trait: string) {
    const selected = profile.fingerprintTraits.includes(trait);
    const next = selected
      ? profile.fingerprintTraits.filter((item) => item !== trait)
      : [...profile.fingerprintTraits, trait].slice(0, 5);
    setProfile({ ...profile, fingerprintTraits: next });
  }

  if (loading) {
    return (
      <section className="bg-purple-50 px-4 py-14 sm:px-5 lg:px-12">
        <div className="w-lim rounded-3xl border-2 border-purple-100 bg-white p-8 text-center font-bold text-purple-700">
          Loading your portfolio...
        </div>
      </section>
    );
  }

  return (
    <main className="bg-slate-50">
      <section className="bg-gradient-to-br from-[#17142d] via-[#23163f] to-[#0b1022] px-4 py-8 text-white sm:px-5 md:py-10 lg:px-12">
        <div className="w-lim grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-purple-200">
              Creator portfolio
            </p>
            <h1 className="max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">
              Publish your camp journey, one creation at a time.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
              Upload visual/audio artifacts where it helps, and paste links for
              apps, websites, and games.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/8 p-5 shadow-2xl backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-200">
              Public link
            </p>
            <a
              href={shareUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block break-all text-sm font-bold text-white no-underline hover:text-purple-200"
            >
              {shareUrl || "Save your profile to create a public link"}
            </a>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={shareUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#17142d] no-underline transition hover:bg-purple-100"
              >
                Preview
              </a>
              <span className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-white/70">
                {projects.filter((project) => project.isPublished).length} published
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-10 lg:px-12">
        <div className="w-lim grid gap-6 xl:grid-cols-[minmax(360px,0.95fr)_minmax(0,1.55fr)]">
          <form onSubmit={saveProfile} className="rounded-3xl border-2 border-purple-100 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-purple-600">
                Profile
              </p>
              <h2 className="text-2xl font-extrabold text-gray-800">Public identity</h2>
            </div>

            <div className="mb-5 flex items-center gap-4 rounded-3xl bg-purple-50/70 p-4">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="h-20 w-20 shrink-0 rounded-3xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-purple-200 text-xl font-extrabold text-purple-800">
                  AI
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-gray-800">Profile photo</p>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Upload JPG/PNG/WebP. Images are compressed before upload.
                </p>
                <label className="mt-3 inline-flex cursor-pointer rounded-full border-2 border-purple-200 px-4 py-2 text-xs font-extrabold text-purple-700 transition hover:border-purple-400 hover:bg-white">
                  {uploadingAvatar ? "Uploading..." : "Upload photo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploadingAvatar}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) void uploadAvatar(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-bold text-gray-700">
                Display name
                <input
                  value={profile.displayName}
                  onChange={(event) => setProfile({ ...profile, displayName: event.target.value })}
                  className="rounded-2xl border-2 border-purple-100 px-4 py-3 font-body text-sm outline-none transition focus:border-purple-400"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-gray-700">
                Portfolio slug
                <input
                  value={profile.slug}
                  onChange={(event) => setProfile({ ...profile, slug: event.target.value })}
                  className="rounded-2xl border-2 border-purple-100 px-4 py-3 font-body text-sm outline-none transition focus:border-purple-400"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-gray-700">
                Headline
                <input
                  value={profile.headline}
                  onChange={(event) => setProfile({ ...profile, headline: event.target.value })}
                  className="rounded-2xl border-2 border-purple-100 px-4 py-3 font-body text-sm outline-none transition focus:border-purple-400"
                  placeholder="AI creator, builder, and storyteller"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-gray-700">
                Short bio
                <textarea
                  value={profile.bio}
                  onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                  className="min-h-24 rounded-2xl border-2 border-purple-100 px-4 py-3 font-body text-sm outline-none transition focus:border-purple-400"
                  placeholder="Share what you like building and what you learned."
                />
              </label>
              <label className="grid min-w-0 gap-1.5 text-sm font-bold text-gray-700">
                School
                <input
                  value={profile.schoolName}
                  onChange={(event) => setProfile({ ...profile, schoolName: event.target.value })}
                  className="w-full min-w-0 rounded-2xl border-2 border-purple-100 px-4 py-3 font-body text-sm outline-none transition focus:border-purple-400"
                />
              </label>
              <label className="grid min-w-0 gap-1.5 text-sm font-bold text-gray-700">
                City
                <input
                  value={profile.city}
                  onChange={(event) => setProfile({ ...profile, city: event.target.value })}
                  className="w-full min-w-0 rounded-2xl border-2 border-purple-100 px-4 py-3 font-body text-sm outline-none transition focus:border-purple-400"
                />
              </label>

              <div className="rounded-3xl border-2 border-purple-100 p-4">
                <p className="text-sm font-extrabold text-gray-800">Their Creative Fingerprint</p>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Pick up to five strengths that describe this creator.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {fingerprintOptions.map((trait) => {
                    const selected = profile.fingerprintTraits.includes(trait);
                    return (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => toggleFingerprint(trait)}
                        className={`rounded-full border-2 px-3 py-1.5 text-xs font-extrabold transition ${
                          selected
                            ? "border-purple-500 bg-purple-100 text-purple-800"
                            : "border-purple-100 bg-white text-gray-600 hover:border-purple-300"
                        }`}
                      >
                        {trait}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-full bg-[#8623d5] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>

          <div className="min-w-0 rounded-3xl border-2 border-purple-100 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-purple-600">
                Day-wise creations
              </p>
              <h2 className="text-2xl font-extrabold text-gray-800">Publish creation</h2>
            </div>

            <div className="-mx-2 mb-6 overflow-x-auto px-2 pb-3">
              <div className="flex min-w-max snap-x gap-3">
                {days.map((day) => {
                  const project = projectForDay(projects, day);
                  const active = day.key === activeDay;
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={`w-44 shrink-0 snap-start rounded-2xl border-2 px-4 py-3 text-left transition ${
                        active
                          ? "border-purple-500 bg-purple-50 text-purple-800"
                          : "border-purple-100 bg-white text-gray-600 hover:border-purple-300"
                      }`}
                    >
                      <span className="block text-[11px] font-extrabold uppercase tracking-widest">
                        {day.label}
                      </span>
                      <span className="mt-1 block min-h-10 text-base font-extrabold leading-tight">
                        {day.title}
                      </span>
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        project.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {project.isPublished ? "Published" : "Empty"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {draftProject && activeDayMeta && activeHint && (
              <form onSubmit={saveProject} className="grid gap-4">
                <div className="rounded-2xl bg-purple-50/70 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-purple-600">
                    {activeDayMeta.label} · {activeDayMeta.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-600">
                    {activeHint.action}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-bold text-gray-700">
                    Title
                    <input
                      value={draftProject.title}
                      onChange={(event) => setDraftProject({ ...draftProject, title: event.target.value })}
                      className="rounded-2xl border-2 border-purple-100 px-4 py-3 font-body text-sm outline-none transition focus:border-purple-400"
                      placeholder={activeHint.placeholder}
                      required
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-gray-700">
                    Tools used
                    <input
                      value={formatTools(draftProject.toolsUsed)}
                      onChange={(event) => setDraftProject({
                        ...draftProject,
                        toolsUsed: parseTools(event.target.value),
                      })}
                      className="rounded-2xl border-2 border-purple-100 px-4 py-3 font-body text-sm outline-none transition focus:border-purple-400"
                      placeholder="ChatGPT, Canva, Replit"
                    />
                  </label>
                </div>

                {UPLOAD_DAYS.has(draftProject.dayKey) && (
                  <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-gray-800">Upload file</p>
                        <p className="mt-1 text-xs font-bold text-gray-500">{activeHint.limit}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingCreation}
                        className="rounded-full border-2 border-purple-200 bg-white px-5 py-2.5 text-sm font-extrabold text-purple-700 transition hover:border-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploadingCreation ? "Uploading..." : "Choose file"}
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={activeHint.accept}
                      className="hidden"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        if (file) void uploadCreation(file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </div>
                )}

                <label className="grid gap-1.5 text-sm font-bold text-gray-700">
                  Creation link
                  <input
                    type="url"
                    value={draftProject.projectUrl}
                    onChange={(event) => setDraftProject({
                      ...draftProject,
                      projectUrl: event.target.value,
                      sourceType: "link",
                    })}
                    className="rounded-2xl border-2 border-purple-100 px-4 py-3 font-body text-sm outline-none transition focus:border-purple-400"
                    placeholder="https://..."
                    required
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-gray-700">
                  Short description
                  <textarea
                    value={draftProject.description}
                    onChange={(event) => setDraftProject({ ...draftProject, description: event.target.value })}
                    className="min-h-24 rounded-2xl border-2 border-purple-100 px-4 py-3 font-body text-sm outline-none transition focus:border-purple-400"
                    placeholder="What did you create?"
                  />
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={savingProject || uploadingCreation}
                    className="rounded-full bg-[#8623d5] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingProject ? "Publishing..." : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={unpublishProject}
                    disabled={savingProject || !draftProject.isPublished}
                    className="rounded-full border-2 border-purple-200 px-5 py-3 text-sm font-extrabold text-purple-700 transition hover:border-purple-400 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Hide
                  </button>
                </div>
              </form>
            )}

            {(message || error) && (
              <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-bold ${
                error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
              }`}>
                {error || message}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
