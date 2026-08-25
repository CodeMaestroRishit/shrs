import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MiB — matches the storage bucket's server-side cap

export default function ImageUpload({ clubId, value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_BYTES) {
      setError(
        `That image is ${(file.size / (1024 * 1024)).toFixed(1)} MB — please compress it first (max 2 MB). Try tinypng.com or squoosh.app.`
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

  return (
    <div className="image-upload">
      {value && <img src={value} alt="Poster preview" className="image-upload-preview" />}
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      <p className="form-hint">Compress before uploading — max 2 MB. We're on Supabase's free storage tier, so every MB counts.</p>
      {uploading && <p>Uploading…</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
