import { useEffect, useState } from 'react'
import { FaGithub, FaInstagram, FaSpotify, FaYoutube } from 'react-icons/fa'

const DEFAULT_CONTENT = {
  siteTitle: 'JG - Joceconc',
  description: 'Lanzamientos y contenido oficial.',
  songs: [
    {
      platform: 'youtube',
      album: '',
      title: 'Mandinga abrime la puerta',
      href: 'https://www.youtube.com/watch?v=toIvq65LjsA',
    },
  ],
}

const FIXED_SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/jg.joceconc/', kind: 'instagram' },
  { label: 'YouTube', href: 'https://www.youtube.com/@JG.JoceConC', kind: 'youtube' },
  { label: 'Spotify', href: 'https://open.spotify.com/intl-es/artist/6Pcn1nAehHseigjFWQEJ4W?si=7E_IBIhGQgmDaEyqx4j2Kg', kind: 'spotify' },
  { label: 'Letras.com', href: 'https://www.letras.com/jg/', kind: 'letras' },
]

const SHEET_ID = (import.meta.env.VITE_GOOGLE_SHEET_ID || '').trim()
const SONGS_SHEET_NAME = (import.meta.env.VITE_GOOGLE_SHEET_SONGS_TAB || 'canciones').trim()
const REFRESH_INTERVAL_MS = 60_000

const LetrasIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(12, 12) rotate(-15) scale(0.75)">
      <path d="M0 -6.5L1.9 -2.2L6.5 -1.5L3.2 1.5L4 6.2L0 3.5L-4 6.2L-3.2 1.5L-6.5 -1.5L-1.9 -2.2Z" fill="none" stroke="#cfcfcf" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  </svg>
)

const iconByKind = {
  youtube: FaYoutube,
  spotify: FaSpotify,
  instagram: FaInstagram,
  github: FaGithub,
  letras: LetrasIcon,
}

function parseGvizJson(rawText) {
  const start = rawText.indexOf('(')
  const end = rawText.lastIndexOf(')')

  if (start < 0 || end < 0) {
    throw new Error('Invalid Google Sheet response format')
  }

  return JSON.parse(rawText.slice(start + 1, end))
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function toEmbedUrl(href, platform) {
  const url = String(href || '').trim()

  if (!url) {
    return ''
  }

  if (platform === 'youtube') {
    if (url.includes('/embed/')) {
      return url
    }

    if (url.includes('watch?v=')) {
      return url.replace('watch?v=', 'embed/')
    }

    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0]
      return id ? `https://www.youtube.com/embed/${id}` : url
    }
  }

  if (platform === 'spotify') {
    if (url.includes('/embed/')) {
      const separator = url.includes('?') ? '&' : '?'
      return url.includes('theme=') ? url : `${url}${separator}utm_source=generator&theme=0`
    }

    try {
      const parsedUrl = new URL(url)

      if (parsedUrl.hostname === 'open.spotify.com') {
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)
        const resourceOffset = pathSegments[0]?.startsWith('intl-') ? 1 : 0
        const resourceType = pathSegments[resourceOffset]
        const resourceId = pathSegments[resourceOffset + 1]

        if (resourceType && resourceId) {
          return `https://open.spotify.com/embed/${resourceType}/${resourceId}?utm_source=generator&theme=0`
        }
      }
    } catch {
      return url
    }
  }

  return url
}

function getEmbedAllow(platform) {
  if (platform === 'spotify') {
    return 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
  }

  return 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
}

function getEmbedClassName(platform) {
  if (platform === 'spotify') {
    return 'h-[352px] w-full border-0'
  }

  return 'aspect-video w-full border-0'
}

