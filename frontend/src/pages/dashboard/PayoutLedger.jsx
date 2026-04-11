import React from 'react';
import { motion } from 'framer-motion';

const PayoutLedger = ({ wallet, InsuranceInfo }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="bg-[#111827] rounded-xl border border-gray-800 overflow-hidden shadow-xl hover:border-gray-700 transition-all duration-300">
        <div className="p-8 border-b border-gray-800 flex flex-wrap gap-6 justify-between items-center bg-[#0B0F19]/40">
          <div>
            <h4 className="text-lg font-bold text-white tracking-tight uppercase">Disbursement Ledger</h4>
            <p className="text-[11px] text-gray-400 mt-1 font-black uppercase tracking-[0.2em] italic">Audited Environmental Payouts</p>
          </div>
          <div className="bg-indigo-500/10 text-indigo-400 px-6 py-4 rounded-2xl border border-indigo-500/20 flex flex-col items-end shadow-[0_0_20px_rgba(79,70,229,0.05)]">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Liquid Credit</span>
            <span className="text-2xl font-black text-white mt-1 italic tracking-tighter">₹{wallet?.wallet_balance?.toLocaleString?.() ?? "0"}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0B0F19]/60 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">
                <th className="px-8 py-5">Event Stamp</th>
                <th className="px-8 py-5">Location Node</th>
                <th className="px-8 py-5">Audit Status</th>
                <th className="px-8 py-5 text-right">Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 font-medium italic">
              {Array.isArray(wallet?.payouts) && wallet.payouts.map((p) => (
                <tr key={p.id} className="text-[12px] hover:bg-indigo-600/[0.03] transition-all group">
                  <td className="px-8 py-5 font-bold text-gray-300 group-hover:text-indigo-400 tracking-widest">{String(p.event_date || "").slice(0, 10)}</td>
                  <td className="px-8 py-5 text-gray-500 group-hover:text-gray-200 uppercase tracking-widest">{p.city}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${p.flagged ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {p.flagged ? "Flagged" : "Verified"}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-white text-sm tabular-nums">₹{Number(p.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!Array.isArray(wallet?.payouts) || wallet.payouts.length === 0) && (
            <div className="py-32 text-center px-4">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-600 italic">Awaiting Environmental Violation</p>
              <p className="text-[11px] text-gray-700 mt-2 font-medium italic uppercase">Node is active. Coverage is being tail-logged.</p>
            </div>
          )}
        </div>
      </div>
      <InsuranceInfo />
    </motion.div>
  );
};

export default PayoutLedger;
