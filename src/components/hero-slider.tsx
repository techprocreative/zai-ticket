'use client'

import { useEffect, useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import type { HeroSlide } from '@/types/hero-slide'

interface HeroSliderProps {
  slides: HeroSlide[]
  className?: string
}

export function HeroSlider({ slides, className }: HeroSliderProps) {
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  if (!slides.length) return null

  return (
    <div className={cn('relative', className)}>
      <Carousel className="w-full" setApi={setApi} opts={{ loop: true }}>
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className="grid gap-6 lg:grid-cols-2 items-center">
                <div className="space-y-4 text-left">
                  <p className="text-sm uppercase tracking-[0.3em] text-primary">Promo Spesial</p>
                  <h2 className="text-4xl font-bold leading-tight md:text-5xl">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p className="text-lg text-muted-foreground">
                      {slide.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    {slide.ctaLink && (
                      <a
                        href={slide.ctaLink}
                        className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                      >
                        {slide.ctaLabel || 'Pelajari lebih lanjut'}
                      </a>
                    )}
                    {slide.sortOrder !== undefined && (
                      <span className="text-sm text-muted-foreground">
                        Slide {slide.sortOrder + 1}
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-muted">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent" />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-2" />
        <CarouselNext className="-right-2" />
      </Carousel>

      <div className="mt-6 flex justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            className={cn(
              'h-2 w-10 rounded-full bg-muted transition-all',
              current === index ? 'bg-primary' : 'opacity-50'
            )}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
