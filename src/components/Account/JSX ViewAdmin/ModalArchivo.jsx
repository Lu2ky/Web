import { useRef } from 'react'
import '../CSS ViewAdmin/ModalArchivo.css'

function ModalArchivo({ label, accept = '*', onFiles }) {
  const inputRef = useRef(null)

  const handleChange = (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length && onFiles) onFiles(files)
  }

  const triggerFileDialog = () => {
    inputRef.current?.click()
  }

  return (
    <div className="upload-button" onClick={triggerFileDialog}>
      <button type="button" className="cta">
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden-input"
      />
    </div>
  )
}

export default ModalArchivo
