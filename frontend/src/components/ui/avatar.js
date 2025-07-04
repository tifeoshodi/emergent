import React from 'react'
import { cn } from '@/lib/utils'

export default function Avatar({ src, alt, className }) {
  return <img src={src} alt={alt} className={cn('h-8 w-8 rounded-full object-cover', className)} />
}
