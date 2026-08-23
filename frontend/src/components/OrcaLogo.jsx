import React from 'react'
import orcaLogo from '../assets/orca-logo.svg'

export default function OrcaLogo({ className = '', compact = false }) {
  return (
    <img
      src={orcaLogo}
      alt="ORCA"
      className={`orca-brand-logo ${compact ? 'orca-brand-logo--compact' : ''} ${className}`.trim()}
    />
  )
}
