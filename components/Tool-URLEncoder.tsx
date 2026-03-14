"use client";
import React, { useState } from 'react';

const URLEncoder = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const handleEncode = () => {
    try {
      setOutput(encodeURIComponent(input));
    } catch (e) {
      setOutput('Error encoding URL');
    }
  };

  const handleDecode = () => {
    try {
      setOutput(decodeURIComponent(input));
    } catch (e) {
      setOutput('Error decoding URL. Ensure it is validly encoded.');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto bg-slate-800 text-slate-200 rounded-xl shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-white">URL Encoder / Decoder</h2>
      <textarea
        className="w-full p-2 border border-slate-600 bg-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter text or URL here..."
      />
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors font-medium" onClick={handleEncode}>Encode</button>
        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors font-medium" onClick={handleDecode}>Decode</button>
      </div>
      <textarea
        className="w-full p-2 border border-slate-600 bg-slate-900 rounded focus:outline-none"
        rows={4}
        value={output}
        readOnly
        placeholder="Result will appear here..."
      />
    </div>
  );
};

export default URLEncoder;
