import { motion } from "framer-motion";
import {
  Check,
  Clock,
  Copy,
  Crosshair,
  ExternalLink,
  Loader2,
  Radio,
  RefreshCw,
} from "lucide-react";
import LiveTacticalMap from "./LiveTacticalMap";

const statTile =
  "rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 shadow-inner shadow-black/5 backdrop-blur-md transition hover:border-cyan-400/20";

export default function ProfileLocationCard({
  motionCustom,
  fadeUpVariants,
  locStatus,
  locError,
  coords,
  accuracyM,
  locatedAt,
  address,
  addressLoading,
  cityMismatch,
  userCity,
  embedBbox,
  mapsHref,
  coordsCopied,
  onCopyCoords,
  onRefresh,
  cityLabel,
}) {
  return (
    <motion.section
      custom={motionCustom}
      variants={fadeUpVariants}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="relative flex flex-col overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-[var(--bg-card)] via-[var(--bg-dashboard)]/95 to-[var(--bg-main)] p-1 shadow-[0_24px_60px_-20px_rgba(6,182,212,0.18)]"
    >
      <div className="relative rounded-[1.35rem] bg-[var(--bg-glass)]/30 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/25">
              <Radio size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-500/80">Live map</h2>
              <p className="mt-1 text-lg font-bold text-[var(--text-bright)]">Real-time device location</p>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
                GPS fix from your browser. Updates when you refresh — ideal for dispatch-style map preview.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={locStatus === "loading"}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500/25 to-teal-500/15 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-cyan-50 ring-1 ring-cyan-400/35 transition hover:from-cyan-500/35 hover:to-teal-500/25 disabled:opacity-50"
          >
            {locStatus === "loading" ? <Loader2 size={15} className="animate-spin" /> : <Crosshair size={15} />}
            Refresh GPS
          </button>
        </div>

        <LiveTacticalMap cityLabel={cityLabel} />

        <div className="space-y-5">
          {locStatus === "loading" && (
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-cyan-500/25 bg-gradient-to-b from-cyan-500/[0.07] to-transparent py-16">
              <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
                <span className="absolute h-full w-full animate-ping rounded-full border border-cyan-400/30" style={{ animationDuration: "2s" }} />
                <span className="absolute h-[70%] w-[70%] animate-pulse rounded-full border border-cyan-400/20" />
                <Loader2 className="relative h-11 w-11 animate-spin text-cyan-400" />
              </div>
              <p className="text-base font-semibold text-[var(--text-main)]">Acquiring satellite lock…</p>
              <p className="mt-2 max-w-xs text-center text-sm text-slate-500">Allow location access when your browser asks.</p>
            </div>
          )}

          {locStatus === "denied" && (
            <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/[0.1] to-transparent p-5 sm:p-6">
              <p className="text-sm font-semibold leading-relaxed text-rose-100">{locError}</p>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                Enable location in site settings, then tap Refresh GPS.
              </p>
            </div>
          )}

          {locStatus === "error" && (
            <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/[0.1] to-transparent p-5">
              <p className="text-sm leading-relaxed text-rose-100">{locError}</p>
              <button
                type="button"
                onClick={onRefresh}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
              >
                <RefreshCw size={14} /> Try again
              </button>
            </div>
          )}

          {locStatus === "ok" && coords && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.5)]" />
                  Live fix
                </span>
                <button
                  type="button"
                  onClick={onCopyCoords}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-cyan-500/30 hover:text-white"
                >
                  {coordsCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {coordsCopied ? "Copied" : "Copy coords"}
                </button>
              </div>

              {cityMismatch && userCity && (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 text-sm leading-relaxed text-amber-100/95">
                  Map area differs from account city ({userCity}) — typical when you are traveling.
                </div>
              )}

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-2xl ring-1 ring-cyan-500/15">
                <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-[#020617]/90 via-transparent to-transparent opacity-70" />
                <iframe
                  title="Worker location map"
                  className="relative z-0 h-[min(52vh,320px)] min-h-[220px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${embedBbox}&layer=mapnik&marker=${coords.lat},${coords.lon}`}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className={statTile}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Latitude</p>
                  <p className="mt-2 font-mono text-sm font-semibold text-cyan-200 tabular-nums">{coords.lat.toFixed(6)}°</p>
                </div>
                <div className={statTile}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Longitude</p>
                  <p className="mt-2 font-mono text-sm font-semibold text-cyan-200 tabular-nums">{coords.lon.toFixed(6)}°</p>
                </div>
                <div className={statTile}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Accuracy</p>
                  <p className="mt-2 text-sm font-bold tabular-nums text-[var(--text-bright)]">{accuracyM != null ? `± ${accuracyM} m` : "—"}</p>
                </div>
                <div className={statTile}>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <Clock size={11} /> Updated
                  </p>
                  <p className="mt-2 text-sm font-bold text-[var(--text-bright)]">{locatedAt ? locatedAt.toLocaleTimeString() : "—"}</p>
                </div>
              </div>

              <div className={statTile}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reverse geocode</p>
                {addressLoading ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 size={15} className="animate-spin text-cyan-400/80" /> Resolving address…
                  </p>
                ) : address ? (
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-dim)]">{address}</p>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No label returned — coordinates remain valid.</p>
                )}
              </div>

              {mapsHref && (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--bg-glass)]/20 to-[var(--bg-glass)]/5 py-3.5 text-sm font-black text-[var(--text-bright)] ring-1 ring-[var(--border)] transition hover:from-indigo-500/25 hover:to-violet-500/15 hover:ring-indigo-400/30"
                >
                  <ExternalLink size={17} />
                  Open in Google Maps
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </motion.section>
  );
}
