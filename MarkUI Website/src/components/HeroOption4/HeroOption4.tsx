import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import styles from './HeroOption4.module.css';

const services = [
  { id: 1, title: 'Web Applications', desc: 'Browser-based portals and tools that simplify how your team and customers work.' },
  { id: 2, title: 'SEO Optimization', desc: 'Search optimization that helps the right people find you on Google.' },
  { id: 3, title: 'Custom Software', desc: 'Software shaped around your processes, from internal systems to automation.' },
  { id: 4, title: 'UI/UX Design', desc: 'Intuitive interfaces that make complex products feel effortless to use.' },
  { id: 5, title: 'Cloud Solutions', desc: 'Scalable infrastructure that grows with your business needs.' },
];

export const HeroOption4 = () => {
  const [activeService, setActiveService] = useState(0);

  return (
    <section className={styles.hero}>
      {/* Large faded watermark text in background */}
      <motion.div
        className={styles.watermark}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
      >
        MARK
      </motion.div>

      {/* Animated grid lines */}
      <div className={styles.gridBg}>
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`v${i}`}
            className={styles.gridLineV}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.2, delay: i * 0.06, ease: 'easeOut' }}
            style={{ left: `${(i + 1) * (100 / 13)}%` }}
          />
        ))}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`h${i}`}
            className={styles.gridLineH}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.3 + i * 0.06, ease: 'easeOut' }}
            style={{ top: `${(i + 1) * (100 / 9)}%` }}
          />
        ))}
      </div>

      {/* Floating decorative elements */}
      <motion.div
        className={styles.floatDot1}
        animate={{ y: [0, -15, 0], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={styles.floatDot2}
        animate={{ y: [0, 12, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className={styles.floatCross}
        animate={{ rotate: [0, 90, 180, 270, 360], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      >
        +
      </motion.div>

      {/* Left side — headline + CTA */}
      <div className={styles.left}>
        <motion.div
          className={styles.logoBlock}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.logo}>Mark UI</span>
          <span className={styles.logoDot} />
        </motion.div>

        <div className={styles.headingGroup}>
          <motion.h1
            className={styles.heading}
            initial={{ opacity: 0, y: 60, skewY: 3 }}
            animate={{ opacity: 1, y: 0, skewY: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Design the Future.
          </motion.h1>
          <motion.h1
            className={`${styles.heading} ${styles.headingBold}`}
            initial={{ opacity: 0, y: 60, skewY: 3 }}
            animate={{ opacity: 1, y: 0, skewY: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            Define the Experience.
          </motion.h1>
          <motion.div
            className={styles.headingLine}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          />
        </div>

        <motion.p
          className={styles.subtext}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          We help ambitious companies launch memorable brands, build high-impact websites, and design digital products people love to use.
        </motion.p>

        <motion.div
          className={styles.ctaRow}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <motion.a
            href="#contact"
            className={styles.cta}
            whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
            whileTap={{ scale: 0.95 }}
          >
            BOOK A CALL <span className={styles.arrow}>&#8599;</span>
          </motion.a>
          <motion.a
            href="#projects"
            className={styles.ctaOutline}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            VIEW PROJECTS
          </motion.a>
        </motion.div>
      </div>

      {/* Vertical divider */}
      <motion.div
        className={styles.divider}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />

      {/* Right side — services */}
      <div className={styles.right}>
        <motion.p
          className={styles.rightLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          WHAT WE DO
        </motion.p>

        <div className={styles.serviceList}>
          {services.map((service, i) => (
            <motion.div
              key={service.id}
              className={`${styles.serviceItem} ${activeService === i ? styles.active : ''}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              onHoverStart={() => setActiveService(i)}
              onClick={() => setActiveService(i)}
            >
              {/* Glow highlight behind active item */}
              <motion.div
                className={styles.itemGlow}
                animate={{ opacity: activeService === i ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
              <div className={styles.serviceHeader}>
                <motion.span
                  className={styles.serviceNum}
                  animate={{ scale: activeService === i ? 1.15 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  0{service.id}
                </motion.span>
                <span className={styles.serviceTitle}>{service.title}</span>
                <motion.span
                  className={styles.serviceArrow}
                  animate={{ x: activeService === i ? 4 : 0, opacity: activeService === i ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  &#8594;
                </motion.span>
              </div>
              <AnimatePresence>
                {activeService === i && (
                  <motion.p
                    className={styles.serviceDesc}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {service.desc}
                  </motion.p>
                )}
              </AnimatePresence>
              <motion.div
                className={styles.serviceBar}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: activeService === i ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </div>

        {/* Rotating dashed circle */}
        <motion.div
          className={styles.decorCircle}
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 200 200" className={styles.circleSvg}>
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="5 10" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 8" />
            <circle cx="100" cy="10" r="5" fill="rgba(255,255,255,0.6)" />
            <circle cx="190" cy="100" r="3" fill="rgba(255,255,255,0.3)" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
};
