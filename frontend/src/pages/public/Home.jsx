import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import HeroSlider from '../../components/public/HeroSlider.jsx';
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

/* ──────────────────────────────────────────────────────────
   Home
   ────────────────────────────────────────────────────────── */
export default function Home() {
  const { data, loading } = useFetch('/public/homepage', []);

  if (loading) return <div className="spinner" />;

  const banners          = data?.banners            || [];
  const categories       = data?.featuredCategories || [];
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

      {/* ── 2. CATEGORY BANNER CARDS ───────────────────── */}
      {categories.length > 0 && (
        <section className="home-cats">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/products/${cat.slug}`}
              className="home-cat-card"
            >
              {cat.image_path
                ? <img src={`${import.meta.env.VITE_MEDIA_URL}${cat.image_path}`} alt={cat.name} />
                : <div className="home-cat-card__placeholder" />
              }
              <div className="home-cat-card__overlay">
                <h3 className="home-cat-card__name">{cat.name}</h3>
                <p className="home-cat-card__hover">{cat.description}</p>
                <span className="home-cat-card__cta">Explore →</span>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* ── 3. PROFESSIONAL SERVICES ───────────────────── */}
      <section className="home-services">
        <div className="home-services__image-col">
          {settings.homepage_services_image
            ? <img
                src={`${import.meta.env.VITE_MEDIA_URL}${settings.homepage_services_image}`}
                alt="Our services"
              />
            : <div className="home-services__img-placeholder" />
          }
        </div>
        <div className="home-services__text-col">
          <p className="home-services__eyebrow">What We Offer</p>
          <h2 className="home-services__headline">
            {settings.homepage_services_headline || 'Our professional services are here to assist you'}
          </h2>
          <p className="home-services__sub">
            {settings.homepage_services_subtext || 'Get to know more about how we can help you from planning to construction stage.'}
          </p>
          <Link to="/services" className="btn btn-primary home-services__btn">
            Learn More
          </Link>
        </div>
      </section>

      {/* ── 4. PROJECT MARQUEE (2 rows, opposite directions) ── */}
      <section className="home-project-marquee">
        <div className="container">
          <h2 className="home-project-marquee__headline">
            {settings.homepage_marquee_headline || 'We have solutions for every project and application'}
          </h2>
        </div>
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
                ? <img
                    src={`${import.meta.env.VITE_MEDIA_URL}${proj.cover_image}`}
                    alt={proj.title}
                  />
                : <div className="marquee-proj-item__placeholder">
                    <span>{proj.title}</span>
                  </div>
              }
              <span className="marquee-proj-item__label">{proj.title}</span>
            </Link>
          );
          return (
            <div className="home-project-marquee__rows">
              <MarqueeStrip speed={45}>
                {row1.map(renderItem)}
              </MarqueeStrip>
              <MarqueeStrip speed={38} reverse={true}>
                {row2.map(renderItem)}
              </MarqueeStrip>
            </div>
          );
        })()}
      </section>

      {/* ── 5. ABOUT / COPYWRITING ─────────────────────── */}
      <section className="home-about">
        <div className="container home-about__inner">
          <div className="home-about__logo-col">
            {settings.homepage_about_logo
              ? <img
                  src={`${import.meta.env.VITE_MEDIA_URL}${settings.homepage_about_logo}`}
                  alt="Company logo"
                  className="home-about__logo-img"
                />
              : <div className="home-about__logo-placeholder">
                  <span>LOGO</span>
                </div>
            }
          </div>
          <div className="home-about__text-col">
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
        </div>
      </section>

      {/* ── 6. OUR STORY ───────────────────────────────── */}
      {storyMilestones.length > 0 && (
        <section className="home-story">
          <div className="container">
            <h2 className="home-story__title">Our Story</h2>
            <div className="story-timeline">
              {storyMilestones.map((m, idx) => (
                <div
                  key={m.id}
                  className={`story-item ${idx % 2 === 1 ? 'story-item--right' : ''}`}
                >
                  <div className="story-item__year">{m.year}</div>
                  <div className="story-item__content">
                    <p>{m.content_text}</p>
                  </div>
                  {m.image_url && (
                    <div className="story-item__image">
                      <img
                        src={`${import.meta.env.VITE_MEDIA_URL}${m.image_url}`}
                        alt={m.year}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 7. PARTNER BRANDS MARQUEE ──────────────────── */}
      {partnerBrands.length > 0 && (
        <section className="home-partners">
          <div className="container">
            <p className="home-partners__title">
              {settings.homepage_partners_title || 'Our partner brands'}
            </p>
          </div>
          <MarqueeStrip speed={35} reverse={false}>
            {partnerBrands.map(brand => (
              <div key={brand.id} className="marquee-brand-item">
                {brand.logo_path
                  ? <img
                      src={`${import.meta.env.VITE_MEDIA_URL}${brand.logo_path}`}
                      alt={brand.name}
                    />
                  : <span className="marquee-brand-item__name">{brand.name}</span>
                }
              </div>
            ))}
          </MarqueeStrip>
        </section>
      )}
    </>
  );
}
