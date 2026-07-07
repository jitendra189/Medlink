import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { uploadService } from '../../services/upload.service';
import { cn } from '../../utils/cn';

interface AvatarUploadProps {
  currentUrl?: string | null;
  initials: string;
  onUpload: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  gradient?: string;
}

export function AvatarUpload({
  currentUrl,
  initials,
  onUpload,
  size = 'lg',
  gradient = 'from-brand-500 to-emerald-500',
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  const sizeClass = {
    sm: 'h-12 w-12 text-sm',
    md: 'h-16 w-16 text-base',
    lg: 'h-24 w-24 text-2xl',
  }[size];

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const result = await uploadService.uploadAvatar(file);
      onUpload(result.url);
    } catch {
      setPreview(currentUrl ?? null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white overflow-hidden shadow-glow-sm',
          gradient,
          sizeClass,
        )}
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow-md ring-2 ring-white transition hover:bg-brand-700 disabled:opacity-70"
        title="Change photo"
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
