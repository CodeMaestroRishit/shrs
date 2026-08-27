// Pulls the video id out of the common YouTube URL shapes admins tend to
// paste: watch?v=, youtu.be/, embed/, and shorts/.
const YOUTUBE_ID_PATTERN =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/

export function extractYouTubeId(url) {
  if (!url) return null
  const match = url.match(YOUTUBE_ID_PATTERN)
  return match ? match[1] : null
}
