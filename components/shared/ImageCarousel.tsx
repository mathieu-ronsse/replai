"use client"

import { CldImage } from 'next-cloudinary'
import Image from 'next/image'
import { useState } from 'react'
import { Button } from '../ui/button'
import { getImageSize } from '@/lib/utils'

type ImageCarouselProps = {
  images: Array<{ cloudinaryUrl: string }>;
  type: string;
  title: string;
  baseImage: any;
  onImageSelect: (image: { cloudinaryUrl: string }) => void;
}

const ImageCarousel = ({ images, type, title, baseImage, onImageSelect }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    )
    onImageSelect(images[currentIndex === 0 ? images.length - 1 : currentIndex - 1])
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    )
    onImageSelect(images[currentIndex === images.length - 1 ? 0 : currentIndex + 1])
  }

  if (!images.length) return null

  return (
    <div className="relative w-full">
      <div className="relative h-[350px] w-full overflow-hidden rounded-lg">
        <CldImage
          width={getImageSize(type, baseImage, "width")}
          height={getImageSize(type, baseImage, "height")}
          src={images[currentIndex].cloudinaryUrl}
          alt={`${title} - ${currentIndex + 1}`}
          sizes="(max-width: 767px) 100vw, 50vw"
          className="transformed-image"
          loading="lazy"
        />
      </div>

      {images.length > 1 && (
        <>
          <Button 
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
            onClick={goToPrevious}
          >
            <Image 
              src="/assets/icons/arrow-left.svg"
              width={24}
              height={24}
              alt="Previous"
            />
          </Button>
          <Button 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
            onClick={goToNext}
          >
            <Image 
              src="/assets/icons/arrow-right.svg"
              width={24}
              height={24}
              alt="Next"
            />
          </Button>
          <div className="mt-2 text-center text-gray-500">
            Image {currentIndex + 1} of {images.length}
          </div>
        </>
      )}
    </div>
  )
}

export default ImageCarousel