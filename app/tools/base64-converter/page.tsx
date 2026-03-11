"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, FileType, ShieldCheck, Copy, Download, Trash2, RefreshCw, Check, FileUp, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// ============================================
// OpSecForge Base64 Converter
// A secure, local-only Base64 conversion tool
// ============================================

export default function Base64Converter() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  
  // Text tab state
  const [textInput, setTextInput] = useState('');
  const [textOutput, setTextOutput] = useState('');
  const [textMode, setTextMode] = useState<'encode' | 'decode'>('encode');
  const [textCopied, setTextCopied] = useState(false);
  
  // File tab state
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showShield, setShowShield] = useState(false);
  const [fileCopied, setFileCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // Text Tab Functions
  // ============================================
  
  const processText = useCallback((input: string, mode: 'encode' | 'decode') => {
    if (!input.trim()) {
      setTextOutput('');
      return;
    }
    
    try {
      if (mode === 'encode') {
        // Encode to Base64
        const encoded = btoa(unescape(encodeURIComponent(input)));
        setTextOutput(encoded);
      } else {
        // Decode from Base64
        const decoded = decodeURIComponent(escape(atob(input)));
        setTextOutput(decoded);
      }
    } catch (error) {
      setTextOutput(mode === 'decode' ? 'Invalid Base64 string' : 'Encoding error');
    }
  }, []);

  useEffect(() => {
    processText(textInput, textMode);
  }, [textInput, textMode, processText]);

  const handleTextCopy = async () => {
    if (!textOutput) return;
    await navigator.clipboard.writeText(textOutput);
    setTextCopied(true);
    setTimeout(() => setTextCopied(false), 2000);
  };

  const handleTextClear = () => {
    setTextInput('');
    setTextOutput('');
  };

  const handleTextSwap = () => {
    setTextMode(textMode === 'encode' ? 'decode' : 'encode');
    setTextInput(textOutput);
  };

  // ============================================
  // File Tab Functions
  // ============================================
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (selectedFile: File) => {
    setIsProcessing(true);
    setFile(selectedFile);
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFileBase64(result);
      setIsProcessing(false);
      
      // Trigger privacy shield animation
      setShowShield(true);
      setTimeout(() => setShowShield(false), 2000);
    };
    
    reader.onerror = () => {
      setIsProcessing(false);
      alert('Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleFileCopy = async () => {
    if (!fileBase64) return;
    await navigator.clipboard.writeText(fileBase64);
    setFileCopied(true);
    setTimeout(() => setFileCopied(false), 2000);
  };

  const handleFileClear = () => {
    setFile(null);
    setFileBase64('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadBinary = () => {
    if (!fileBase64) return;
    
    try {
        // Extract base64 data from data URL
        const base64Data = fileBase64.split(',')[1];
        const mimeType = fileBase64.match(/data:([^;]+)/)?.[1] || 'application/octet-stream';
        
        // Convert base64 to binary
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file?.name || 'decoded-file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        alert("Failed to decode binary data. Make sure input is valid Base64.");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      <main className="max-w-6xl mx-auto px-6 lg:px-24 py-12">
        {/* Breadcrumb */}
        <div className="mb-12 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">Base64 Converter</span>
        </div>

        {/* Tool Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold tracking-wider uppercase">Air-Gapped • Local Processing</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-6 leading-tight">
            Base64 Converter <br/>
            <span className="text-slate-400 font-medium text-3xl">Secure Text & File Encoding</span>
          </h1>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400">
                <ShieldCheck size={14} /> 100% Client-Side
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 p-1 bg-slate-900/50 rounded-2xl border border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === 'text'
                ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 border border-transparent'
            }`}
          >
            <FileType className="w-4 h-4" />
            Text
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === 'file'
                ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 border border-transparent'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            File
          </button>
        </div>

        {/* Tool Workspace */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 mb-24 backdrop-blur-sm">
            {activeTab === 'text' ? (
                /* Text Tab UI */
                <div className="space-y-8">
                    <div className="flex items-center justify-center gap-4 py-4">
                        <span className={`text-xs font-bold uppercase tracking-widest ${textMode === 'encode' ? 'text-emerald-400' : 'text-slate-600'}`}>Encode</span>
                        <button onClick={handleTextSwap} className="p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition-all text-slate-400 hover:text-white">
                            <RefreshCw size={18} />
                        </button>
                        <span className={`text-xs font-bold uppercase tracking-widest ${textMode === 'decode' ? 'text-emerald-400' : 'text-slate-600'}`}>Decode</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Input</label>
                                <button onClick={handleTextClear} className="text-slate-600 hover:text-rose-400 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                className="w-full h-64 bg-slate-950/50 border border-slate-800 rounded-2xl p-6 font-mono text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none resize-none"
                                placeholder={textMode === 'encode' ? "Paste plain text..." : "Paste Base64 string..."}
                            />
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Output</label>
                                {textOutput && (
                                    <button onClick={handleTextCopy} className="flex items-center gap-2 text-emerald-500 font-bold text-xs hover:text-emerald-400 transition-colors">
                                        {textCopied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Results</>}
                                    </button>
                                )}
                            </div>
                            <div className="relative group h-64">
                                <textarea
                                    readOnly
                                    value={textOutput}
                                    className="w-full h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 font-mono text-sm text-emerald-400/80 outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* File Tab UI */
                <div className="space-y-8">
                    {!file ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 ${
                                isDragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/20'
                            }`}
                        >
                            <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
                            <div className="flex flex-col items-center gap-6">
                                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                                    <FileUp className={`w-10 h-10 ${isDragging ? 'text-emerald-400' : 'text-slate-500'}`} />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-200">Drag & Drop File</p>
                                    <p className="text-slate-500 mt-2 text-sm uppercase tracking-widest font-bold">or click to browse local files</p>
                                </div>
                                <p className="text-xs text-slate-600 bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800">MAX 5MB • 100% OFFLINE</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-emerald-400"><FileType size={24} /></div>
                                    <div>
                                        <p className="font-bold text-slate-200">{file.name}</p>
                                        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">{formatFileSize(file.size)} • {file.type || 'Binary'}</p>
                                    </div>
                                </div>
                                <button onClick={handleFileClear} className="p-3 text-slate-500 hover:text-rose-400 transition-colors"><Trash2 size={20} /></button>
                            </div>

                            {isProcessing ? (
                                <div className="flex flex-col items-center justify-center p-12 gap-4">
                                    <RefreshCw className="animate-spin text-emerald-500" />
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Encrypting for display...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Base64 Result</label>
                                        <div className="flex gap-4">
                                            <button onClick={handleDownloadBinary} className="flex items-center gap-2 text-slate-400 font-bold text-xs hover:text-white transition-colors">
                                                <Download size={14} /> Download Binary
                                            </button>
                                            <button onClick={handleFileCopy} className="flex items-center gap-2 text-emerald-500 font-bold text-xs hover:text-emerald-400 transition-colors">
                                                {fileCopied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Base64</>}
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        readOnly
                                        value={fileBase64}
                                        className="w-full h-48 p-6 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-400 font-mono text-[10px] break-all outline-none resize-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Privacy Shield UI */}
        {showShield && (
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20 w-48 h-48 -translate-x-12 -translate-y-12"></div>
                    <div className="relative p-12 bg-slate-900/90 border border-emerald-500/30 backdrop-blur-xl rounded-full shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                        <ShieldCheck size={64} className="text-emerald-500" />
                        <div className="text-center">
                            <p className="text-emerald-400 font-bold text-lg">Privacy Shield Active</p>
                            <p className="text-slate-500 text-xs uppercase tracking-tighter">Processed 100% locally</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Educational SEO Section */}
        <section className="max-w-4xl mx-auto border-t border-slate-900 pt-24 pb-48">
            <article className="prose prose-invert prose-slate lg:prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-slate-100">The OpSec of Base64: Why Online Converters are Data Traps</h2>
                <p className="text-slate-400">
                    Base64 encoding is everywhere in modern computing. From embedding images in HTML to encoding authentication tokens, developers rely on this scheme daily. Yet, most don&apos;t realize the <strong>Operational Security (OpSec)</strong> risks when using public online converters.
                </p>

                <div className="grid gap-12 md:grid-cols-2 mt-12">
                    <div>
                        <h4 className="text-slate-100 font-bold mb-4 flex items-center gap-2">
                            <Lock className="text-rose-500" size={18} /> The Privacy Gap
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            When you paste sensitive data into a cloud-based converter, it travels over the network to a remote server. You have no guarantee that the provider isn&apos;t logging your API keys, credentials, or proprietary files.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-slate-100 font-bold mb-4 flex items-center gap-2">
                            <ShieldCheck className="text-emerald-500" size={18} /> Local Sovereignty
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            OpSecForge uses the browser-native <code>FileReader API</code>. This means the actual conversion happens in your device&apos;s memory. The data is transient and never touches our infrastructure.
                        </p>
                    </div>
                </div>

                <div className="mt-16 p-8 bg-slate-900 border border-slate-800 rounded-3xl">
                    <h3 className="text-slate-100 mt-0">Common Security Risks of Cloud Alternatives:</h3>
                    <ul className="text-slate-400 text-sm space-y-3">
                        <li><strong>Server-Side Logging:</strong> Your encoded data can persist in access logs for years.</li>
                        <li><strong>Ad-Network Tracking:</strong> Many free tools use trackers that capture form field inputs.</li>
                        <li><strong>Data Breach Vulnerability:</strong> If the converter service is breached, your pasted secrets become public property.</li>
                    </ul>
                </div>
            </article>
        </section>

      </main>

      {/* Footer CTA */}
      <footer className="mt-auto py-12 border-t border-slate-900 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to OpSecForge Hub
          </Link>
      </footer>
    </div>
  );
}
