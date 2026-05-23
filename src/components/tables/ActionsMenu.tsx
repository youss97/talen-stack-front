"use client";
import React, { useState, useRef, useEffect } from "react";

interface Action {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  show?: boolean;
}

interface ActionsMenuProps {
  actions: Action[];
}

export default function ActionsMenu({ actions }: ActionsMenuProps) {
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const visibleActions = actions.filter(action => action.show !== false);
  const isOpen = menuPos !== null;

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setMenuPos(null);
      return;
    }
    const rect = buttonRef.current!.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const close = (e: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setMenuPos(null);
      }
    };

    const closeOnScroll = () => setMenuPos(null);

    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", closeOnScroll, true);

    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [isOpen]);

  const handleActionClick = (action: Action) => {
    action.onClick();
    setMenuPos(null);
  };

  const colorClasses = {
    default: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
    primary: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
    success: "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20",
    warning: "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20",
    error: "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
  };

  if (visibleActions.length === 0) return null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={openMenu}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        title="Actions"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 9.75C9.41421 9.75 9.75 9.41421 9.75 9C9.75 8.58579 9.41421 8.25 9 8.25C8.58579 8.25 8.25 8.58579 8.25 9C8.25 9.41421 8.58579 9.75 9 9.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 4.5C9.41421 4.5 9.75 4.16421 9.75 3.75C9.75 3.33579 9.41421 3 9 3C8.58579 3 8.25 3.33579 8.25 3.75C8.25 4.16421 8.58579 4.5 9 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 15C9.41421 15 9.75 14.6642 9.75 14.25C9.75 13.8358 9.41421 13.5 9 13.5C8.58579 13.5 8.25 13.8358 8.25 14.25C8.25 14.6642 8.58579 15 9 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && menuPos && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, right: menuPos.right }}
          className="z-[9999] w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {visibleActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  colorClasses[action.color || 'default']
                }`}
              >
                <span className="flex-shrink-0">{action.icon}</span>
                <span className="flex-1 text-left">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
