import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const blobs = [
  { size: "42vmin", top: "-12%", left: "-8%", from: "from-indigo-600/25", to: "to-violet-600/10", dur: 22 },
  { size: "36vmin", top: "40%", right: "-10%", from: "from-cyan-500/20", to: "to-transparent", dur: 18 },
  { size: "28vmin", bottom: "-5%", left: "25%", from: "from-fuchsia-600/20", to: "to-transparent", dur: 26 },
];

export default function ProfileAmbientLayer() {
  const { theme } = useTheme();

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-br ${b.from} ${b.to} blur-3xl opacity-70`}
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
          }}
          animate={{
            x: [0, 18, -12, 0],
            y: [0, -22, 8, 0],
            scale: [1, 1.06, 0.98, 1],
          }}
          transition={{
            duration: b.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(99,102,241,0.12),transparent_55%)]" />
      {/* subtle grid */}
      <div
        className="absolute inset-0"
        style={{
          opacity: theme === 'dark' ? 0.12 : 0.25,
          backgroundImage:
            `linear-gradient(rgba(148,163,184,${theme === 'dark' ? '0.15' : '0.25'}) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,${theme === 'dark' ? '0.12' : '0.25'}) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
