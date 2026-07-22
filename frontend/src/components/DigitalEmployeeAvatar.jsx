import React, { useEffect, useId, useState } from 'react'

const AVATAR_STYLES = [
  { skin: '#7b4b32', skin2: '#a86c4a', hair: '#171015', jacket: '#0e4dff', shirt: '#dff8ff', accent: '#31e5ff' },
  { skin: '#d79b73', skin2: '#f2bd94', hair: '#3b221a', jacket: '#132c58', shirt: '#f7fbff', accent: '#00c8ff' },
  { skin: '#5b3426', skin2: '#82513a', hair: '#0d0b11', jacket: '#102c44', shirt: '#e8f5ff', accent: '#5f8dff' },
  { skin: '#8b573a', skin2: '#bc7a54', hair: '#25131a', jacket: '#133b50', shirt: '#f0fbff', accent: '#00d5c8' },
  { skin: '#4f2f24', skin2: '#754733', hair: '#0f0e13', jacket: '#2a245d', shirt: '#f6f1ff', accent: '#7999ff' },
  { skin: '#c78359', skin2: '#e4a77e', hair: '#3a2119', jacket: '#13335e', shirt: '#f7fbff', accent: '#35d7ff' },
]

function hairstyle(variant, hair) {
  const style = variant % 4
  if (style === 0) return <path d="M70 102c0-43 19-70 52-70 36 0 56 27 55 73-14-18-31-27-53-27-23 0-40 8-54 24Z" fill={hair} />
  if (style === 1) {
    return (
      <>
        <path d="M65 106c2-49 22-75 58-75 38 0 60 31 56 80-12-20-31-31-56-31-25 0-44 9-58 26Z" fill={hair} />
        <circle cx="122" cy="28" r="20" fill={hair} />
      </>
    )
  }
  if (style === 2) return <path d="M69 97c4-43 25-65 56-65 34 0 53 23 54 66-20-15-38-22-56-22-19 0-37 7-54 21Z" fill={hair} />
  return (
    <>
      <path d="M67 103c0-47 22-72 57-72 37 0 57 27 55 75-15-19-34-28-56-28-23 0-41 8-56 25Z" fill={hair} />
      <path d="M65 71c-15 14-20 35-17 63 8-11 15-18 24-23Z" fill={hair} />
      <path d="M179 72c14 16 19 37 14 64-7-11-14-19-23-24Z" fill={hair} />
    </>
  )
}

export default function DigitalEmployeeAvatar({ name, variant = 0, src = null, className = '' }) {
  const rawId = useId().replace(/:/g, '')
  const [resolvedSrc, setResolvedSrc] = useState(null)
  const style = AVATAR_STYLES[Math.abs(Number(variant) || 0) % AVATAR_STYLES.length]

  useEffect(() => {
    let cancelled = false
    setResolvedSrc(null)
    if (!src) return undefined
    const candidate = new Image()
    candidate.onload = () => { if (!cancelled) setResolvedSrc(src) }
    candidate.onerror = () => { if (!cancelled) setResolvedSrc(null) }
    candidate.src = src
    return () => { cancelled = true }
  }, [src])

  if (resolvedSrc) {
    return <img className={`orca-profile-avatar-image ${className}`} src={resolvedSrc} alt={`${name} digital employee avatar`} />
  }

  return (
    <svg className={`orca-profile-avatar-svg ${className}`} viewBox="0 0 240 240" role="img" aria-label={`${name} digital employee avatar`}>
      <defs>
        <linearGradient id={`bg-${rawId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#071a3b" />
          <stop offset="0.58" stopColor={style.jacket} />
          <stop offset="1" stopColor="#03101f" />
        </linearGradient>
        <linearGradient id={`skin-${rawId}`} x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor={style.skin2} />
          <stop offset="1" stopColor={style.skin} />
        </linearGradient>
        <linearGradient id={`jacket-${rawId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={style.jacket} />
          <stop offset="1" stopColor="#07111f" />
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="36" fill={`url(#bg-${rawId})`} />
      <circle cx="198" cy="40" r="74" fill={style.accent} opacity="0.12" />
      <circle cx="38" cy="210" r="82" fill="#0e4dff" opacity="0.12" />
      <path d="M19 58h58M163 183h58M28 75h28M184 166h28" stroke={style.accent} strokeWidth="2" opacity="0.42" />
      <circle cx="120" cy="111" r="61" fill={`url(#skin-${rawId})`} />
      {hairstyle(variant, style.hair)}
      <path d="M73 232c4-48 22-73 47-73s43 25 47 73Z" fill={style.shirt} />
      <path d="M38 240c5-47 34-75 69-78l13 41 13-41c35 3 64 31 69 78Z" fill={`url(#jacket-${rawId})`} />
      <path d="m107 162 13 41 13-41-13 14Z" fill={style.accent} opacity="0.92" />
      <ellipse cx="97" cy="112" rx="5.4" ry="4.4" fill="#11121a" />
      <ellipse cx="143" cy="112" rx="5.4" ry="4.4" fill="#11121a" />
      <path d="M107 139c9 7 18 7 27 0" fill="none" stroke="#4f261f" strokeWidth="4" strokeLinecap="round" />
      <path d="M116 120c-3 8-3 14 2 17" fill="none" stroke="#6c3d2e" strokeWidth="3" strokeLinecap="round" opacity="0.62" />
      <path d="M83 96c9-6 18-7 27-2M132 94c9-5 18-4 26 2" fill="none" stroke={style.hair} strokeWidth="5" strokeLinecap="round" />
      <circle cx="120" cy="111" r="67" fill="none" stroke={style.accent} strokeWidth="2" opacity="0.36" strokeDasharray="8 10" />
      <path d="M181 53a79 79 0 0 1 16 77" fill="none" stroke={style.accent} strokeWidth="4" strokeLinecap="round" opacity="0.82" />
      <circle cx="198" cy="129" r="6" fill={style.accent} />
      <rect x="14" y="14" width="212" height="212" rx="28" fill="none" stroke="rgba(255,255,255,.16)" />
    </svg>
  )
}
