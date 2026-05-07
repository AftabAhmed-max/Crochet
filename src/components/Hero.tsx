'use client'
export default function Hero() {
  return (
    <section style={{
      background: 'var(--charcoal)',
      minHeight: '92vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '60px 24px',
    }}>

      {/* Background decorative circles */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '500px', height: '500px', borderRadius: '50%',
        border: '1px solid rgba(201,169,110,0.15)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '-50px', right: '-50px',
        width: '350px', height: '350px', borderRadius: '50%',
        border: '1px solid rgba(201,169,110,0.1)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '400px', height: '400px', borderRadius: '50%',
        border: '1px solid rgba(201,169,110,0.1)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '60px',
        alignItems: 'center',
      }}>

        {/* Left — Text */}
        <div>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '20px',
          }}>
            Handcrafted with love
          </p>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(42px, 6vw, 72px)',
            fontWeight: 500,
            color: 'var(--cream)',
            lineHeight: 1.15,
            marginBottom: '12px',
          }}>
            You Dream,
          </h1>

          <h1 style={{
            fontFamily: 'var(--font-script)',
            fontSize: 'clamp(48px, 7vw, 82px)',
            fontWeight: 600,
            color: 'var(--gold)',
            lineHeight: 1.1,
            marginBottom: '28px',
          }}>
            We Crochet.
          </h1>

          <p style={{
            color: 'rgba(250,247,242,0.6)',
            fontSize: '16px',
            lineHeight: 1.8,
            maxWidth: '420px',
            marginBottom: '40px',
            fontWeight: 300,
          }}>
            Every stitch tells a story. Discover our handcrafted crochet pieces —
            from dreamy bouquets to cozy home décor, made just for you.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button className="btn-primary">Shop Now</button>
            <button className="btn-outline" style={{
              color: 'var(--cream)',
              borderColor: 'rgba(250,247,242,0.4)',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(250,247,242,0.1)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              }}
            >
              Our Story
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: '40px', marginTop: '56px',
            borderTop: '1px solid rgba(201,169,110,0.2)',
            paddingTop: '32px', flexWrap: 'wrap',
          }}>
            {[
              { num: '500+', label: 'Happy Customers' },
              { num: '200+', label: 'Unique Designs' },
              { num: '100%', label: 'Handmade' },
            ].map(stat => (
              <div key={stat.label}>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  color: 'var(--gold)',
                  fontWeight: 500,
                }}>{stat.num}</p>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(250,247,242,0.5)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginTop: '4px',
                }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Image placeholder */}
        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            aspectRatio: '3/4',
            background: 'rgba(201,169,110,0.08)',
            border: '1px solid rgba(201,169,110,0.2)',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <span style={{
              fontFamily: 'var(--font-script)',
              fontSize: '32px',
              color: 'rgba(201,169,110,0.4)',
            }}>crochetinggg</span>
            <p style={{
              fontSize: '12px',
              color: 'rgba(250,247,242,0.2)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>Hero Image Here</p>
          </div>

          {/* Floating tag */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '-20px',
            background: 'var(--cream)',
            padding: '14px 20px',
            borderRadius: '4px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <p style={{
              fontSize: '11px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--brown-soft)',
              marginBottom: '4px',
            }}>New Arrival</p>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              color: 'var(--charcoal)',
            }}>Spring Bouquet</p>
            <p style={{
              color: 'var(--gold-dark)',
              fontSize: '14px',
              marginTop: '4px',
              fontWeight: 500,
            }}>₹ 899</p>
          </div>
        </div>

      </div>
    </section>
  )
}