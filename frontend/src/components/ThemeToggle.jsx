import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme !== 'light';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className="relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300"
      style={{
        background:  isDark ? "rgba(99,102,241,0.1)" : "rgba(79,70,229,0.08)",
        border:      isDark ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(79,70,229,0.2)",
        color:       isDark ? "#818cf8" : "#4f46e5",
        boxShadow:   isDark ? "0 4px 12px rgba(99,102,241,0.15)" : "0 2px 8px rgba(79,70,229,0.1)",
      }}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1 }}
            exit={{    rotate:  90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Sun size={15} />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate:  90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1 }}
            exit={{    rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Moon size={15} />
          </motion.span>
        )}
      </AnimatePresence>
      <span className="text-[10px] font-black uppercase tracking-wider">
        {isDark ? "Light" : "Dark"}
      </span>
    </motion.button>
  );
}
