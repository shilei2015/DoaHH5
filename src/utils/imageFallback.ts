const FALLBACK_CLASS = 'is-solid-image-fallback'
const FALLBACK_COLOR = '#303030'
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="${FALLBACK_COLOR}"/></svg>`
const FALLBACK_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FALLBACK_SVG)}`
export const IMAGE_CDN_HOST = 'vclub-1v1.oss-us-west-1.aliyuncs.com'

let installed = false
let observer: MutationObserver | null = null

const isImageElement = (target: EventTarget | null): target is HTMLImageElement => {
  return target instanceof HTMLImageElement
}

const isFallbackImage = (img: HTMLImageElement) => {
  const source = img.currentSrc || img.src
  return img.dataset.solidImageFallback === 'true' && source.startsWith('data:image/svg+xml')
}

const clearFallbackState = (img: HTMLImageElement) => {
  delete img.dataset.solidImageFallback
  img.classList.remove(FALLBACK_CLASS)
}

export const normalizeImageCdnUrl = (source: string | null | undefined) => {
  const value = source?.trim()
  if (!value || !/^https?:\/\//i.test(value)) return source ?? ''

  try {
    const url = new URL(value)
    if (url.hostname === IMAGE_CDN_HOST) return value

    url.hostname = IMAGE_CDN_HOST
    url.port = ''
    return url.toString()
  } catch {
    return value
  }
}

const normalizeSrcset = (srcset: string | null | undefined) => {
  const value = srcset?.trim()
  if (!value) return srcset ?? ''

  return value
    .split(',')
    .map((candidate) => {
      const trimmed = candidate.trim()
      if (!trimmed) return trimmed

      const parts = trimmed.split(/\s+/)
      const normalizedUrl = normalizeImageCdnUrl(parts[0])
      return [normalizedUrl, ...parts.slice(1)].join(' ')
    })
    .join(', ')
}

const normalizeImageSource = (img: HTMLImageElement) => {
  if (isFallbackImage(img)) return

  const src = img.getAttribute('src')
  const normalizedSrc = normalizeImageCdnUrl(src)
  if (src && normalizedSrc !== src) {
    img.setAttribute('src', normalizedSrc)
  }

  const srcset = img.getAttribute('srcset')
  const normalizedSrcset = normalizeSrcset(srcset)
  if (srcset && normalizedSrcset !== srcset) {
    img.setAttribute('srcset', normalizedSrcset)
  }
}

const applySolidFallback = (img: HTMLImageElement) => {
  if (isFallbackImage(img)) return

  img.dataset.solidImageFallback = 'true'
  img.classList.add(FALLBACK_CLASS)
  img.removeAttribute('srcset')
  img.src = FALLBACK_SRC
}

const handleImageError = (event: Event) => {
  if (!isImageElement(event.target)) return
  applySolidFallback(event.target)
}

const handleImageLoad = (event: Event) => {
  if (!isImageElement(event.target) || isFallbackImage(event.target)) return
  clearFallbackState(event.target)
}

const hasUsableSource = (img: HTMLImageElement) => {
  const src = img.getAttribute('src')?.trim()
  const srcset = img.getAttribute('srcset')?.trim()
  return Boolean(src || srcset)
}

const applyFallbackIfSourceIsEmpty = (img: HTMLImageElement) => {
  queueMicrotask(() => {
    if (!img.isConnected || isFallbackImage(img)) return
    normalizeImageSource(img)
    if (hasUsableSource(img)) return
    applySolidFallback(img)
  })
}

const inspectNode = (node: Node) => {
  if (node instanceof HTMLImageElement) {
    normalizeImageSource(node)
    applyFallbackIfSourceIsEmpty(node)
    return
  }

  if (!(node instanceof Element)) return
  node.querySelectorAll('img').forEach((img) => {
    normalizeImageSource(img)
    applyFallbackIfSourceIsEmpty(img)
  })
}

const startObservingImages = () => {
  if (!document.body || observer) return

  document.querySelectorAll('img').forEach((img) => {
    normalizeImageSource(img)
    applyFallbackIfSourceIsEmpty(img)
  })

  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.target instanceof HTMLImageElement) {
        const img = mutation.target
        if (!isFallbackImage(img)) clearFallbackState(img)
        normalizeImageSource(img)
        applyFallbackIfSourceIsEmpty(img)
        return
      }

      mutation.addedNodes.forEach(inspectNode)
    })
  })

  observer.observe(document.body, {
    attributeFilter: ['src', 'srcset'],
    attributes: true,
    childList: true,
    subtree: true,
  })
}

export const installSolidImageFallback = () => {
  if (installed || typeof window === 'undefined') return
  installed = true

  window.addEventListener('error', handleImageError, true)
  window.addEventListener('load', handleImageLoad, true)

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObservingImages, { once: true })
  } else {
    startObservingImages()
  }
}
