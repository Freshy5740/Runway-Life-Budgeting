import { useLayoutEffect, useRef, useState } from 'react'

/** Tracks an element's width so charts draw at real pixel size (text stays readable on phones). */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setWidth(Math.max(240, Math.round(element.clientWidth)))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}
