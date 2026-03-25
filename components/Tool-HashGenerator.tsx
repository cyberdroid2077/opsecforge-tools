"use client";
import SocialShare from '@/components/ui/SocialShare';
import React, { useState, useEffect, useCallback } from 'react';
import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

export default function SecureHashGenerator() {
  const [inputText, setInputText] = useState('');
  const [hashes, setHashes] = useState({
    md5: '',
    sha1: '',
    sha256: ''
  });
  
  const [bcryptState, setBcryptState] = useState({
    hash: '',
    rounds: 10,
    isComputing: false
  });

  const [copied, setCopied] = useState<string | null>(null);

  const computeSubtleHash = async (algorithm: string, text: string) => {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm, msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const updateHashes = useCallback(async (text: string) => {
    if (!text) {
      setHashes({ md5: '', sha1: '', sha256: '' });
      return;
    }

    try {
      const md5 = CryptoJS.MD5(text).toString();
      const sha1 = await computeSubtleHash('SHA-1', text);
      const sha256 = await computeSubtleHash('SHA-256', text);
      
      setHashes({ md5, sha1, sha256 });
    } catch (error) {
      console.error('Hashing error:', error);
    }
  }, []);

  useEffect(() => {
    updateHashes(inputText);
  }, [inputText, updateHashes]);

  const generateBcrypt = () => {
    if (!inputText) return;
    
    setBcryptState(prev => ({ ...prev, isComputing: true }));
    
    // Use setTimeout to allow UI to update before heavy synchronous computation (or use async bcrypt if available)
    setTimeout(() => {
      try {
        const hash = bcrypt.hashSync(inputText, bcryptState.rounds);
        setBcryptState(prev => ({ ...prev, hash, isComputing: false }));
      } catch (error) {
        console.error('Bcrypt error:', error);
        setBcryptState(prev => ({ ...prev, isComputing: false }));
      }
    }, 10);
  };

  const copyToClipboard = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const HashOutput = ({ label, value, type }: { label: string, value: string, type: string }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="relative flex items-center">
        <input
          type="text"
          readOnly
          value={value}
          className="w-full pl-3 pr-12 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono"
          placeholder={`Computed ${label} will appear here...`}
        />
        <button
          onClick={() => copyToClipboard(value, type)}
          disabled={!value}
          className={`absolute right-2 p-1.5 rounded-md transition-colors ${
            !value ? 'text-gray-400 cursor-not-allowed' : 
            copied === type ? 'text-green-500 bg-green-50 dark:bg-green-900/30' : 
            'text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'
          }`}
          title="Copy to clipboard"
        >
          {copied === type ? (
            <span className="text-xs font-bold">Copied!</span>
          ) : (
            <CopyIcon />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Secure Hash Generator</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Generate cryptographic hashes 100% locally in your browser. Your data never leaves your device.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Input Text
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-40 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none font-mono"
            placeholder="Enter text to hash here..."
          />
          
          <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">Bcrypt Generator</h3>
            <p className="text-xs text-blue-700 dark:text-blue-400 mb-4">
              Bcrypt is computationally expensive by design. It is generated on-demand rather than as-you-type.
            </p>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">Cost Factor (Rounds): {bcryptState.rounds}</label>
                <input 
                  type="range" 
                  min="4" 
                  max="14" 
                  value={bcryptState.rounds}
                  onChange={(e) => setBcryptState(prev => ({ ...prev, rounds: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <button
                onClick={generateBcrypt}
                disabled={!inputText || bcryptState.isComputing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bcryptState.isComputing ? 'Computing...' : 'Generate Bcrypt'}
              </button>
            </div>
            
            <HashOutput label="Bcrypt Hash" value={bcryptState.hash} type="bcrypt" />
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
            Standard Hashes (Real-time)
          </h3>
          
          <HashOutput label="SHA-256" value={hashes.sha256} type="sha256" />
          <HashOutput label="SHA-1" value={hashes.sha1} type="sha1" />
          <HashOutput label="MD5" value={hashes.md5} type="md5" />
          
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
            <p><strong>Note on MD5/SHA-1:</strong> These algorithms are considered cryptographically broken and should only be used for backward compatibility or checksum validation, not for secure password hashing.</p>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <SocialShare url="https://opsecforge.com/tools/hash-generator" title="Hash Generator - OpsecForge" />
      </div>
    </div>
  );
}
