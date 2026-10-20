'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive,
  subtitle,
  icon,
  accentColor,
}) => {
  return (
    <div className="glass-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: `rgba(${accentColor}, 0.12)`,
            border: `1px solid rgba(${accentColor}, 0.25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: `rgb(${accentColor})`,
          }}>
            {icon}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            {title}
          </span>
        </div>

        <div className={`badge ${isPositive ? 'badge-emerald' : 'badge-rose'}`}>
          {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          <span>{change}</span>
        </div>
      </div>

      {/* Main Stat Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <span style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
          {value}
        </span>
      </div>

      {/* Subtitle / Insight */}
      <div style={{
        fontSize: '0.78rem',
        color: 'var(--text-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        paddingTop: '10px',
      }}>
        <Info size={13} color="var(--text-subtle)" />
        <span>{subtitle}</span>
      </div>
    </div>
  );
};
