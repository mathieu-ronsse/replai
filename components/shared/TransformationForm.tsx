"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Image from "next/image"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import {
  Form,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { aspectRatioOptions, creditFee, defaultValues, transformationTypes } from '@/constants'
import { CustomField } from './CustomField'
import { useEffect, useState, useTransition } from 'react'
import { AspectRatioKey, debounce, deepMergeObjects } from '@/lib/utils'
import { updateCredits } from "@/lib/actions/user.actions"
import MediaUploader from "./MediaUploader"
import { addImage, updateImage } from "@/lib/actions/image.actions"
import { useRouter } from "next/navigation"
import { InsufficientCreditsModal } from "./InsufficientCreditsModal"
import { useToast } from "../ui/use-toast"
import { replicateTransform } from "@/lib/replicate"
import ImageCarousel from "./ImageCarousel"

export const formSchema = z.object({
  title: z.string(),
  aspectRatio: z.string().optional(),
  color: z.string().optional(),
  prompt: z.string().optional(),
  publicId: z.string(),
})

const TransformationForm = ({ action, data = null, userId, type, creditBalance, config = null }: TransformationFormProps) => {
  const transformationType = transformationTypes[type];
  const [image, setImage] = useState(data);
  const [newTransformation, setNewTransformation] = useState<Transformations|null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformationConfig, setTransformationConfig] = useState(config);
  const [hasTransformation, setHasTransformation] = useState(false);
  const [transformedImages, setTransformedImages] = useState<Array<{ cloudinaryUrl: string }>>([]);
  const [selectedTransformedImage, setSelectedTransformedImage] = useState<{ cloudinaryUrl: string } | null>(null);
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  const initialValues = data && action === 'Update' ? {
    title: data?.title,
    aspectRatio: data?.aspectRatio,
    color: data?.color,
    prompt: data?.prompt,
    publicId: data?.publicId,
  } : defaultValues

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })
 
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!hasTransformation || !selectedTransformedImage) return;
    
    setIsSubmitting(true);

    try {
      const imageData = {
        title: values.title,
        publicId: image?.publicId,
        transformationType: type,
        width: image?.width,
        height: image?.height,
        config: transformationConfig,
        secureURL: image?.secureURL,
        transformationURL: selectedTransformedImage.cloudinaryUrl,
        aspectRatio: values.aspectRatio,
        prompt: values.prompt,
        color: values.color,
      }

      if(action === 'Add') {
        const newImage = await addImage({
          image: imageData,
          userId,
          path: '/'
        })

        if(newImage) {
          form.reset()
          setImage(data)
          router.push(`/transformations/${newImage._id}`)
        }
      }

      if(action === 'Update') {
        const updatedImage = await updateImage({
          image: {
            ...imageData,
            _id: data._id
          },
          userId,
          path: `/transformations/${data._id}`
        })

        if(updatedImage) {
          router.push(`/transformations/${updatedImage._id}`)
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save image. Please try again.",
        duration: 5000,
        className: "error-toast",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const onSelectFieldHandler = (value: string, onChangeField: (value:string) => void) => {
    const imageSize = aspectRatioOptions[value as AspectRatioKey]

    setImage((prevState: any) => ({
      ...prevState,
      aspectRatio: imageSize.aspectRatio,
      width: imageSize.width,
      height: imageSize.height,
    }))

    setNewTransformation(transformationType.config);

    return onChangeField(value)
  }

  const onInputChangeHandler = (fieldName: string, value: string, type: string, onChangeField: (value: string) => void) => {
    debounce(() => {
      setNewTransformation((prevState: any) => ({
        ...prevState,
        [type]: {
          ...prevState?.[type],
          [fieldName === 'prompt' ? 'prompt' : 'to' ]: value 
        }
      }))
    }, 1000)();
      
    return onChangeField(value)
  }

  const onTransformHandler = async () => {
    setIsTransforming(true)
    setHasTransformation(false)
    setTransformedImages([])
    setSelectedTransformedImage(null)

    try {
      await updateCredits(userId, creditFee)
      
      setTransformationConfig(
        deepMergeObjects(newTransformation, transformationConfig)
      )

      const transformationResult = await replicateTransform(image.secureURL)
      
      if (transformationResult) {
        const transformedImagesArray = Array.isArray(transformationResult) 
          ? transformationResult.map(item => ({ cloudinaryUrl: item.image || item.cloudinaryUrl }))
          : [{ cloudinaryUrl: transformationResult.cloudinaryUrl }];

        setTransformedImages(transformedImagesArray)
        setSelectedTransformedImage(transformedImagesArray[0])
        setHasTransformation(true)
        setNewTransformation(null)

        toast({
          title: "Transformation applied",
          description: "1 credit was deducted from your account",
          duration: 5000,
          className: "success-toast",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply transformation. Please try again.",
        duration: 5000,
        className: "error-toast",
      })
    } finally {
      setIsTransforming(false)
    }
  }

  useEffect(() => {
    if(image && (type === 'restore' || type === 'removeBackground')) {
      setNewTransformation(transformationType.config)
    }
  }, [image, transformationType.config, type])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {creditBalance < Math.abs(creditFee) && <InsufficientCreditsModal />}
        <CustomField
          control={form.control}
          name="title"
          formLabel="Image Title"
          className="w-full"
          render={({field}) => <Input {...field} className="input-field" />}
        />
      
        {type === 'fill' && (
          <CustomField
            control={form.control}
            name="aspectRatio"
            formLabel="Aspect Ratio"
            className="w-full"
            render={({field })=> (
              <Select
                  onValueChange={(value) => onSelectFieldHandler(value, field.onChange)}
                  value={field.value}
                >
                  <SelectTrigger className="select-field">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(aspectRatioOptions).map((key) => (
                      <SelectItem key={key} value={key} className="select-item">
                        {aspectRatioOptions[key as AspectRatioKey].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            )}/>
        )}
        {(type === 'remove' || type === 'recolor') && (
          <div className="prompt-field">
            <CustomField 
                control={form.control}
                name="prompt"
                formLabel={
                  type === 'remove' ? 'Object to remove' : 'Object to recolor'
                }
                className="w-full"
                render={({ field }) => (
                  <Input 
                    value={field.value}
                    className="input-field"
                    onChange={(e) => onInputChangeHandler(
                      'prompt',
                      e.target.value,
                      type,
                      field.onChange
                    )}
                  />
                )}
            />
            {type === 'recolor' && (
                <CustomField 
                  control={form.control}
                  name="color"
                  formLabel="Replacement Color"
                  className="w-full"
                  render={({ field }) => (
                    <Input 
                      value={field.value}
                      className="input-field"
                      onChange={(e) => onInputChangeHandler(
                        'color',
                        e.target.value,
                        'recolor',
                        field.onChange
                      )}
                    />
                  )}
                />
              )}
          </div>
        )}

        <div className="media-uploader-field">
          <CustomField 
            control={form.control}
            name="publicId"
            className="flex size-full flex-col"
            render={({field}) => (
              <MediaUploader
                onValueChange={field.onChange}
                setImage={setImage}
                publicId={field.value}
                image={image}
                type={type}
              />
            )}
          />

          {hasTransformation && transformedImages.length > 0 && (
            <div className="flex-1 space-y-4">
              <h3 className="h3-bold text-dark-600">
                Results
              </h3>
              <ImageCarousel 
                images={transformedImages}
                type={type}
                title={form.getValues().title}
                baseImage={image}
                onImageSelect={setSelectedTransformedImage}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Button 
            type="button"
            className="submit-button capitalize"
            disabled={isTransforming || newTransformation === null}
            onClick={onTransformHandler}
          >
            {isTransforming ? 'Transforming...' : 'Apply Transformation'}
          </Button>

          {hasTransformation && transformedImages.length > 0 && (
            <Button 
              type="submit"
              className="submit-button capitalize"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Image'}
            </Button>
          )}

          {isTransforming && (
            <div className="flex-center gap-2">
              <Image 
                src="/assets/icons/spinner.svg"
                width={24}
                height={24}
                alt="spinner"
                className="animate-spin"
              />
              <p className="text-dark-400">Please wait...</p>
            </div>
          )}
        </div>
      </form>
    </Form>
  )
}

export default TransformationForm