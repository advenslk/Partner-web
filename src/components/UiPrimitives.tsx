import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  XCircle,
} from 'lucide-react';

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F4F6F4] border border-[#E6E8E6] text-[#5A605C] p-6 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Layers className="w-8 h-8 text-[#2B7A19] mb-2" strokeWidth={1.6} />
        <span className="text-xs font-medium text-center">{fallbackTitle || alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function StatusIndicator({ status }: { status: string }) {
  let colorClass = 'text-[#4B514D]';
  let Icon = Clock;

  if (['Approved', 'Active', 'Confirmed', 'Executed', 'Completed', 'CONFIRMED'].includes(status)) {
    colorClass = 'text-[#2B7A19]';
    Icon = CheckCircle2;
  } else if (['Rejected', 'Cancelled', 'Terminated', 'SUSPENDED'].includes(status)) {
    colorClass = 'text-[#B91C1C]';
    Icon = XCircle;
  } else if (['Additional Information Required', 'Negotiation', 'Rescheduled', 'NEGOTIABLE', 'Renewal Due'].includes(status)) {
    colorClass = 'text-[#B45309]';
    Icon = AlertCircle;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${colorClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
}

export function SectionHeader({
  kicker,
  title,
  accent,
  subtitle,
  dark = false,
}: {
  kicker?: string;
  title: string;
  accent?: string;
  subtitle?: string;
  dark?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      {kicker && (
        <p className={`text-xs font-semibold tracking-wider uppercase mb-2.5 ${dark ? 'text-[#9EE855]' : 'text-[#2B7A19]'}`}>
          {kicker}
        </p>
      )}
      <h2
        className={`text-3xl sm:text-4xl font-bold tracking-tight leading-[1.12] ${
          dark ? 'text-white' : 'text-[#111312]'
        }`}
      >
        {title}{' '}
        {accent && (
          <span className={dark ? 'text-[#7FE03E]' : 'text-[#2B7A19]'}>{accent}</span>
        )}
      </h2>
      {subtitle && (
        <p className={`mt-3 text-base leading-relaxed ${dark ? 'text-[#A7ADA9]' : 'text-[#5A605C]'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-10 text-center">
      <div className="w-11 h-11 rounded-xl bg-[#E9FAD6] text-[#2B7A19] flex items-center justify-center mx-auto mb-3">
        <FileText className="w-5 h-5" />
      </div>
      <h3 className="text-base font-semibold text-[#111312]">{title}</h3>
      <p className="mt-1.5 text-sm text-[#5A605C] max-w-md mx-auto">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
