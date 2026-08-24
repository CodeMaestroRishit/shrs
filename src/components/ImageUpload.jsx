import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ImageUpload({ clubId, value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

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
      {uploading && <p>Uploading…</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
