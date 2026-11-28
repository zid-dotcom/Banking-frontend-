import React from 'react';
import { useTranslation } from 'react-i18next';


export default function ChatWithUsWidget({ onClick }) {
  const { t } = useTranslation();

  return (
    <div 
      className="fixed bottom-28 sm:bottom-32 lg:bottom-36 right-6 sm:right-8 z-50 flex items-center gap-2.5 cursor-pointer group select-none" 
      onClick={onClick}
    >
      
      {/* White Speech Pill: "Chat with us!" */}
      <div className="bg-white text-slate-900 font-extrabold text-[13px] tracking-tight px-4 py-2 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.18)] border border-slate-100/90 transition-transform duration-200 group-hover:scale-105 animate-chat-blink">
        {t("chatWidget.label", "Chat with us!")}
      </div>

      {/* Vibrant Green Circular Button with Speech Bubble Icon */}
      <button
        type="button"
        className="w-12 h-12 rounded-full bg-[#48c22b] hover:bg-[#3fb024] active:bg-[#369b1f] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.22)] transition-all duration-200 transform group-hover:scale-110 cursor-pointer flex-shrink-0 animate-chat-blink"
        aria-label={t("chatWidget.ariaLabel", "Chat with member desk on WhatsApp")}
      >
        {/* WhatsApp-style speech bubble with phone receiver */}
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 stroke-slate-900 fill-none stroke-[2.2]"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          <path d="M8.2 8.3c.3-.4.7-.5 1.1-.3l1.1.6c.4.2.5.6.3 1l-.5.8c.7 1.3 1.7 2.3 3 3l.8-.5c.4-.2.8-.1 1 .3l.6 1.1c.2.4.1.8-.3 1.1-.6.5-1.4.7-2.1.4-2.8-1-4.9-3.1-5.9-5.9-.3-.7-.1-1.5.4-2.1Z" />
        </svg>
      </button>

    </div>
  );
}
