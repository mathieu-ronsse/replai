"use client"

import { dataUrl, getImageSize } from '@/lib/utils'
import { CldImage } from 'next-cloudinary'
import Image from 'next/image'
import React from 'react'

const TransformedImage = ({ 
  image, 
  type, 
  title, 
  transformationConfig, 
  isTransforming, 
  setIsTransforming, 
  hasDownload = false,
  transformedImage = null
}: TransformedImageProps) => {
  const imageWidth = getImageSize(type, image, "width")
  const imageHeight = getImageSize(type, image, "height")
  const aspectRatio = imageWidth / imageHeight

  const downloadHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (transformedImage?.cloudinaryUrl) {
      window.open(transformedImage.cloudinaryUrl, '_blank');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex-between">
        <h3 className="h3-bold text-dark-600">
          Transformed
        </h3>

        {hasDownload && transformedImage?.cloudinaryUrl && (
          <button 
            className="download-btn" 
            onClick={downloadHandler}
          >
            <Image 
              src="/assets/icons/download.svg"
              alt="Download"
              width={24}
              height={24}
              className="pb-[6px]"
            />
          </button>
        )}
      </div>

      {transformedImage?.cloudinaryUrl ? (
        <div className="relative w-full">
          <div 
            className="relative w-full overflow-hidden rounded-lg"
            style={{ 
              paddingBottom: `${(1 / aspectRatio) * 100}%`
            }}
          >
            <CldImage 
              width={imageWidth}
              height={imageHeight}
              src={transformedImage.cloudinaryUrl}
              alt={title || "transformed image"}
              sizes="(max-width: 767px) 100vw, 50vw"
              className="absolute top-0 left-0 w-full h-full object-contain"
              loading="lazy"
            />
          </div>
          {transformedImage.localPath && (
            <p className="mt-2 text-sm text-gray-500">
              Local copy saved at: {transformedImage.localPath}
            </p>
          )}
        </div>
      ) : (
        <div className="transformed-placeholder">
          Transformed Image
        </div>
      )}

      {isTransforming && (
        <div className="transforming-loader">
          <Image 
            src="/assets/icons/spinner.svg"
            width={50}
            height={50}
            alt="spinner"
          />
          <p className="text-white/80">Please wait...</p>
        </div>
      )}
    </div>
  )
}

export default TransformedImage