async function fetchSheetRows(sheetId, tabName) {
  const endpoint = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${encodeURIComponent(tabName)}&tqx=out:json`
  const response = await fetch(endpoint, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`Google Sheet request failed (${response.status})`)
  }

  const rawText = await response.text()
  const data = parseGvizJson(rawText)
  const columns = (data.table?.cols || []).map((col, index) => normalizeKey(col.label || `col_${index + 1}`))
  const rows = data.table?.rows || []

  return rows.map((row) => {
    const rowObject = {}

    columns.forEach((columnName, index) => {
      const cellValue = row.c?.[index]?.v
      rowObject[columnName] = cellValue == null ? '' : String(cellValue)
    })

    return rowObject
  })
}

function normalizePlatform(value) {
  const platform = String(value || '').trim().toLowerCase()
  return platform || 'youtube'
}

function looksLikeHeaderRow(song) {
  const platform = normalizeKey(song.platform)
  const title = normalizeKey(song.title)
  const href = normalizeKey(song.href)

  return platform === 'plataforma' && (title === 'nombre' || title === 'nombre_de_la_cancion') && (href === 'link' || href === 'link_de_la_cancion')
}

function buildContent(songRows) {
  const songs = songRows
    .map((row) => {
      const platform = normalizePlatform(row.youtube || row.platform || row.plataforma || row.col_1)

      // Supports both formats:
      // 1) Youtube | Nombre de la cancion | link_de_la_cancion
      // 2) plataforma | album | nombre | link
      const hasFourthColumn = Boolean(String(row.col_4 || '').trim())
      const album = String(row.album || row.disco || (hasFourthColumn ? row.col_2 : '') || '').trim()
      const title = String(
        row.nombre_de_la_cancion || row.nombre || row.cancion || row.title || (hasFourthColumn ? row.col_3 : row.col_2) || '',
      ).trim()
      const href = String(row.link_de_la_cancion || row.link || row.url || row.href || row.col_4 || row.col_3 || '').trim()

      return {
        platform,
        album,
        title,
        href,
      }
    })
    .filter((song) => song.title && song.href)
    .filter((song) => !looksLikeHeaderRow(song))

  return {
    ...DEFAULT_CONTENT,
    songs: songs.length > 0 ? songs.reverse() : DEFAULT_CONTENT.songs,
  }
}

function App() {
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [introComplete, setIntroComplete] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (mediaQuery.matches) {
      setIntroComplete(true)
      return undefined
    }

    const introTimer = window.setTimeout(() => {
      setIntroComplete(true)
    }, 1850)

    return () => {
      window.clearTimeout(introTimer)
    }
  }, [])

  useEffect(() => {
    if (!SHEET_ID) {
      return undefined
    }

    let cancelled = false

    async function loadFromSheet() {
      try {
        const songRows = await fetchSheetRows(SHEET_ID, SONGS_SHEET_NAME)

        if (cancelled) {
          return
        }

        setContent(buildContent(songRows))
      } catch (error) {
        console.error('Google Sheet sync failed:', error)
      }
    }

    loadFromSheet()
    const intervalId = setInterval(loadFromSheet, REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [])

  const socialLinks = FIXED_SOCIAL_LINKS

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-brand-atmosphere px-2 py-8 font-sans text-brand-ink sm:px-4">
      <div className={`intro-overlay${introComplete ? ' intro-overlay--hidden' : ''}`} aria-hidden="true">
        <img src="/jocesign.png" alt="" className="intro-sign" />
      </div>

      <div
        className="pointer-events-none absolute -left-[18vw] -top-[10vw] -z-10 h-[42vw] w-[42vw] rounded-full bg-brand-ivory/10 blur-[90px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-[20vw] -right-[12vw] -z-10 h-[42vw] w-[42vw] rounded-full bg-brand-accent/45 blur-[90px]"
        aria-hidden="true"
      />

      <div
        className={`relative flex w-full max-w-[1120px] flex-col gap-6 transition-all duration-700 lg:flex-row lg:items-start lg:gap-8 ${
          introComplete ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-8 opacity-0'
        }`}
      >
        <aside className="w-full lg:w-[96px] lg:shrink-0">
          <nav
            className="grid grid-cols-4 gap-3 sm:grid-cols-4 lg:grid-cols-1 lg:justify-items-center"
            aria-label="Enlaces sociales"
          >
            {socialLinks.map((link, index) => {
              const Icon = iconByKind[link.kind]

              return (
                <a
                  key={link.kind}
                  className="flex h-14 w-14 animate-rise items-center justify-center rounded-full border border-brand-highlight/25 bg-brand-secondary text-brand-ivory transition duration-200 hover:-translate-y-0.5 hover:border-brand-highlight/45 hover:bg-brand-accent"
                  style={{ animationDelay: `${90 + index * 80}ms` }}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  title={link.label}
                >
                  {Icon ? <Icon className="h-5 w-5 shrink-0 text-brand-highlight" aria-hidden="true" /> : null}
                </a>
              )
            })}
          </nav>
        </aside>

        <section className="relative w-full max-w-[900px] overflow-visible rounded-none border border-brand-highlight/20 bg-brand-card p-4 text-brand-ink shadow-brand-card sm:p-8 lg:p-9">
          <img
            src="/jocesign.png"
            alt=""
            aria-hidden="true"
            className={`pointer-events-none absolute -right-10 -top-8 z-20 w-28 rotate-[7deg] grayscale drop-shadow-[0_12px_18px_rgba(0,0,0,0.25)] transition-opacity duration-500 sm:-right-16 sm:-top-10 sm:w-40 ${
              introComplete ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <header className="mb-6 animate-rise">
            <h1 className="my-1 font-serif text-[clamp(2.2rem,4vw,3rem)] font-semibold leading-none tracking-[0.01em] text-brand-ivory">
              {content.siteTitle}
            </h1>
            <p className="m-0 max-w-[56ch] text-[15px] leading-relaxed text-brand-highlight/75">
              {content.description}
            </p>
          </header>

          <section className="mb-6 grid gap-4" aria-label="Canciones">
            {content.songs.map((song, index) => (
              <article
                key={`${song.title}-${index}`}
                className="animate-rise rounded-none md:px-4 py-4 text-brand-ivory"
                style={{ animationDelay: `${110 + index * 60}ms` }}
              >
                <header className="mb-3">
                  <h2 className="mt-1 text-base font-semibold">{song.title}</h2>
                  <a
                    href={song.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-brand-highlight transition hover:text-brand-ivory"
                  >
                    Abrir en {song.platform}
                  </a>
                </header>
                {song.album ? <small className="mt-0.5 block text-sm text-brand-highlight/75">{song.album}</small> : null}
                <div className="mt-3 overflow-hidden rounded-none border border-brand-highlight/30 bg-black">
                  <iframe
                    src={toEmbedUrl(song.href, song.platform)}
                    title={song.title}
                    data-testid="embed-iframe"
                    className={getEmbedClassName(song.platform)}
                    loading="lazy"
                    frameBorder="0"
                    allowFullScreen=""
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow={getEmbedAllow(song.platform)}
                  />
                </div>
              </article>
            ))}
          </section>
        </section>
      </div>
    </main>
  )
}

export default App
