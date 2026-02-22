import React from 'react';

const WhatsAppSection: React.FC = () => {
  const handleJoinClick = () => {
    // Add your WhatsApp group link here
    window.open('https://chat.whatsapp.com/YOUR_GROUP_LINK', '_blank');
  };

  return (
    <section 
      className="py-4 md:py-6 mb-8" 
      style={{ backgroundColor: '#223d3c', position: 'relative', overflow: 'visible' }}
      dir="rtl"
    >
      {/* Hand Image - Absolute positioning to stick to screen right edge */}
      <img 
        src="/images/hand-for-whatsapp.jpg" 
        alt="WhatsApp" 
        className="absolute bottom-0"
        style={{ 
          right: '0', 
          maxHeight: '300px', 
          width: 'auto',
          zIndex: 1
        }}
      />
      
      <div className="relative w-full flex justify-center">
        {/* Left Column - All content centered in the middle of the page */}
        <div className="flex flex-col items-center justify-center text-center gap-6 px-4 md:px-6 relative z-10">
            <h2 
              style={{ 
                color: '#c89b4c', 
                fontFamily: 'Assistant, sans-serif',
                fontSize: '47px',
                fontWeight: 'bold',
                lineHeight: '1.2'
              }}
            >
              רוצה להישאר בעניינים?<br />
              הצטרפו לקהילת הווצאפ שלנו
            </h2>
            <p 
              style={{ 
                color: '#f8f3f2', 
                fontFamily: 'Assistant, sans-serif',
                fontSize: '43px',
                fontWeight: 'normal',
                lineHeight: '1.2'
              }}
            >
              רק מה שחשוב, בלי רעש.
            </p>
            <div className="flex items-center gap-4">
              <img 
                src="/images/whatsapp-icon.jpg" 
                alt="WhatsApp" 
                className="w-16 h-16 md:w-20 md:h-20"
              />
              <button
                onClick={handleJoinClick}
                className="px-8 py-1 rounded-full text-white font-bold transition-opacity hover:opacity-90 flex items-center gap-2"
                style={{ 
                  backgroundColor: '#c89b4c',
                  fontFamily: 'Assistant, sans-serif',
                  fontSize: '20px',
                  height: '45px'
                }}
              >
                <span>להצטרפות לחצו</span>
                <span style={{ color: '#223d3c', fontSize: '28px', fontWeight: 'bold' }}>←</span>
              </button>
            </div>
          </div>
      </div>
    </section>
  );
};

export default WhatsAppSection;
