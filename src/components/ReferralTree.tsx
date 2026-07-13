import React, { useState, useMemo, useEffect } from 'react';
import { CustomerBusiness, Referral, TollaUser } from '../types';
import { ChevronRight, ChevronDown, User, Search, Trash2, Award, Users, Check, DollarSign } from 'lucide-react';
import { EasyRewardService } from '../services/EasyRewardService';

interface ReferralTreeProps {
  customers: CustomerBusiness[];
  referrals: Referral[];
  referrerReward: string;
  onRefresh?: () => void;
}

export const ReferralTree: React.FC<ReferralTreeProps> = ({ customers, referrals, referrerReward, onRefresh }) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSuperAdvocates, setFilterSuperAdvocates] = useState(false);
  const [tollaUsers, setTollaUsers] = useState<TollaUser[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const ulist = await EasyRewardService.getTollaUsers();
        setTollaUsers(ulist);
      } catch (err) {
        console.error(err);
      }
    };
    loadUsers();
  }, []);

  // Normalize phone helper
  const normalize = (num: string) => num.replace(/[^0-9]/g, '');

  // Helper to calculate statistics for a customer
  const getCustomerMetrics = (custId: string) => {
    const custReferrals = referrals.filter(r => r.customerBusinessId === custId);
    const successful = custReferrals.filter(r => r.status === 'redeemed');
    const redemptionsCount = successful.length;
    
    // Parse reward amount from referrerReward string
    const numMatch = referrerReward.match(/\d+/);
    const rewardValue = numMatch ? parseInt(numMatch[0]) : 50;
    const isCurrency = referrerReward.includes('R') || referrerReward.toLowerCase().includes('rand') || referrerReward.toLowerCase().includes('cash');
    
    let rewardsEarned = '';
    if (isCurrency) {
      rewardsEarned = `R${redemptionsCount * rewardValue}`;
    } else if (referrerReward.includes('%')) {
      rewardsEarned = `${redemptionsCount * rewardValue}% Off`;
    } else {
      rewardsEarned = `${redemptionsCount}x Payouts`;
    }

    // Attributed Spend / Revenue
    const revenue = successful.reduce((sum, r) => sum + (r.spendAmount || 0), 0);

    return {
      totalInvited: custReferrals.length,
      successfulVisits: redemptionsCount,
      rewardsEarned,
      revenueGenerated: revenue > 0 ? `R${revenue}` : 'R0'
    };
  };

  // Helper to determine customer level ranking
  const getRankConfig = (invites: number) => {
    if (invites >= 5) {
      return { label: 'DIAMOND', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' };
    } else if (invites >= 3) {
      return { label: 'GOLD', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    } else if (invites >= 1) {
      return { label: 'SILVER', color: 'bg-slate-400/10 text-slate-400 border-slate-400/20' };
    } else {
      return { label: 'BRONZE', color: 'bg-orange-700/10 text-orange-700 border-orange-700/20' };
    }
  };

  // Build client maps
  const { roots, allCustomerNodes, stats } = useMemo(() => {
    const phoneToCustomerMap = new Map<string, CustomerBusiness>();
    customers.forEach(c => {
      const u = tollaUsers.find(tu => tu.id === c.tollaUserId);
      if (u && u.phoneNumber) {
        phoneToCustomerMap.set(normalize(u.phoneNumber), c);
      }
    });

    const childToParentMap = new Map<string, string>(); // childId -> parentId
    referrals.forEach(ref => {
      let childCust: CustomerBusiness | undefined;
      if (ref.refereePhone) {
        childCust = phoneToCustomerMap.get(normalize(ref.refereePhone));
      }
      if (!childCust && ref.refereeEmail) {
        childCust = customers.find(c => {
          const u = tollaUsers.find(tu => tu.id === c.tollaUserId);
          return u && u.emailAddress && u.emailAddress.toLowerCase() === ref.refereeEmail!.toLowerCase();
        });
      }
      if (childCust) {
        childToParentMap.set(childCust.id, ref.customerBusinessId);
      }
    });

    // Roots are customers who weren't referred by anyone in the active list
    const rootCustomers = customers.filter(c => !childToParentMap.has(c.id));
    const redeemedReferrals = referrals.filter(r => r.status === 'redeemed');
    const totalRev = redeemedReferrals.reduce((sum, r) => sum + (r.spendAmount || 0), 0);

    return {
      roots: rootCustomers,
      allCustomerNodes: customers,
      stats: {
        totalMembers: customers.length,
        totalRedeemed: redeemedReferrals.length,
        attributedRevenue: totalRev > 0 ? `R${totalRev}` : 'R0'
      }
    };
  }, [customers, referrals, tollaUsers]);

  // Handle POPIA deletion request
  const handleDeleteCustomer = async (id: string, label: string) => {
    const confirmMessage = `⚠️ POPIA DATA COMPLIANCE REQUEST:\n\n` +
      `Are you sure you want to permanently delete and anonymize customer details for "${label}"?\n\n` +
      `To comply with the South African Protection of Personal Information Act (POPIA):\n` +
      `- All personal customer details will be deleted.\n` +
      `- Related referral records will be fully anonymized.\n` +
      `- This action CANNOT be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        await EasyRewardService.deleteCustomer(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error("Failed to delete customer data for POPIA compliance", err);
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter based on search/super advocates selection
  const filteredCustomersList = useMemo(() => {
    return allCustomerNodes.filter(c => {
      const metrics = getCustomerMetrics(c.id);
      const u = tollaUsers.find(tu => tu.id === c.tollaUserId);
      const phone = u?.phoneNumber || '';
      const email = u?.emailAddress || '';
      const matchesSearch = searchQuery
        ? phone.includes(searchQuery) ||
          email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.customIdentifier || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.tollaUserId.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesSuper = filterSuperAdvocates ? metrics.totalInvited >= 3 : true;
      return matchesSearch && matchesSuper;
    });
  }, [allCustomerNodes, searchQuery, filterSuperAdvocates, referrals, referrerReward, tollaUsers]);

  // Recursive render helper to display a clean nested network list (NOT MLM tree)
  const renderNetworkNode = (cust: CustomerBusiness, depth: number = 0) => {
    const metrics = getCustomerMetrics(cust.id);
    const rank = getRankConfig(metrics.totalInvited);
    const isExpanded = !!expandedNodes[cust.id];
    
    // Find customers directly referred by this customer
    const directReferees = referrals.filter(r => r.customerBusinessId === cust.id);
    
    // Find the actual customer records for those referees
    const refereeCustomers = directReferees.map(ref => {
      let match: CustomerBusiness | undefined;
      if (ref.refereePhone) {
        match = customers.find(c => {
          const u = tollaUsers.find(tu => tu.id === c.tollaUserId);
          return u && u.phoneNumber && normalize(u.phoneNumber) === normalize(ref.refereePhone!);
        });
      }
      if (!match && ref.refereeEmail) {
        match = customers.find(c => {
          const u = tollaUsers.find(tu => tu.id === c.tollaUserId);
          return u && u.emailAddress && u.emailAddress.toLowerCase() === ref.refereeEmail!.toLowerCase();
        });
      }
      return {
        referral: ref,
        customerRecord: match
      };
    });

    const hasChildren = refereeCustomers.length > 0;
    const relatedUser = tollaUsers.find(u => u.id === cust.tollaUserId);
    const contactLabel = relatedUser ? (relatedUser.phoneNumber || relatedUser.emailAddress || "[POPIA Deleted]") : "[POPIA Deleted]";

    return (
      <div key={cust.id} className="space-y-2">
        <div className="p-4 rounded-xl border border-divider bg-panel hover:bg-hover/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 relative group">
          
          {/* Main Info */}
          <div className="flex items-start gap-2.5">
            {hasChildren ? (
              <button 
                onClick={() => toggleExpand(cust.id)}
                className="p-1 rounded-lg hover:bg-hover text-txtsecondary hover:text-txtprimary mt-0.5 cursor-pointer"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6 h-6" />
            )}
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-txtprimary">{contactLabel}</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${rank.color}`}>
                  {rank.label}
                </span>
                {cust.customIdentifier && (
                  <span className="px-1.5 py-0.5 rounded bg-hover text-[8px] text-txtsecondary border border-divider font-bold">
                    ID: {cust.customIdentifier}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-txtsecondary">
                Code: <span className="font-mono text-rose-500 font-extrabold uppercase">{cust.tollaUserId}</span> • Joined: {new Date(cust.connectedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 self-end md:self-center shrink-0 text-left">
            <div className="text-center min-w-[56px]">
              <span className="text-[8px] uppercase tracking-wider text-txtsecondary block font-bold">Invited</span>
              <span className="text-xs font-extrabold text-txtprimary">{metrics.totalInvited}</span>
            </div>
            <div className="text-center min-w-[56px]">
              <span className="text-[8px] uppercase tracking-wider text-txtsecondary block font-bold">Visits</span>
              <span className="text-xs font-extrabold text-emerald-500">{metrics.successfulVisits}</span>
            </div>
            <div className="text-center min-w-[64px]">
              <span className="text-[8px] uppercase tracking-wider text-txtsecondary block font-bold">Earned</span>
              <span className="text-xs font-black text-txtprimary">{metrics.rewardsEarned}</span>
            </div>
            <div className="text-center min-w-[80px]">
              <span className="text-[8px] uppercase tracking-wider text-txtsecondary block font-bold">Revenue</span>
              <span className="text-xs font-black text-emerald-500">{metrics.revenueGenerated}</span>
            </div>
          </div>

          {/* POPIA Scrub Action */}
          {(relatedUser?.phoneNumber || relatedUser?.emailAddress) && (
            <button
              onClick={() => handleDeleteCustomer(cust.id, contactLabel)}
              title="Request deletion of this user's data (POPIA compliance)"
              className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-red-500/10 border border-divider hover:border-red-500/30 text-txtsecondary hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Children details (Nested vertically) */}
        {hasChildren && isExpanded && (
          <div className="pl-6 border-l border-divider/60 ml-3.5 space-y-2 pt-1 pb-2">
            {refereeCustomers.map(({ referral, customerRecord }) => {
              const label = referral.refereePhone || referral.refereeEmail || "[POPIA Deleted]";
              const isRedeemed = referral.status === 'redeemed';
              
              return (
                <div key={referral.id} className="space-y-2">
                  {customerRecord ? (
                    // If the friend also signed up and is a customer, render them recursively
                    renderNetworkNode(customerRecord, depth + 1)
                  ) : (
                    // Else show a clean simple list row of the referred visit
                    <div className="p-3 rounded-lg border border-divider bg-hover/20 flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-txtsecondary" />
                        <span className="text-txtsecondary font-medium">{label}</span>
                        {referral.refereeIdentifier && (
                          <span className="text-[9px] text-txtsecondary px-1.5 py-0.5 rounded bg-hover border border-divider font-bold">
                            ID: {referral.refereeIdentifier}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isRedeemed ? (
                          <>
                            <span className="text-[9px] font-black text-emerald-500 uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                              Visited ✓
                            </span>
                            {referral.spendAmount && (
                              <span className="text-[10px] text-txtsecondary font-extrabold">R{referral.spendAmount} spent</span>
                            )}
                          </>
                        ) : (
                          <span className="text-[9px] font-bold text-txtsecondary uppercase px-1.5 py-0.5 rounded bg-divider">
                            Not Redeemed
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Core Summary Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel p-4 rounded-2xl border border-divider flex flex-col justify-between space-y-1 bg-panel/30">
          <span className="text-[9px] uppercase font-bold text-txtsecondary tracking-wider block">Total Members</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-black text-txtprimary font-sans">{stats.totalMembers}</span>
            <Users className="w-3.5 h-3.5 text-txtsecondary hidden sm:inline" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-divider flex flex-col justify-between space-y-1 bg-panel/30">
          <span className="text-[9px] uppercase font-bold text-txtsecondary tracking-wider block">Referred Visits</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-black text-emerald-500 font-sans">{stats.totalRedeemed}</span>
            <Check className="w-3.5 h-3.5 text-[#10b981] hidden sm:inline" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-divider flex flex-col justify-between space-y-1 bg-panel/30">
          <span className="text-[9px] uppercase font-bold text-txtsecondary tracking-wider block">Attributed Spend</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-black text-emerald-500 font-sans">{stats.attributedRevenue}</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500 hidden sm:inline" />
          </div>
        </div>
      </div>

      {/* 2. Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-panel/20 p-4 rounded-xl border border-divider">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-txtsecondary" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer network..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-divider bg-hover text-xs text-txtprimary focus:border-[#10b981] outline-none font-semibold transition-all"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-txtsecondary select-none">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterSuperAdvocates}
              onChange={(e) => setFilterSuperAdvocates(e.target.checked)}
              className="w-4 h-4 rounded border-divider text-[#10b981] focus:ring-0 accent-[#10b981] shrink-0"
            />
            <span>VIP Ambassadors Only (3+ referrals)</span>
          </label>
        </div>
      </div>

      {/* 3. Customer Directory Registry Nodes */}
      <div className="space-y-3">
        {filteredCustomersList.length > 0 ? (
          // Display the direct root customer nodes and let owners drill down inline
          filteredCustomersList.filter(c => roots.some(r => r.id === c.id) || searchQuery !== '' || filterSuperAdvocates).map(cust => renderNetworkNode(cust))
        ) : (
          <div className="text-center py-12 text-txtsecondary italic text-xs bg-panel rounded-2xl border border-divider">
            No customers match the current filter criteria.
          </div>
        )}
      </div>

    </div>
  );
};
