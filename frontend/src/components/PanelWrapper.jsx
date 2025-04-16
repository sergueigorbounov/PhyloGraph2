// components/PanelWrapper.jsx
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function PanelWrapper({
  title,
  icon: Icon,
  footer,
  children,
  collapsible = true,
  defaultOpen = true,
  dark = true,
  className = ''
}) {
  const [open, setOpen] = useState(defaultOpen);

  const bgColor = dark ? 'bg-[#1e1e1e]' : 'bg-white';
  const textColor = dark ? 'text-white' : 'text-gray-900';
  const borderColor = dark ? 'border-[#333]' : 'border-gray-200';
  const hoverColor = dark ? 'hover:text-[#66ffcc]' : 'hover:text-gray-600';

  return (
    <div className={`rounded-2xl border ${bgColor} ${borderColor} shadow-md mb-4 w-full max-w-[720px] mx-auto ${textColor} ${className}`}>
      {title && (
        <div
          className={`flex items-center justify-between px-6 py-4 cursor-pointer select-none ${hoverColor}`}
          onClick={() => collapsible && setOpen(!open)}
        >
          <div className="flex items-center gap-2 text-lg font-semibold">
            {Icon && <Icon size={20} />}
            {title}
          </div>
          {collapsible &&
            (open ? <ChevronDown size={20} /> : <ChevronRight size={20} />)}
        </div>
      )}

      {(!collapsible || open) && (
        <div className="flex flex-col gap-4 px-6 pb-4">
          {children}
        </div>
      )}

      {footer && (
        <div className={`px-6 pt-2 pb-4 border-t ${dark ? 'border-[#333]' : 'border-gray-200'}`}>
          {footer}
        </div>
      )}
    </div>
  );
}
