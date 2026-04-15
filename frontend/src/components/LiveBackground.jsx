import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const LiveBackground = () => {
  const { theme } = useTheme();
  // Generate random points for the "live network"
  const points = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5
  }));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
      
      {/* Deep Gradient Base */}
      <div style={{ 
        position: 'absolute', 
        width: '100%', 
        height: '100%', 
        background: theme === 'dark' 
          ? 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)' 
          : 'radial-gradient(circle at 50% 50%, #f8fafc 0%, #f1f5f9 100%)',
        transition: 'background 0.5s ease'
      }}></div>

      {/* Animated Mesh Grid */}
      <div style={{ 
        position: 'absolute', 
        width: '200%', 
        height: '200%', 
        top: '-50%', 
        left: '-50%',
        backgroundImage: `linear-gradient(rgba(148, 163, 184, ${theme === 'dark' ? '0.05' : '0.1'}) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, ${theme === 'dark' ? '0.05' : '0.1'}) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
        transform: 'perspective(1000px) rotateX(60deg)',
        zIndex: 0,
        opacity: theme === 'dark' ? 1 : 0.5
      }}></div>

      {/* Floating Network Nodes */}
      {points.map((p, i) => (
        <motion.div
          key={p.id}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            top: `${p.y}%`,
            left: `${p.x}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: i % 2 === 0 ? '#6366f1' : '#06b6d4',
            borderRadius: '50%',
            boxShadow: `0 0 15px ${i % 2 === 0 ? '#6366f1' : '#06b6d4'}88`,
            zIndex: 1
          }}
        />
      ))}

      {/* Aurora-like Glows */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 15, repeat: Infinity }}
        style={{
          position: 'absolute',
          top: '20%',
          right: '-10%',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          zIndex: 0
        }}
      />
    </div>
  );
};

export default LiveBackground;
