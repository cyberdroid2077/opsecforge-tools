"use client";
import React, { useEffect } from 'react';

interface GoogleAdProps {
  slot?: string;
  className?: string;
}

export default function GoogleAd({ slot, className = "" }: GoogleAdProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense Error:", e);
    }
  }, []);

  return (
    <div className={`w-full overflow-hidden flex justify-center items-center my-6 ${className}`}>
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '90px' }}
        data-ad-client="ca-pub-7680565010427495"
        data-ad-slot={slot || "auto"}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
