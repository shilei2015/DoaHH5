const FALLBACK_CLASS = 'is-solid-image-fallback'
const FALLBACK_COLOR = '#303030'
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="${FALLBACK_COLOR}"/></svg>`
const FALLBACK_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FALLBACK_SVG)}`
export const IMAGE_CDN_HOST = 'vclub-1v1.oss-us-west-1.aliyuncs.com'

let installed = false
let observer: MutationObserver | null = null
let sourcePatchInstalled = false

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

const clearCdnFallbackState = (img: HTMLImageElement) => {
  delete img.dataset.imageCdnFallbackTried
  delete img.dataset.imageCdnFallbackSrc
  delete img.dataset.imageCdnFallbackSrcset
}

export const normalizeImageCdnUrl = (source: string | null | undefined) => {
  const value = source?.trim()
  if (!value || !/^https?:\/\//i.test(value)) return source ?? ''

  try {
    const url = new URL(value)
    url.hostname = IMAGE_CDN_HOST
    url.port = ''
    url.protocol = 'https:'
    return url.toString()
  } catch {
    return value
  }
}

export const normalizeImageCdnUrls = (sources: Array<string | null | undefined>) => {
  return sources.map((source) => normalizeImageCdnUrl(source))
}

export const normalizeImageCdnSrcset = (srcset: string | null | undefined) => {
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

const normalizeImageAttributeValue = (name: string, value: unknown) => {
  const attrName = name.toLowerCase()
  if (attrName === 'src') return normalizeImageCdnUrl(String(value))
  if (attrName === 'srcset') return normalizeImageCdnSrcset(String(value))
  return String(value)
}

const isImageSourceElement = (element: unknown): element is HTMLImageElement | HTMLSourceElement => {
  return (
    element instanceof HTMLImageElement ||
    (typeof HTMLSourceElement !== 'undefined' && element instanceof HTMLSourceElement)
  )
}

const findPropertyDescriptor = (target: object, key: string): PropertyDescriptor | undefined => {
  let proto: object | null = target
  while (proto) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, key)
    if (descriptor) return descriptor
    proto = Object.getPrototypeOf(proto)
  }
}

const patchSourceProperty = (prototype: object | undefined, key: 'src' | 'srcset') => {
  if (!prototype) return

  const descriptor = findPropertyDescriptor(prototype, key)
  if (!descriptor?.set || !descriptor?.get) return

  Object.defineProperty(prototype, key, {
    configurable: true,
    enumerable: descriptor.enumerable,
    get() {
      return descriptor.get?.call(this)
    },
    set(value) {
      descriptor.set?.call(this, normalizeImageAttributeValue(key, value))
    },
  })
}

const installImageSourceNormalizer = () => {
  if (sourcePatchInstalled || typeof window === 'undefined') return
  sourcePatchInstalled = true

  const originalSetAttribute = Element.prototype.setAttribute
  Element.prototype.setAttribute = function setAttribute(this: Element, name: string, value: string) {
    const attrName = name.toLowerCase()
    const shouldNormalize =
      (this instanceof HTMLImageElement && (attrName === 'src' || attrName === 'srcset')) ||
      (typeof HTMLSourceElement !== 'undefined' && this instanceof HTMLSourceElement && attrName === 'srcset')

    if (shouldNormalize) {
      return originalSetAttribute.call(this, name, normalizeImageAttributeValue(name, value))
    }
    return originalSetAttribute.call(this, name, value)
  }

  patchSourceProperty(HTMLImageElement.prototype, 'src')
  patchSourceProperty(HTMLImageElement.prototype, 'srcset')

  if (typeof HTMLSourceElement !== 'undefined') {
    patchSourceProperty(HTMLSourceElement.prototype, 'srcset')
  }
}

const normalizeImageElementSources = (img: HTMLImageElement | HTMLSourceElement) => {
  if (img instanceof HTMLImageElement && isFallbackImage(img)) return false

  const src = img instanceof HTMLImageElement ? img.getAttribute('src') : ''
  const srcset = img.getAttribute('srcset')
  const normalizedSrc = normalizeImageCdnUrl(src)
  const normalizedSrcset = normalizeImageCdnSrcset(srcset)
  const shouldReplaceSrc = Boolean(src && normalizedSrc !== src)
  const shouldReplaceSrcset = Boolean(srcset && normalizedSrcset !== srcset)

  if (!shouldReplaceSrc && !shouldReplaceSrcset) return false

  if (shouldReplaceSrc) {
    img.setAttribute('src', normalizedSrc)
  }

  if (shouldReplaceSrcset) {
    img.setAttribute('srcset', normalizedSrcset)
  }

  return true
}

const applyCdnFallback = (img: HTMLImageElement) => {
  if (img.dataset.imageCdnFallbackTried === 'true') return false

  const changed = normalizeImageElementSources(img)
  if (!changed) return false

  img.dataset.imageCdnFallbackTried = 'true'
  img.dataset.imageCdnFallbackSrc = img.getAttribute('src') ?? ''
  img.dataset.imageCdnFallbackSrcset = img.getAttribute('srcset') ?? ''
  return true
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
  if (applyCdnFallback(event.target)) return
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
    normalizeImageElementSources(img)
    if (hasUsableSource(img)) return
    applySolidFallback(img)
  })
}

const inspectNode = (node: Node) => {
  if (isImageSourceElement(node)) {
    normalizeImageElementSources(node)
    if (node instanceof HTMLImageElement) applyFallbackIfSourceIsEmpty(node)
    return
  }

  if (!(node instanceof Element)) return
  node.querySelectorAll('img, source').forEach((element) => {
    if (!isImageSourceElement(element)) return
    normalizeImageElementSources(element)
    if (element instanceof HTMLImageElement) applyFallbackIfSourceIsEmpty(element)
  })
}

const startObservingImages = () => {
  if (!document.body || observer) return

  document.querySelectorAll('img, source').forEach((element) => {
    if (!isImageSourceElement(element)) return
    normalizeImageElementSources(element)
    if (element instanceof HTMLImageElement) applyFallbackIfSourceIsEmpty(element)
  })

  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && isImageSourceElement(mutation.target)) {
        const imageSource = mutation.target
        const src = imageSource.getAttribute('src') ?? ''
        const srcset = imageSource.getAttribute('srcset') ?? ''
        const isOwnCdnFallback =
          imageSource instanceof HTMLImageElement &&
          ((imageSource.dataset.imageCdnFallbackSrc && src === imageSource.dataset.imageCdnFallbackSrc) ||
            (imageSource.dataset.imageCdnFallbackSrcset && srcset === imageSource.dataset.imageCdnFallbackSrcset))

        if (!isOwnCdnFallback && imageSource instanceof HTMLImageElement) {
          clearCdnFallbackState(imageSource)
        }

        if (imageSource instanceof HTMLImageElement && !isFallbackImage(imageSource)) clearFallbackState(imageSource)
        normalizeImageElementSources(imageSource)
        if (imageSource instanceof HTMLImageElement) applyFallbackIfSourceIsEmpty(imageSource)
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

  installImageSourceNormalizer()
  window.addEventListener('error', handleImageError, true)
  window.addEventListener('load', handleImageLoad, true)

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObservingImages, { once: true })
  } else {
    startObservingImages()
  }
}
