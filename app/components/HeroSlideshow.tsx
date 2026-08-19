"use client"

import Image from 'next/image'
import { useEffect, useState } from 'react'

type HeroSlideshowProps = {
  images: string[]
}

export default function HeroSlideshow({ images }: HeroSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (images.length < 2) return

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [images.length])

  if (images.length === 0) return null

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={index === 0}
          unoptimized
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </div>
  )
}