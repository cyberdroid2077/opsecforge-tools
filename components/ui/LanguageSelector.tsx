'use client';

import React, { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';

declare global {
  interface window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

const LanguageSelector = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Function to initialize Google Translate
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,es,fr,de,zh-CN,ja,ko,ru,pt,it',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    // Load Google Translate script if not already present
    const addScript = () => {
      if (document.getElementById('google-translate-script')) return;
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    };

    addScript();
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative flex items-center gap-2 group">
      <div className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer text-gray-600 hover:text-blue-600">
        <Languages size={20} />
      </div>
      
      {/* Hidden container where Google Translate Widget will be rendered */}
      {/* We use CSS to hide the ugly default widget but keep it functional */}
      <div 
        id="google_translate_element" 
        className="absolute top-0 right-0 opacity-0 pointer-events-auto w-full h-full cursor-pointer overflow-hidden z-10"
      />

      <style jsx global>{`
        .goog-te-gadget {
          font-family: inherit !important;
          font-size: 0 !important;
        }
        .goog-te-gadget .goog-te-combo {
          margin: 0 !important;
          padding: 8px !important;
          border-radius: 4px !important;
          cursor: pointer !important;
          opacity: 0 !important;
          width: 40px !important;
          height: 40px !important;
        }
        /* Hide Google Translate Banner/Topbar */
        .goog-te-banner-frame.skiptranslate, .goog-te-gadget-icon {
          display: none !important;
        }
        body {
          top: 0 !important;
        }
        .goog-te-menu-value {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;
