"use client";
import React, { useState } from 'react';

const CaseConverter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const toCamelCase = (str: string) => {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  };

  const toSnakeCase = (str: string) => {
    return str.replace(/\W+/g, " ")
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  };

  const toPascalCase = (str: string) => {
    return str.replace(/\w\S*/g, (m) => m.charAt(0).toUpperCase() + m.substr(1).toLowerCase()).replace(/\s+/g, '');
  };

  const toKebabCase = (str: string) => {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  };

  const toConstantCase = (str: string) => {
    return toSnakeCase(str).toUpperCase();
  };

  const handleConvert = (type: string) => {
    switch (type) {
      case 'camel': setOutput(toCamelCase(input)); break;
      case 'snake': setOutput(toSnakeCase(input)); break;
      case 'pascal': setOutput(toPascalCase(input)); break;
      case 'kebab': setOutput(toKebabCase(input)); break;
      case 'constant': setOutput(toConstantCase(input)); break;
      default: setOutput(input);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto bg-slate-800 text-slate-200 rounded-xl shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-white">Case Converter</h2>
      <textarea
        className="w-full p-2 border border-slate-600 bg-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter text here..."
      />
      <div className="flex flex-wrap gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors" onClick={() => handleConvert('camel')}>camelCase</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors" onClick={() => handleConvert('snake')}>snake_case</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors" onClick={() => handleConvert('pascal')}>PascalCase</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors" onClick={() => handleConvert('kebab')}>kebab-case</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors" onClick={() => handleConvert('constant')}>CONSTANT_CASE</button>
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

export default CaseConverter;
