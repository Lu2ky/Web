import { useState } from 'react'
import '../CSS ViewAdmin/DropArea.css'

const isAccepted = (file, accept) => {
  if (!accept || accept === '*') return true
  return accept.split(',').map(a => a.trim()).some(a => {
    if (a.startsWith('.')) return file.name.toLowerCase().endsWith(a.toLowerCase())
    if (a.endsWith('/*')) return file.type.startsWith(a.replace('/*', '/'))
    return file.type === a
  })
}

function DropArea({ title, subtitle, accept = '*', onFiles, fileName }) {
  const [isDragging, setIsDragging] = useState(false)
  const [invalidFile, setInvalidFile] = useState(false)

  const prevent = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragOver = (event) => {
    prevent(event)
    setIsDragging(true)
  }

  const handleDragLeave = (event) => {
    prevent(event)
    setIsDragging(false)
  }

  const handleDrop = (event) => {
    prevent(event)
    const files = Array.from(event.dataTransfer?.files || [])
    const valid = files.filter(f => isAccepted(f, accept))
    if (valid.length) {
      setInvalidFile(false)
      if (onFiles) onFiles(valid)
    } else if (files.length) {
      setInvalidFile(true)
    }
    setIsDragging(false)
  }

  const handleKeyPress = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
  }

  return (
    <div
      className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label="Área para soltar archivos"
      data-accept={accept}
    >
      <span className="glow" aria-hidden />
      <div className="badge">
        <span className="doc-icon" aria-hidden>
          <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 4C8 2.89543 8.89543 2 10 2H21L30 11V40C30 41.1046 29.1046 42 28 42H10C8.89543 42 8 41.1046 8 40V4Z" stroke="#0F9C66" strokeWidth="2.5" />
            <path d="M20 2V12H30" stroke="#0F9C66" strokeWidth="2.5" />
            <path d="M14 22H24" stroke="#0F9C66" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M14 28H24" stroke="#0F9C66" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </span>
      </div>
      <div className="texts">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {fileName ? <span className="file-chip">{fileName}</span> : null}
        {invalidFile ? <span className="file-chip file-chip--error">Solo se aceptan archivos .xlsx</span> : null}
      </div>
    </div>
  )
}

export default DropArea
