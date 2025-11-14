export interface HeroSlide {
  id: string
  title: string
  subtitle?: string | null
  imageUrl: string
  ctaLabel?: string | null
  ctaLink?: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
