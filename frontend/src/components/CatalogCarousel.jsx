import React, { useRef } from 'react'

export default function CatalogCarousel({ title, subtitle, children, emptyMessage = 'Nothing is published here yet.' }) {
  const trackRef = useRef(null)
  const items = React.Children.toArray(children)
  const move = (direction) => {
    const track = trackRef.current
    if (!track) return
    const distance = Math.max(track.clientWidth * 0.82, 320)
    track.scrollBy({ left: direction * distance, behavior: 'smooth' })
  }

  return (
    <section className="orca-catalog-section">
      <div className="orca-catalog-section__heading">
        <div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>
        {items.length > 0 ? <div className="orca-carousel-controls"><button type="button" onClick={() => move(-1)} aria-label={`Scroll ${title} left`}>←</button><button type="button" onClick={() => move(1)} aria-label={`Scroll ${title} right`}>→</button></div> : null}
      </div>
      {items.length > 0 ? <div className="orca-carousel" ref={trackRef}>{items}</div> : <div className="orca-empty-state">{emptyMessage}</div>}
    </section>
  )
}
