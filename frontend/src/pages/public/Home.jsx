import { Link, useLocation } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { useReveal } from '../../hooks/useReveal';
import HeroSlider from '../../components/public/HeroSlider.jsx';
import SmoothImg from '../../components/public/SmoothImg.jsx';
import { useEffect, useState } from 'react';
import './Home.css';

/* ──────────────────────────────────────────────────────────
   Animated rotating headline word
   ────────────────────────────────────────────────────────── */
function AnimatedWord({ words = [] }) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (words.length < 2) return;
    const id = setInterval(() => {
      setLeaving(true);
      setTimeout(() => {
        setIndex(i => (i + 1) % words.length);
        setLeaving(false);
      }, 400);
    }, 3000);
    return () => clearInterval(id);
  }, [words.length]);

  return (
    <span className={`animated-word ${leaving ? 'leave' : 'enter'}`}>
      {words[index]}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────
   Marquee strip — wraps each set in its own div to avoid
   React key conflicts when duplicating children for the
   seamless loop.
   ────────────────────────────────────────────────────────── */
function MarqueeStrip({ children, speed = 40, reverse = false }) {
  return (
    <div className="marquee-outer" aria-hidden="true">
      <div
        className={`marquee-track ${reverse ? 'marquee-reverse' : ''}`}
        style={{ '--marquee-speed': `${speed}s` }}
      >
        {/* Set 1 (visible) */}
        <div className="marquee-set">{children}</div>
        {/* Set 2 (duplicate for seamless looping) */}
        <div className="marquee-set" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}

/* Home category cards are fully static — no DB. Each is just a background
   image + description linking to its product page. Images live in
   backend/public/uploads. Edit this list to change the homepage lineup. */
const HOME_CATEGORIES = [
  { name: 'Door Hardware',    description: 'Proven solutions for every kind of security needs',   image: '/uploads/site/home/door-hardware.jpeg',    link: '/products/door-hardware' },
  { name: 'Entrance Systems', description: 'Seamless automated access',                            image: '/uploads/site/home/automatic-doors.jpeg',  link: '/products/entrance-systems' },
  { name: 'Electronic Access',description: 'Eliminate traditional keys with digital credentials',  image: '/uploads/site/home/electronic-access.jpeg', link: '/products/electronic-access' },
  { name: 'Smart Home',       description: 'Elevate living experience with automation',            image: '/uploads/site/home/smart-home.jpeg',       link: '/products/smart-home' },
];

/* ──────────────────────────────────────────────────────────
   Home
   ────────────────────────────────────────────────────────── */
export default function Home() {
  const { data, loading } = useFetch('/public/homepage', []);
  const [activeStory, setActiveStory] = useState(0);
  const location = useLocation();

  // Scroll-into-view triggers for the animation library (see animations.css)
  const [catsRef,     catsVisible]     = useReveal();
  const [servicesRef, servicesVisible] = useReveal();
  const [marqueeRef,  marqueeVisible]  = useReveal();
  const [partnersRef, partnersVisible] = useReveal();

  // Scroll to hash target (e.g. #about) once content is rendered
  useEffect(() => {
    if (loading || !location.hash) return;
    const id = location.hash.slice(1);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [loading, location.hash]);

  if (loading) return null;

  const banners          = data?.banners            || [];
  const marqueeProjects  = data?.marqueeProjects     || [];
  const storyMilestones  = data?.storyMilestones     || [];
  const partnerBrands    = data?.partnerBrands       || [];
  const settings         = data?.homepageSettings    || {};

  const headlineWords = (settings.homepage_about_headline_words || 'Spirit of Excellence,Spirit of Integrity')
    .split(',').map(w => w.trim()).filter(Boolean);

  return (
    <>
      {/* ── 1. HERO SLIDER ─────────────────────────────── */}
      <HeroSlider banners={banners} />

      {/* ── 2. CATEGORY BANNER CARDS (static) ──────────── */}
      <section className="home-cats-section">
        <div className="container home-cats-section__header">
          <h2 className="home-cats-section__title">Explore our lineup of innovative and tailored products</h2>
          <p className="home-cats-section__sub">All products are not created equally – we strive to provide the finest solutions in each of our product cluster</p>
        </div>
        <div className={`home-cats ${catsVisible ? 'is-visible' : ''}`} ref={catsRef}>
          {HOME_CATEGORIES.map((cat, i) => (
            <Link
              key={cat.link}
              to={cat.link}
              className="home-cat-card reveal reveal--fade-up"
              style={{ '--reveal-delay': `${i * 120}ms` }}
            >
              <SmoothImg
                src={`${import.meta.env.VITE_MEDIA_URL}${cat.image}`}
                alt={cat.name}
                loading="lazy"
                decoding="async"
              />
              <div className="home-cat-card__top-info">
                <p className="home-cat-card__hover">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3. PROFESSIONAL SERVICES ───────────────────── */}
      <section className={`home-services ${servicesVisible ? 'is-visible' : ''}`} ref={servicesRef}>
        <div className="home-services__image-col reveal reveal--slide-left">
          {settings.homepage_services_image
            ? <SmoothImg
                src={`${import.meta.env.VITE_MEDIA_URL}${settings.homepage_services_image}`}
                alt="Our services"
                loading="lazy"
                decoding="async"
              />
            : <div className="home-services__img-placeholder" />
          }
        </div>
        <div className="home-services__text-col">
          <p className="home-services__eyebrow">What We Offer</p>
          <h2 className="home-services__headline reveal reveal--fade-up" style={{ '--reveal-delay': '150ms' }}>
            {settings.homepage_services_headline || 'Our professional services are here to assist you'}
          </h2>
          <p className="home-services__sub reveal reveal--fade-up" style={{ '--reveal-delay': '300ms' }}>
            {settings.homepage_services_subtext || 'Get to know more about how we can help you from planning to construction stage.'}
          </p>
          <Link to="/services" className="home-services__btn reveal reveal--fade-up" style={{ '--reveal-delay': '450ms' }}>
            Explore our services
          </Link>
        </div>
      </section>

      {/* ── 4. PROJECT MARQUEE (2 rows, opposite directions) ── */}
      <section className={`home-project-marquee ${marqueeVisible ? 'is-visible' : ''}`} ref={marqueeRef}>
        <div className="container home-project-marquee__container">
          <h2 className="home-project-marquee__headline">
            {settings.homepage_marquee_headline || 'We have solutions for every project and application'}
          </h2>
          <p className="home-project-marquee__sub">Discover our products in real-life use cases</p>
          {marqueeProjects.length > 0 && (() => {
            const mid = Math.ceil(marqueeProjects.length / 2);
            const row1 = marqueeProjects.slice(0, mid);
            const row2 = marqueeProjects.slice(mid);
            const renderItem = (proj) => (
              <Link
                key={proj.id}
                to={`/projects/${proj.slug}`}
                className="marquee-proj-item"
              >
                {proj.cover_image
                  ? <SmoothImg
                      src={`${import.meta.env.VITE_MEDIA_URL}${proj.cover_image}`}
                      alt={proj.title}
                      loading="lazy"
                      decoding="async"
                    />
                  : <div className="marquee-proj-item__placeholder">
                      <span>{proj.title}</span>
                    </div>
                }
                <div className="marquee-proj-item__label"><span>{proj.title}</span></div>
              </Link>
            );
            return (
              <div className="home-project-marquee__rows">
                <MarqueeStrip speed={50}>
                  {row1.map(renderItem)}
                </MarqueeStrip>
                <MarqueeStrip speed={50} reverse={true}>
                  {row2.map(renderItem)}
                </MarqueeStrip>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── 5. ABOUT / COPYWRITING ─────────────────────── */}
      <section className="home-about" id="about">
        <div className="container home-about__inner">
          {settings.homepage_about_logo
            ? <SmoothImg
                src={`${import.meta.env.VITE_MEDIA_URL}${settings.homepage_about_logo}`}
                alt="Company logo"
                className="home-about__logo-img"
                loading="lazy"
                decoding="async"
              />
            : <div className="home-about__logo-placeholder">
                <span>LOGO</span>
              </div>
          }
          <h2 className="home-about__title">
            Your reliable partner for proven and well known access and locking solutions
          </h2>
          <p className="home-about__body">
            {settings.homepage_about_text}
          </p>
          {headlineWords.length > 0 && (
            <p className="home-about__rotating-line">
              <span className="home-about__static-text">
                {settings.homepage_about_headline_prefix || 'We have the'}&nbsp;
              </span>
              <AnimatedWord words={headlineWords} />
            </p>
          )}
        </div>
      </section>

      {/* ── 6. OUR STORY ───────────────────────────────── */}
      {storyMilestones.length > 0 && (
        <section className="home-story">
          <div className="container">
            <h2 className="home-story__title">Our Story</h2>
            <div className="story-layout">

              {/* Left — scrollable list (data-lenis-prevent lets it scroll
                  natively instead of Lenis hijacking the wheel) */}
              <div className="story-list" data-lenis-prevent>
                {storyMilestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className={`story-list-item ${activeStory === idx ? 'story-list-item--active' : ''}`}
                    onMouseEnter={() => setActiveStory(idx)}
                  >
                    <div className="story-list-item__year">{m.year}</div>
                    <p className="story-list-item__text">{m.content_text}</p>
                  </div>
                ))}
              </div>

              {/* Right — stacked images */}
              <div className="story-images">
                {storyMilestones.map((m, idx) => (
                  m.image_url && (
                    <div
                      key={m.id}
                      className={`story-image ${activeStory === idx ? 'story-image--active' : ''}`}
                    >
                      <SmoothImg
                        src={`${import.meta.env.VITE_MEDIA_URL}${m.image_url}`}
                        alt={m.year}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )
                ))}
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ── 7. PARTNER BRANDS MARQUEE ──────────────────── */}
      {partnerBrands.length > 0 && (
        <section className={`home-partners ${partnersVisible ? 'is-visible' : ''}`} ref={partnersRef}>
          <div className="container home-partners__container">
            <p className="home-partners__title">
              {settings.homepage_partners_title || 'Our partner brands'}
            </p>
            <MarqueeStrip speed={17} reverse={false}>
              {partnerBrands.map(brand => (
                <div key={brand.id} className="marquee-brand-item">
                  {brand.logo_path
                    ? <SmoothImg
                        src={`${import.meta.env.VITE_MEDIA_URL}${brand.logo_path}`}
                        alt={brand.name}
                        loading="lazy"
                        decoding="async"
                      />
                    : <span className="marquee-brand-item__name">{brand.name}</span>
                  }
                </div>
              ))}
            </MarqueeStrip>
          </div>
        </section>
      )}
    </>
  );
}
