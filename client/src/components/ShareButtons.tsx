// Social Share Component
import { useState } from 'react';

interface ShareButtonsProps {
  url?: string;
  title?: string;
  description?: string;
}

export default function ShareButtons({
  url = window.location.href,
  title = document.title,
  description = '',
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('לא ניתן להעתיק את הקישור');
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <div className="space-y-3" dir="rtl">
      <h3 className="font-bold text-lg">שתף מודעה זו:</h3>
      
      {/* Native Share (mobile) */}
      {'share' in navigator && (
        <button
          onClick={nativeShare}
          aria-label="שתף מודעה"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <span>📤</span>
          שתף
        </button>
      )}

      {/* Share Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="שתף בוואטסאפ"
          className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-lg font-bold hover:bg-[#20BA5A] transition"
        >
          <span>💬</span>
          WhatsApp
        </a>

        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="שתף בפייסבוק"
          className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3 rounded-lg font-bold hover:bg-[#0C63D4] transition"
        >
          <span>👍</span>
          Facebook
        </a>

        <a
          href={shareLinks.telegram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="שתף בטלגרם"
          className="flex items-center justify-center gap-2 bg-[#0088cc] text-white py-3 rounded-lg font-bold hover:bg-[#006699] transition"
        >
          <span>✈️</span>
          Telegram
        </a>

        <a
          href={shareLinks.email}
          aria-label="שתף באימייל"
          className="flex items-center justify-center gap-2 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition"
        >
          <span>📧</span>
          אימייל
        </a>
      </div>

      {/* Copy Link */}
      <button
        onClick={copyToClipboard}
        aria-label={copied ? 'הקישור הועתק' : 'העתק קישור'}
        className={`w-full py-3 rounded-lg font-bold transition ${
          copied
            ? 'bg-green-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {copied ? '✅ הקישור הועתק!' : '🔗 העתק קישור'}
      </button>
    </div>
  );
}
