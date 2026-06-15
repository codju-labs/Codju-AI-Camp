import React from 'react';

interface ConceptCardProps {
    icon: string;
    title: string;
    children: React.ReactNode;
}

export const ConceptCard: React.FC<ConceptCardProps> = ({ icon, title, children }) => {
    return (
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 my-6 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                    {icon}
                </div>
                <div>
                    <h4 className="font-black text-slate-900 text-lg mb-1">{title}</h4>
                    <div className="text-slate-600 leading-relaxed text-[15px]">{children}</div>
                </div>
            </div>
        </div>
    );
};
