'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';

interface Metric {
  score: number;
  promised?: string;
  actual?: string;
  slaTarget?: string;
  disputeRate?: string;
  completionRate?: string;
  avgDays?: string;
  trend: 'up' | 'down' | 'stable';
}

interface RecentFeedback {
  advisorAnonymized: string;
  metric: string;
  comment: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface SupplierRatings {
  supplier: {
    id: string;
    name: string;
    overallScore: number;
    responseCount: number;
    metrics: Record<string, Metric>;
    recentFeedback: RecentFeedback[];
  };
  advisorRatings: Array<{
    advisorId: string;
    advisorName: string;
    supplierScore: number;
    metrics: Record<string, number>;
    lastRated: string;
  }>;
}

interface RatingsDisplayProps {
  data?: SupplierRatings | null;
  loading?: boolean;
  compact?: boolean;
  advisorId?: string;
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />;
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-red-600" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400" />;
}

function ScoreColor({ score }: { score: number }): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 65) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-600';
  if (score >= 35) return 'text-orange-600';
  return 'text-red-600';
}

function ScoreBg({ score }: { score: number }): string {
  if (score >= 80) return 'bg-emerald-50';
  if (score >= 65) return 'bg-emerald-50';
  if (score >= 50) return 'bg-amber-50';
  if (score >= 35) return 'bg-orange-50';
  return 'bg-red-50';
}

export function SupplierAccountabilityCard({ data, loading }: { data?: SupplierRatings | null; loading?: boolean }) {
  if (loading) {
    return (
      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-12 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    );
  }

  if (!data?.supplier) return null;

  const supplier = data.supplier;
  const scoreColor = ScoreColor({ score: supplier.overallScore });
  const scoreBg = ScoreBg({ score: supplier.overallScore });

  const metricEntries = Object.entries(supplier.metrics).map(([key, metric]) => ({
    label: key
      .split(/(?=[A-Z])/)
      .join(' ')
      .replace(/^\w/, (c) => c.toUpperCase()),
    score: metric.score,
    trend: metric.trend,
    detail:
      metric.actual ||
      metric.slaTarget ||
      metric.disputeRate ||
      metric.completionRate ||
      metric.avgDays ||
      '',
  }));

  return (
    <div className="bg-white rounded-[10px] border-2 border-[#157A6E]/20 p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Supplier Accountability</h3>
          <p className="text-11px text-gray-400 mt-0.5">{supplier.name} · {supplier.responseCount} advisor responses</p>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#157A6E]/5 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-[#157A6E]" />
          <span className="text-9px font-semibold text-[#157A6E] uppercase tracking-wide">The Channel Standard</span>
          <ExternalLink className="w-3 h-3 text-[#157A6E]/60" />
        </div>
      </div>

      {/* Overall Score */}
      <div className={`${scoreBg} rounded-lg p-4 mb-5`}>
        <p className="text-11px text-gray-600 mb-1 uppercase font-semibold">Overall Score</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${scoreColor}`}>{supplier.overallScore}</span>
          <span className="text-sm text-gray-500">/100</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metricEntries.map((metric) => (
          <div key={metric.label} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-10px font-semibold text-gray-600 uppercase">{metric.label}</p>
              <TrendIcon trend={metric.trend} />
            </div>
            <div className="mb-2">
              <div className="flex items-baseline gap-1 mb-1">
                <span className={`text-sm font-bold ${ScoreColor({ score: metric.score })}`}>{metric.score}</span>
              </div>
              {/* Score bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    metric.score >= 80
                      ? 'bg-emerald-500'
                      : metric.score >= 65
                        ? 'bg-emerald-400'
                        : metric.score >= 50
                          ? 'bg-amber-500'
                          : metric.score >= 35
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                  }`}
                  style={{ width: `${metric.score}%` }}
                />
              </div>
            </div>
            {metric.detail && <p className="text-9px text-gray-500 mt-1">{metric.detail}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdvisorSentimentFeed({ data }: { data?: SupplierRatings | null }) {
  if (!data?.supplier.recentFeedback || data.supplier.recentFeedback.length === 0) return null;

  const sentiments = {
    positive: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100' },
    neutral: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100' },
    negative: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100' },
  };

  return (
    <div className="space-y-2">
      <p className="text-11px font-semibold text-gray-600 uppercase mb-3">Recent Advisor Feedback</p>
      {data.supplier.recentFeedback.map((feedback, idx) => {
        const sentiment = sentiments[feedback.sentiment];
        return (
          <div key={idx} className={`${sentiment.bg} border ${sentiment.border} rounded-lg p-3`}>
            <div className="flex items-start gap-2 mb-1">
              <span className={`text-8px font-bold px-1.5 py-0.5 rounded ${sentiment.badge}`}>
                {feedback.sentiment.toUpperCase()}
              </span>
              <p className="text-10px text-gray-600">{feedback.metric}</p>
              <span className="text-9px text-gray-400 ml-auto">{feedback.date}</span>
            </div>
            <p className={`text-11px leading-relaxed ${sentiment.text}`}>{feedback.comment}</p>
          </div>
        );
      })}
    </div>
  );
}

export function PerAdvisorRating({ data, advisorId }: { data?: SupplierRatings | null; advisorId?: string }) {
  if (!data || !advisorId) return null;

  const advisorRating = data.advisorRatings.find((r) => r.advisorId === advisorId);
  if (!advisorRating) return null;

  const score = advisorRating.supplierScore;
  const scoreColor = ScoreColor({ score });
  const scoreBg = ScoreBg({ score });

  const metricsArray = Object.entries(advisorRating.metrics).map(([key, value]) => ({
    label: key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, (c) => c.toUpperCase()),
    value,
  }));

  // Calculate days since last rated
  const lastRatedDate = new Date(advisorRating.lastRated);
  const daysSinceRated = Math.floor(
    (Date.now() - lastRatedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white rounded-[10px] border-2 border-[#157A6E]/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-11px font-semibold text-gray-600 uppercase">Supplier Rating</p>
          <p className="text-10px text-gray-400 mt-0.5">via The Channel Standard</p>
        </div>
      </div>

      {/* Score */}
      <div className={`${scoreBg} rounded-lg p-3 mb-3`}>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2 mb-3">
        {metricsArray.map((metric) => (
          <div key={metric.label}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-9px font-semibold text-gray-600 uppercase">{metric.label}</p>
              <span className={`text-xs font-bold ${ScoreColor({ score: metric.value })}`}>{metric.value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all ${
                  metric.value >= 80
                    ? 'bg-emerald-500'
                    : metric.value >= 65
                      ? 'bg-emerald-400'
                      : metric.value >= 50
                        ? 'bg-amber-500'
                        : metric.value >= 35
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                }`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Last Rated */}
      <p className="text-9px text-gray-500">
        Last rated {daysSinceRated === 0 ? 'today' : `${daysSinceRated} days ago`}
      </p>
    </div>
  );
}
