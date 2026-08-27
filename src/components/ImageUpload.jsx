import { useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const MAX_FILE_BYTES = 500 * 1024 // 500 KiB — matches the storage bucket's server-side cap

export default function ImageUpload({ clubId, value, onChange, label = 'poster' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_BYTES) {
      setError(
        `That image is ${(file.size / 1024).toFixed(0)} KB — please compress it first (max 500 KB). Try tinypng.com or squoosh.app.`
      )
      e.target.value = ''
      return
    }

    setUploading(true)
    setError(null)

    const extension = file.name.split('.').pop()
    const path = `${clubId}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage.from('event-posters').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('event-posters').getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  function handleRemove() {
    onChange('')
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="image-upload">
      {value ? (
        <div className="image-upload-preview-wrap">
          <img src={value} alt={`${label} preview`} className="image-upload-preview" />
          <span className="image-upload-selected">Selected {label}</span>
          <button
            type="button"
            className="image-upload-remove"
            onClick={handleRemove}
            aria-label={`Remove selected ${label}`}
            title={`Remove ${label}`}
          >
            <span aria-hidden="true">×</span>
            Remove
          </button>
        </div>
      ) : (
        <div className="image-upload-empty" aria-live="polite">No {label} selected</div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      <p className="form-hint">Compress before uploading — max 500 KB. We're on Supabase's free storage tier, so every KB counts.</p>
      {uploading && <p>Uploading…</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
