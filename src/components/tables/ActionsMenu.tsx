"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

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
        <MoreVertical size={18} strokeWidth={1.8} className="icon-glow" />
      </button>

      {isOpen && menuPos && typeof document !== "undefined" &&
        createPortal(
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
                  <span className="flex-shrink-0 text-gray-500 dark:text-gray-400">{action.icon}</span>
                  <span className="flex-1 text-left">{action.label}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
