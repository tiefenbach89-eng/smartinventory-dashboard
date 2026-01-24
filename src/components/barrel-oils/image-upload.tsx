'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface ImageUploadProps {
  currentImage?: string;
  onImageUploaded: (url: string, path: string) => void;
  onImageRemoved: () => void;
}

export function ImageUpload({ currentImage, onImageUploaded, onImageRemoved }: ImageUploadProps) {
  const supabase = createClient();
  const t = useTranslations('BarrelOils');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentImage);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Validierung
    if (!file.type.startsWith('image/')) {
      toast.error(t('imageErrorType'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error(t('imageErrorSize'));
      return;
    }

    try {
      setUploading(true);

      // Preview generieren
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Eindeutigen Dateinamen generieren
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload zu Supabase Storage
      const { data, error } = await supabase.storage
        .from('barrel-oils')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Public URL generieren
      const { data: { publicUrl } } = supabase.storage
        .from('barrel-oils')
        .getPublicUrl(filePath);

      onImageUploaded(publicUrl, filePath);
      toast.success(t('imageUploadSuccess'));
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(t('imageUploadError'));
      setPreview(currentImage);
    } finally {
      setUploading(false);
    }
  }, [supabase, currentImage, onImageUploaded, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleRemove = async () => {
    setPreview(undefined);
    onImageRemoved();
  };

  return (
    <div className='space-y-2'>
      <label className='block text-sm font-medium'>{t('image')}</label>

      {preview ? (
        <div className='relative'>
          <img
            src={preview}
            alt='Preview'
            className='h-48 w-full rounded-lg object-cover'
          />
          <button
            type='button'
            onClick={handleRemove}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90 absolute top-2 right-2 rounded-full p-2'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-input hover:border-primary flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : ''
          } ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className='text-center'>
              <div className='mb-2 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary' />
              <p className='text-muted-foreground text-sm'>{t('imageUploading')}</p>
            </div>
          ) : (
            <div className='text-center'>
              {isDragActive ? (
                <>
                  <Upload className='text-primary mx-auto mb-2 h-12 w-12' />
                  <p className='text-primary text-sm font-medium'>{t('imageDropHere')}</p>
                </>
              ) : (
                <>
                  <ImageIcon className='text-muted-foreground mx-auto mb-2 h-12 w-12' />
                  <p className='text-muted-foreground text-sm'>{t('imageDragDrop')}</p>
                  <p className='text-muted-foreground mt-1 text-xs'>{t('imageFormat')}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
