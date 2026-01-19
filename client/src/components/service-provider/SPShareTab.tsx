import React from 'react';
import { toast } from 'react-hot-toast';

interface Props {
  profile: any;
}

const SPShareTab: React.FC<Props> = ({ profile }) => {
  const profileUrl = `${window.location.origin}/providers/${profile.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success('הקישור הועתק ללוח');
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`היי! בוא לראות את העמוד העסקי שלי: ${profileUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent('העמוד העסקי שלי');
    const body = encodeURIComponent(`היי,\n\nבוא לראות את העמוד העסקי שלי:\n${profileUrl}\n\nתודה!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">שיתוף קל</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-sm text-blue-800 mb-4">
          שתף את העמוד העסקי שלך עם לקוחות פוטנציאליים כדי שיוכלו לראות את הפרטים שלך, השירותים שאתה מציע ויצירת קשר מהירה.
        </p>
        <div className="bg-white p-3 rounded-lg break-all text-sm text-gray-700 font-mono">
          {profileUrl}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* WhatsApp Share */}
        <button
          onClick={shareWhatsApp}
          className="flex items-center justify-center gap-3 bg-[#25D366] text-white px-6 py-4 rounded-lg hover:bg-[#20BA5A] transition"
        >
          <span className="text-2xl">💬</span>
          <span className="font-medium">שתף בוואטסאפ</span>
        </button>

        {/* Email Share */}
        <button
          onClick={shareEmail}
          className="flex items-center justify-center gap-3 bg-gray-600 text-white px-6 py-4 rounded-lg hover:bg-gray-700 transition"
        >
          <span className="text-2xl">📧</span>
          <span className="font-medium">שתף במייל</span>
        </button>

        {/* Copy Link */}
        <button
          onClick={copyToClipboard}
          className="flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition"
        >
          <span className="text-2xl">📋</span>
          <span className="font-medium">העתק קישור</span>
        </button>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">תצוגה מקדימה</h3>
        <p className="text-sm text-gray-600 mb-4">
          כך יראה העמוד העסקי שלך ללקוחות:
        </p>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
        >
          פתח תצוגה מקדימה 🔗
        </a>
      </div>
    </div>
  );
};

export default SPShareTab;
