'use client';

import { Heart, Image, SmilePlus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { User } from '@/services/authService';

interface ComposeTweetProps {
  user?: User;
  onTweet?: (content: string, mediaUrls?: string[]) => Promise<void>;
}

export const ComposeTweet = ({ user, onTweet }: ComposeTweetProps) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleTweet = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      await onTweet?.(content, selectedImages);
      setContent('');
      setSelectedImages([]);
    } catch (error) {
      console.error('Failed to post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSelectedImages((prev) => [...prev, event.target?.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
      {/* Compose Header */}
      <div className="flex gap-4">
        {/* Avatar */}
        <img
          src={user?.avatar || 'https://via.placeholder.com/48'}
          alt={user?.fullName}
          className="h-12 w-12 rounded-full object-cover"
        />

        {/* Input Area */}
        <div className="flex-1">
          {/* Text Input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening!?"
            rows={3}
            className="w-full resize-none bg-transparent text-xl text-slate-900 placeholder:text-slate-500 outline-none"
          />

          {/* Selected Images */}
          {selectedImages.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <img src={img} alt={`Selected ${idx}`} className="h-40 w-full object-cover" />
                  <button
                    onClick={() =>
                      setSelectedImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="absolute right-2 top-2 rounded-full bg-slate-900/60 p-2 text-white hover:bg-slate-900"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="flex gap-2 text-blue-600">
              <label className="cursor-pointer rounded-full p-2 hover:bg-blue-50">
                <Image size={20} />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <button className="rounded-full p-2 hover:bg-blue-50">
                <SmilePlus size={20} />
              </button>
              <button className="rounded-full p-2 hover:bg-blue-50">
                <Sparkles size={20} />
              </button>
            </div>

            {/* Post Button */}
            <button
              onClick={handleTweet}
              disabled={!content.trim() || isLoading}
              className={`rounded-full px-6 py-2 font-bold text-white transition ${
                content.trim()
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'cursor-not-allowed bg-slate-300'
              }`}
            >
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
