import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { mediaUrl } from '../../api/client';
import Breadcrumb from '../../components/public/Breadcrumb.jsx';
import RichText from '../../components/public/RichText.jsx';

export default function ProductDetail() {
  const { catSlug, subSlug, prodSlug } = useParams();
  const { data, loading } = useFetch(`/public/products/${catSlug}/${subSlug}/${prodSlug}`, [catSlug, subSlug, prodSlug]);
  const [activeImg, setActiveImg] = useState(0);
  if (loading) return null;
  if (!data) return <div className="empty">Product not found.</div>;

  const images = [data.cover_image, ...(data.images?.map(i => i.image_path) || [])].filter(Boolean);
  const heroImg = images[activeImg] || data.cover_image;

  return (
    <>
      <Breadcrumb items={[
        { to: '/', label: 'Home' },
        { to: '/products', label: 'Products' },
        { to: `/products/${catSlug}`, label: data.category_name },
        { to: `/products/${catSlug}/${subSlug}`, label: data.subcategory_name },
        { label: data.name },
      ]} />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container product-detail">
          <div>
            <div className="prod-hero">
              {heroImg ? <img src={mediaUrl(heroImg)} alt={data.name} fetchpriority="high" decoding="async" /> : <div style={{ height:'100%', background:'var(--color-bg-alt)'}} />}
            </div>
            {images.length > 1 && (
              <div className="prod-thumbs">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`prod-thumb ${i === activeImg ? 'is-active' : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={mediaUrl(img)} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h1>{data.name}</h1>
            {data.short_desc && <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: 'var(--sp-5)' }}>{data.short_desc}</p>}
            <RichText html={data.content_html} />
          </div>
        </div>
      </section>
      <style>{`
        .product-detail { display: grid; grid-template-columns: 1fr; gap: var(--sp-7); }
        @media (min-width: 768px) { .product-detail { grid-template-columns: 1fr 1fr; } }
        .prod-hero { aspect-ratio: 4/3; background: var(--color-bg-alt); border-radius: var(--radius-lg); overflow: hidden; }
        .prod-hero img { width:100%; height:100%; object-fit: cover; }
        .prod-thumbs { display: flex; gap: var(--sp-2); margin-top: var(--sp-3); flex-wrap: wrap; }
        .prod-thumb { width: 70px; height: 70px; border-radius: var(--radius); overflow: hidden; border: 2px solid transparent; transition: var(--transition); }
        .prod-thumb.is-active { border-color: var(--color-primary); }
        .prod-thumb img { width: 100%; height: 100%; object-fit: cover; }
      `}</style>
    </>
  );
}
