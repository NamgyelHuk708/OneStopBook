'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { upsertFacility, uploadFacilityImage } from '@/app/admin/services/actions';
import type { Facility, FacilityCategory, FacilityStatus } from '@/lib/types/database';

interface ServiceFormProps {
  facility?: Facility;
}

const durationOptions = [
  { value: 1,   label: '1 hour' },
  { value: 1.5, label: '1.5 hours' },
  { value: 2,   label: '2 hours' },
  { value: 3,   label: '3 hours' },
];

export function ServiceForm({ facility }: ServiceFormProps) {
  const [name, setName] = useState(facility?.name ?? '');
  const [description, setDescription] = useState(facility?.description ?? '');
  const [category, setCategory] = useState<FacilityCategory>(facility?.category ?? 'indoor');
  const [surfaceType, setSurfaceType] = useState(facility?.surface_type ?? '');
  const [capacity, setCapacity] = useState(String(facility?.capacity ?? ''));
  const [pricePerHour, setPricePerHour] = useState(String(facility?.price_per_hour ?? ''));
  const [slotDuration, setSlotDuration] = useState<number>(facility?.slot_duration_hours ?? 1);
  const [status, setStatus] = useState<FacilityStatus>(facility?.status ?? 'open');
  const [rules, setRules] = useState<string[]>(facility?.rules?.length ? facility.rules : ['']);
  const [images, setImages] = useState<string[]>(facility?.images ?? []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addRule() { setRules(r => [...r, '']); }
  function removeRule(i: number) { setRules(r => r.filter((_, idx) => idx !== i)); }
  function updateRule(i: number, val: string) {
    setRules(r => r.map((rule, idx) => idx === i ? val : rule));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('file', file);
    const result = await uploadFacilityImage(formData);
    if (result.url) {
      setImages(imgs => [...imgs, result.url!]);
    } else {
      setUploadError(result.error ?? 'Upload failed');
    }
    setUploadingImage(false);
    // reset input so same file can be re-uploaded
    e.target.value = '';
  }

  function handleSubmit() {
    if (!name.trim()) { setError('Name is required'); return; }
    if (!pricePerHour || isNaN(Number(pricePerHour))) { setError('Valid price is required'); return; }
    setError(null);
    startTransition(async () => {
      const result = await upsertFacility({
        id: facility?.id,
        name,
        description,
        category,
        surface_type: surfaceType,
        capacity: capacity ? Number(capacity) : null,
        price_per_hour: Number(pricePerHour),
        slot_duration_hours: slotDuration,
        status,
        rules: rules.filter(r => r.trim()),
        images,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-input bg-danger-bg border border-danger text-danger text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-card border border-[#d0ebe0] p-6 space-y-4">
        <h3 className="text-sm font-medium text-g800 mb-2">Basic info</h3>

        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Football Court" />

        <div>
          <label className="block text-xs font-medium text-g800 mb-1.5 tracking-label uppercase">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-input border border-[#c0ddd0] bg-g50 text-g900 text-sm placeholder:text-g100 focus:outline-none focus:border-g400 resize-none"
            placeholder="Describe the facility…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-g800 mb-1.5 tracking-label uppercase">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as FacilityCategory)}
              className="w-full px-4 py-2.5 rounded-input border border-[#c0ddd0] bg-g50 text-g900 text-sm focus:outline-none focus:border-g400"
            >
              <option value="outdoor">Outdoor</option>
              <option value="indoor">Indoor</option>
              <option value="service">Service</option>
            </select>
          </div>
          <Input label="Surface type" value={surfaceType} onChange={e => setSurfaceType(e.target.value)} placeholder="Grass / Synthetic" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Capacity" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="22" />
          <Input label="Price per hour (Nu)" type="number" value={pricePerHour} onChange={e => setPricePerHour(e.target.value)} placeholder="500" />
        </div>

        {/* Slot duration */}
        <div>
          <label className="block text-xs font-medium text-g800 mb-1.5 tracking-label uppercase">
            Booking slot duration
          </label>
          <p className="text-xs text-g600 mb-2">How long is each booking slot? (e.g. 2 hrs for football, 1 hr for indoor courts)</p>
          <div className="flex flex-wrap gap-2">
            {durationOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSlotDuration(opt.value)}
                className={`px-4 py-1.5 rounded-pill text-sm font-medium border transition-all ${
                  slotDuration === opt.value
                    ? 'bg-g400 text-g50 border-g400'
                    : 'bg-white text-g600 border-[#d0ebe0] hover:border-g400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-g800 mb-1.5 tracking-label uppercase">Status</label>
          <div className="flex gap-2">
            {(['open', 'delayed', 'closed'] as FacilityStatus[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-4 py-1.5 rounded-pill text-xs font-medium border transition-all capitalize ${
                  status === s
                    ? s === 'open' ? 'bg-success-bg text-success border-success/30'
                      : s === 'delayed' ? 'bg-warning-bg text-warning-text border-warning/30'
                      : 'bg-danger-bg text-danger border-danger/30'
                    : 'bg-white text-g600 border-[#d0ebe0] hover:border-g400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-card border border-[#d0ebe0] p-6">
        <h3 className="text-sm font-medium text-g800 mb-1">Images</h3>
        <p className="text-xs text-g600 mb-4">Upload photos of the facility. First image is used as the cover.</p>

        {uploadError && (
          <div className="mb-3 px-3 py-2 rounded-input bg-danger-bg border border-danger text-danger text-xs">
            Upload failed: {uploadError}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-[10px] overflow-hidden border border-[#d0ebe0]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImages(imgs => imgs.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-danger hover:bg-white transition-colors"
              >
                <Trash2 size={10} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-g400/80 text-white py-0.5">
                  Cover
                </span>
              )}
            </div>
          ))}

          <label className={`w-20 h-20 rounded-[10px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors text-g600 ${
            uploadingImage ? 'border-g400 bg-g50' : 'border-[#c0ddd0] hover:border-g400'
          }`}>
            <Upload size={16} className={uploadingImage ? 'animate-pulse text-g400' : ''} />
            <span className="text-[10px] mt-1 text-center px-1">
              {uploadingImage ? 'Uploading…' : 'Add photo'}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </label>
        </div>
      </div>

      {/* Rules */}
      <div className="bg-white rounded-card border border-[#d0ebe0] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-g800">Rules & policies</h3>
          <button
            type="button"
            onClick={addRule}
            className="flex items-center gap-1.5 text-xs text-g400 hover:text-g600 font-medium"
          >
            <Plus size={13} /> Add rule
          </button>
        </div>
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={rule}
                onChange={e => updateRule(i, e.target.value)}
                placeholder={`Rule ${i + 1}`}
                className="flex-1 px-4 py-2.5 rounded-input border border-[#c0ddd0] bg-g50 text-g900 text-sm focus:outline-none focus:border-g400"
              />
              <button
                type="button"
                onClick={() => removeRule(i)}
                className="p-2 rounded-[8px] text-g600 hover:text-danger hover:bg-danger-bg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={isPending} size="lg">
        {isPending ? 'Saving…' : facility ? 'Save changes' : 'Create facility'}
      </Button>
    </div>
  );
}
