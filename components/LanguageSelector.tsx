'use client';

import React, { useEffect } from 'react';
import { Languages } from 'lucide-react';

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

export default function LanguageSelector() {
  useEffect(() => {
    const addScript = document.createElement('script');
    addScript.setAttribute(
      'src',
      '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    );
    document.body.appendChild(addScript);
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,zh-CN,zh-TW,es,ja,ko,fr,de',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group">
      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-full shadow-2xl backdrop-blur-sm group-hover:border-emerald-500/50 transition-all flex items-center overflow-hidden max-w-[40px] group-hover:max-w-[200px]">
        <div className="p-1 text-emerald-500">
          <Languages size={18} />
        </div>
        <div id="google_translate_element" className="opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
      
      <style jsx global>{`
        .goog-te-gadget-simple {
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
          font-family: inherit !important;
          display: flex !important;
          align-items: center !important;
        }
        .goog-te-gadget-simple img {
          display: none !important;
        }
        .goog-te-gadget-simple span {
          color: #94a3b8 !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
        }
        .goog-te-menu-value span {
          color: #94a3b8 !important;
        }
        .goog-te-menu-value span:nth-child(3) {
          display: none !important;
        }
        .goog-te-menu-value span:nth-child(5) {
          display: none !important;
        }
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
        }
        body {
          top: 0 !important;
        }
      `}</style>
    </div>
  );
}
