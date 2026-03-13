'use client';

import { useState } from 'react';
import TicketModal from './TicketModal';

export default function FloatingTicketButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 z-40 flex items-center justify-center p-3 text-white bg-red-600 rounded-full shadow-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 transition-transform hover:scale-110"
        title="Report a Bug"
      >
        <span className="sr-only">Report a Bug</span>
        🐞
      </button>

      <TicketModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}