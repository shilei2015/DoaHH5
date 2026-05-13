const FALLBACK_CLASS = 'is-solid-image-fallback'
const FALLBACK_COLOR = '#303030'
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="${FALLBACK_COLOR}"/></svg>`
const FALLBACK_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FALLBACK_SVG)}`

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
    if (!img.isConnected || hasUsableSource(img) || isFallbackImage(img)) return
    applySolidFallback(img)
  })
}

const inspectNode = (node: Node) => {
  if (node instanceof HTMLImageElement) {
    applyFallbackIfSourceIsEmpty(node)
    return
  }

  if (!(node instanceof Element)) return
  node.querySelectorAll('img').forEach(applyFallbackIfSourceIsEmpty)
}

const startObservingImages = () => {
  if (!document.body || observer) return

  document.querySelectorAll('img').forEach(applyFallbackIfSourceIsEmpty)

  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.target instanceof HTMLImageElement) {
        const img = mutation.target
        if (!isFallbackImage(img)) clearFallbackState(img)
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
