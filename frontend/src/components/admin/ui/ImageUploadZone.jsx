import { ArrowLeft, ArrowRight, ImagePlus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  compressImageFile,
  IMAGE_UPLOAD_MIME_TYPES,
  MAX_IMAGE_SIZE_LABEL,
} from '../../../utils/compressImage';

const MAX_IMAGES = 8;

export default function ImageUploadZone({ existingImages = [], onChange }) {
  const inputRef = useRef(null);
  const [keptImages, setKeptImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setKeptImages(Array.isArray(existingImages) ? existingImages : []);
    setNewFiles([]);
  }, [existingImages]);

  const newPreviews = useMemo(
    () => newFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [newFiles],
  );

  useEffect(() => () => {
    newPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [newPreviews]);

  const items = useMemo(() => [
    ...keptImages.map((image) => ({ type: 'existing', key: image.publicId || image.url, image })),
    ...newPreviews.map((preview, index) => ({ type: 'new', key: `${preview.file.name}-${preview.file.lastModified}-${index}`, preview, fileIndex: index })),
  ], [keptImages, newPreviews]);

  useEffect(() => {
    onChange?.({
      newFiles,
      keepPublicIds: keptImages.map((image) => image.publicId).filter(Boolean),
      imageOrder: items.map((item) => (
        item.type === 'existing'
          ? { type: 'existing', publicId: item.image.publicId }
          : { type: 'new', index: item.fileIndex }
      )),
    });
  }, [items, keptImages, newFiles, onChange]);

  const addFiles = async (fileList) => {
    const selectedFiles = Array.from(fileList || []);
    if (!selectedFiles.length) return;

    const accepted = [];
    const rejected = [];
    const availableSlots = MAX_IMAGES - items.length;

    for (const file of selectedFiles) {
      if (!IMAGE_UPLOAD_MIME_TYPES.includes(file.type)) {
        rejected.push(`${file.name}: use JPEG, PNG, or WebP.`);
        continue;
      }
      if (accepted.length >= availableSlots) {
        rejected.push(`${file.name}: maximum ${MAX_IMAGES} images allowed.`);
        continue;
      }

      try {
        const compressed = await compressImageFile(file);
        accepted.push(compressed);
      } catch (err) {
        rejected.push(`${file.name}: ${err.message}`);
      }
    }

    setError(rejected[0] || '');
    if (accepted.length) setNewFiles((current) => [...current, ...accepted]);
  };

  const removeItem = (item) => {
    setError('');
    if (item.type === 'existing') {
      setKeptImages((current) => current.filter((image) => image !== item.image));
      return;
    }
    setNewFiles((current) => current.filter((_, index) => index !== item.fileIndex));
  };

  const reorderItem = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const nextItems = [...items];
    [nextItems[index], nextItems[nextIndex]] = [nextItems[nextIndex], nextItems[index]];
    setKeptImages(nextItems.filter((item) => item.type === 'existing').map((item) => item.image));
    setNewFiles(nextItems.filter((item) => item.type === 'new').map((item) => item.preview.file));
  };

  return (
    <div>
      <div className="admin-field-label">Product Images</div>
      <button
        type="button"
        className="admin-upload-zone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
      >
        <ImagePlus size={24} />
        <span className="font-semibold">Click to upload or drag and drop</span>
        <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>
          JPEG, PNG, WebP up to {MAX_IMAGE_SIZE_LABEL} each - Max 8 images
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = '';
        }}
      />
      {error && <p className="admin-field-error">{error}</p>}

      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
            const imageUrl = item.type === 'existing' ? item.image.url : item.preview.url;
            return (
              <div key={item.key} className="admin-image-card">
                <img src={imageUrl} alt="" className="h-28 w-full object-cover" loading="lazy" decoding="async" />
                <button
                  type="button"
                  className="admin-image-remove"
                  onClick={() => removeItem(item)}
                  title="Remove image"
                >
                  <X size={14} />
                </button>
                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                  {index === 0 && <span className="admin-badge admin-badge-warning">Cover</span>}
                  <span className={`admin-badge ${item.type === 'new' ? 'admin-badge-success' : ''}`}>
                    {item.type === 'new' ? 'New' : 'Saved'}
                  </span>
                </div>
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <button
                    type="button"
                    className="admin-image-move"
                    onClick={() => reorderItem(index, -1)}
                    disabled={index === 0}
                    title="Move left"
                  >
                    <ArrowLeft size={13} />
                  </button>
                  <button
                    type="button"
                    className="admin-image-move"
                    onClick={() => reorderItem(index, 1)}
                    disabled={index === items.length - 1}
                    title="Move right"
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
