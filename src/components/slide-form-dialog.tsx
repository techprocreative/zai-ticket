'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import type { HeroSlide } from '@/types/hero-slide'

const slideSchema = z.object({
  title: z.string().min(3),
  subtitle: z.string().optional(),
  imageUrl: z.string().url(),
  ctaLabel: z.string().optional(),
  ctaLink: z.string().url().optional(),
  sortOrder: z.preprocess((val) => Number(val), z.number().int().min(0)),
  isActive: z.boolean()
})

export type SlideFormValues = z.infer<typeof slideSchema>

interface SlideFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: SlideFormValues) => Promise<void>
  initialData?: HeroSlide | null
}

export function SlideFormDialog({ open, onOpenChange, onSubmit, initialData }: SlideFormDialogProps) {
  const form = useForm<SlideFormValues>({
    resolver: zodResolver(slideSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      imageUrl: '',
      ctaLabel: '',
      ctaLink: '',
      sortOrder: 0,
      isActive: true
    }
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        subtitle: initialData.subtitle || '',
        imageUrl: initialData.imageUrl,
        ctaLabel: initialData.ctaLabel || '',
        ctaLink: initialData.ctaLink || '',
        sortOrder: initialData.sortOrder,
        isActive: initialData.isActive
      })
    } else {
      form.reset()
    }
  }, [initialData, form])

  const handleSubmit = async (values: SlideFormValues) => {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Slide' : 'Tambah Slide Baru'}</DialogTitle>
          <DialogDescription>
            Kelola konten slider landing page
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul</FormLabel>
                  <FormControl>
                    <Input placeholder="Judul slide" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subjudul</FormLabel>
                  <FormControl>
                    <Input placeholder="Deskripsi singkat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Gambar</FormLabel>
                  <FormControl>
                    <Input placeholder="https://" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ctaLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teks Tombol</FormLabel>
                    <FormControl>
                      <Input placeholder="Beli tiket" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ctaLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Tombol</FormLabel>
                    <FormControl>
                      <Input placeholder="https://" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urutan</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Aktifkan Slide</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full">
                {initialData ? 'Simpan Perubahan' : 'Tambah Slide'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}



