'use client';

import React from 'react';

export default function AdBanner() {
  const publisherId = process.env.NEXT_PUBLIC_AD_PUBLISHER_ID;

  if (!publisherId) {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-center my-6">
      <div 
        id="carbonads-container" 
        className="w-full max-w-[728px] min-h-[90px] bg-slate-900 flex items-center justify-center rounded"
      >
        <div data-publisher-id={publisherId} className="carbon-ads-placeholder">
          {/* Inject EthicalAds or Carbon Ads script here in the future */}
          <span>Advertisement</span>
        </div>
      </div>
    </div>
  );
}