import React from 'react';

interface XAIFactor {
    feature: string;
    label: string;
    contribution: number;
    direction: 'increase' | 'decrease';
}

interface PremiumExplainerProps {
    xai_breakdown: XAIFactor[];
    premium: number;
}

const PremiumExplainer: React.FC<PremiumExplainerProps> = ({ xai_breakdown, premium }) => {
    // Top 2 factors for the summary
    const topFactors = [...xai_breakdown].sort((a, b) => b.contribution - a.contribution).slice(0, 2);
    
    return (
        <div className="bg-white rounded-3xl p-6 border border-surface-container shadow-sm">
            <h3 className="text-lg font-black text-on-background headline mb-2">
                Why is my premium ₹{premium}?
            </h3>
            <p className="text-xs text-outline font-bold uppercase tracking-widest mb-6">
                {topFactors[0]?.label} and {topFactors[1]?.label} are the biggest drivers this week.
            </p>

            <div className="space-y-4">
                {xai_breakdown.map((factor, idx) => (
                    <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-outline-variant">
                            <span>{factor.label}</span>
                            <span className={factor.direction === 'increase' ? 'text-error' : 'text-secondary'}>
                                {factor.direction === 'increase' ? '+' : '-'}{factor.contribution}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-surface rounded-full overflow-hidden flex">
                           <div 
                                className={`h-full rounded-full transition-all duration-1000 ${factor.direction === 'increase' ? 'bg-error' : 'bg-secondary'}`}
                                style={{ width: `${Math.min(100, factor.contribution * 2)}%` }}
                           ></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-surface rounded-2xl border border-surface-container">
                <p className="text-[10px] leading-relaxed text-outline font-medium">
                    Our ML model analyzes city risk, weather forecasts, and your platform stability to ensure you pay a fair price for parametric protection.
                </p>
            </div>
        </div>
    );
};

export default PremiumExplainer;
