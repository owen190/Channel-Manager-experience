'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Activity,
  BarChart3,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  RefreshCcw,
  AlertTriangle,
  Hexagon,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Database,
  Users,
  FileText,
  ArrowRightLeft,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { NAV_ITEMS_MANAGER } from '@/lib/constants';

type Tab = 'overview' | 'field-mapping' | 'deals-sync' | 'activity-log';

interface SyncStatus {
  connected: boolean;
  lastSync?: string;
  syncedCount: number;
  error?: string;
}

interface FieldMapping {
  ccField: string;
  hubspotField: string;
  type: string;
}

interface SyncLog {
  id: string;
  timestamp: string;
  action: string;
  recordCount: number;
  status: 'success' | 'error';
  error?: string;
}

export default function HubSpotIntegrationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: false,
    syncedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [advisorCount, setAdvisorCount] = useState(0);
  const [dealCount, setDealCount] = useState(0);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, advisorsRes, dealsRes, logsRes] = await Promise.all([
        fetch('/api/integrations/hubspot?action=status'),
        fetch('/api/live/advisors'),
        fetch('/api/live/deals'),
        fetch('/api/integrations/hubspot?action=sync-log'),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setSyncStatus(data);
      }

      if (advisorsRes.ok) {
        const data = await advisorsRes.json();
        setAdvisorCount(data.length);
      }

      if (dealsRes.ok) {
        const data = await dealsRes.json();
        setDealCount(data.length);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setSyncLogs(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (type: 'advisors' | 'deals' | 'full') => {
    setSyncing(true);
    try {
      const action =
        type === 'advisors' ? 'push-advisors' : type === 'deals' ? 'push-deals' : 'sync';
      const res = await fetch(`/api/integrations/hubspot?action=${action}`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setSyncStatus((prev) => ({
          ...prev,
          lastSync: new Date().toISOString(),
          syncedCount: data.syncedCount || 0,
        }));
        await fetchData();
        alert(`Successfully synced ${type}`);
      } else {
        alert('Sync failed. Please try again.');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('An error occurred during sync');
    } finally {
      setSyncing(false);
    }
  };

  const fieldMappings: FieldMapping[] = [
    { ccField: 'name', hubspotField: 'firstname + lastname', type: 'text' },
    { ccField: 'title', hubspotField: 'jobtitle', type: 'text' },
    { ccField: 'company', hubspotField: 'company', type: 'text' },
    { ccField: 'email', hubspotField: 'email', type: 'email' },
    { ccField: 'mrr', hubspotField: 'custom note', type: 'currency' },
    { ccField: 'pulse', hubspotField: 'custom note', type: 'text' },
    { ccField: 'tier', hubspotField: 'role_in_the_channel', type: 'select' },
    { ccField: 'friction', hubspotField: 'custom note', type: 'text' },
    { ccField: 'type', hubspotField: '"Trusted Advisor"', type: 'constant' },
    {
      ccField: 'lifecyclestage',
      hubspotField: 'based on tier (Elite→customer, etc)',
      type: 'derived',
    },
  ];

  const dealStageMappings = [
    { ccStage: 'Discovery', hubspotStage: 'appointmentscheduled' },
    { ccStage: 'Qualifying', hubspotStage: 'qualifiedtobuy' },
    { ccStage: 'Proposal', hubspotStage: 'presentationscheduled' },
    { ccStage: 'Negotiating', hubspotStage: 'decisionmakerboughtin' },
    { ccStage: 'Closed Won', hubspotStage: 'closedwon' },
    { ccStage: 'Stalled', hubspotStage: 'closedlost' },
  ];

  const formatDate = (date?: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex h-screen bg-[#F7F5F2]">
      <Sidebar
        items={NAV_ITEMS_MANAGER}
        activeView="settings"
        onViewChange={(id) => router.push(`/live/manager?view=${id}`)}
        role="manager"
        userName="Jordan Rivera"
        userInitials="JR"
      />

      <div className="flex-1 flex flex-col">
        <TopBar
          nudges={[] as any}
          userName="Jordan Rivera"
          userInitials="JR"
          pageTitle="HubSpot Integration"
        />

        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => router.push('/settings')}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1">
                <h1 className="font-newsreader text-2xl font-bold text-gray-900">
                  HubSpot Integration
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {syncStatus.connected ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-[12px] font-medium text-green-700">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-gray-600" />
                    <span className="text-[12px] font-medium text-gray-700">Disconnected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-[#e8e5e1] p-4">
                <p className="text-[11px] font-medium text-gray-600 mb-2">CC Advisors</p>
                <p className="font-newsreader text-2xl font-bold text-gray-900">
                  {loading ? '-' : advisorCount}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-[#e8e5e1] p-4">
                <p className="text-[11px] font-medium text-gray-600 mb-2">HubSpot Contacts</p>
                <p className="font-newsreader text-2xl font-bold text-gray-900">8,724</p>
              </div>
              <div className="bg-white rounded-lg border border-[#e8e5e1] p-4">
                <p className="text-[11px] font-medium text-gray-600 mb-2">Synced Records</p>
                <p className="font-newsreader text-2xl font-bold text-gray-900">
                  {syncStatus.syncedCount}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-[#e8e5e1] p-4">
                <p className="text-[11px] font-medium text-gray-600 mb-2">Last Sync</p>
                <p className="text-[13px] font-medium text-gray-900">
                  {syncStatus.lastSync ? formatDate(syncStatus.lastSync) : 'Never'}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#e8e5e1] gap-8 mb-8">
              {[
                { id: 'overview' as Tab, label: 'Overview' },
                { id: 'field-mapping' as Tab, label: 'Field Mapping' },
                { id: 'deals-sync' as Tab, label: 'Deals Sync' },
                { id: 'activity-log' as Tab, label: 'Activity Log' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 transition-colors text-[13px] font-medium ${
                    activeTab === tab.id
                      ? 'border-[#157A6E] text-[#157A6E]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-[#e8e5e1] p-6">
                  <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-4">
                    Sync Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-[#e8e5e1]">
                      <span className="text-[13px] text-gray-700">Connection Status</span>
                      <span
                        className={`text-[13px] font-medium ${
                          syncStatus.connected ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        {syncStatus.connected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-[#e8e5e1]">
                      <span className="text-[13px] text-gray-700">Last Sync Time</span>
                      <span className="text-[13px] font-medium text-gray-900">
                        {formatDate(syncStatus.lastSync)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-[13px] text-gray-700">Total Synced Records</span>
                      <span className="text-[13px] font-medium text-gray-900">
                        {syncStatus.syncedCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-[#e8e5e1] p-6">
                  <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSync('full')}
                      disabled={syncing}
                      className="px-4 py-2 bg-[#157A6E] text-white rounded-lg hover:bg-[#0f6960] transition-colors text-[13px] font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={fetchData}
                      className="px-4 py-2 border border-[#e8e5e1] rounded-lg hover:bg-[#F7F5F2] transition-colors text-[13px] font-medium flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Field Mapping Tab */}
            {activeTab === 'field-mapping' && (
              <div className="bg-white rounded-lg border border-[#e8e5e1] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-[#e8e5e1] bg-[#F7F5F2]">
                        <th className="px-6 py-4 text-left font-medium text-gray-700">
                          Channel Companion Field
                        </th>
                        <th className="px-6 py-4 text-left font-medium text-gray-700">
                          HubSpot Field
                        </th>
                        <th className="px-6 py-4 text-left font-medium text-gray-700">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fieldMappings.map((mapping, idx) => (
                        <tr key={idx} className="border-b border-[#e8e5e1] hover:bg-[#F7F5F2]">
                          <td className="px-6 py-4 font-medium text-gray-900">{mapping.ccField}</td>
                          <td className="px-6 py-4 text-gray-700">{mapping.hubspotField}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-full bg-[#F0FAF8] text-[#157A6E] text-[11px] font-medium">
                              {mapping.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Deals Sync Tab */}
            {activeTab === 'deals-sync' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-[#e8e5e1] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-[#e8e5e1] bg-[#F7F5F2]">
                          <th className="px-6 py-4 text-left font-medium text-gray-700">
                            CC Stage
                          </th>
                          <th className="px-6 py-4 text-left font-medium text-gray-700">
                            HubSpot Stage
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dealStageMappings.map((mapping, idx) => (
                          <tr key={idx} className="border-b border-[#e8e5e1] hover:bg-[#F7F5F2]">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {mapping.ccStage}
                            </td>
                            <td className="px-6 py-4 text-gray-700">{mapping.hubspotStage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-[#e8e5e1] p-6">
                  <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-4">
                    Deals Status
                  </h3>
                  <div className="space-y-3">
                    {dealStageMappings.map((mapping, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-[#e8e5e1] last:border-b-0"
                      >
                        <span className="text-[13px] text-gray-700">{mapping.ccStage}</span>
                        <span className="text-[13px] font-medium text-gray-900">0 deals</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleSync('deals')}
                  disabled={syncing}
                  className="w-full px-4 py-2 bg-[#157A6E] text-white rounded-lg hover:bg-[#0f6960] transition-colors text-[13px] font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCcw className="w-4 h-4" />
                  {syncing ? 'Syncing Deals...' : 'Sync Deals to HubSpot'}
                </button>
              </div>
            )}

            {/* Activity Log Tab */}
            {activeTab === 'activity-log' && (
              <div className="bg-white rounded-lg border border-[#e8e5e1] overflow-hidden">
                {syncLogs.length === 0 ? (
                  <div className="p-8 text-center">
                    <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-[13px] text-gray-600">No sync activity yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-[#e8e5e1] bg-[#F7F5F2]">
                          <th className="px-6 py-4 text-left font-medium text-gray-700">
                            Timestamp
                          </th>
                          <th className="px-6 py-4 text-left font-medium text-gray-700">
                            Action
                          </th>
                          <th className="px-6 py-4 text-left font-medium text-gray-700">
                            Records
                          </th>
                          <th className="px-6 py-4 text-left font-medium text-gray-700">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncLogs.map((log) => (
                          <tr key={log.id} className="border-b border-[#e8e5e1] hover:bg-[#F7F5F2]">
                            <td className="px-6 py-4 text-gray-700">{formatDate(log.timestamp)}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">{log.action}</td>
                            <td className="px-6 py-4 text-gray-700">{log.recordCount}</td>
                            <td className="px-6 py-4">
                              {log.status === 'success' ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-green-700 font-medium">Success</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                  <span className="text-red-700 font-medium">Error</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sync Controls Sidebar */}
            <div className="mt-8 bg-white rounded-lg border border-[#e8e5e1] p-6">
              <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-4">
                Sync Controls
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleSync('advisors')}
                  disabled={syncing}
                  className="w-full px-4 py-2 border border-[#157A6E] text-[#157A6E] rounded-lg hover:bg-[#F0FAF8] transition-colors text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Push Advisors to HubSpot
                </button>
                <button
                  onClick={() => handleSync('deals')}
                  disabled={syncing}
                  className="w-full px-4 py-2 border border-[#157A6E] text-[#157A6E] rounded-lg hover:bg-[#F0FAF8] transition-colors text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Push Deals to HubSpot
                </button>
                <button
                  disabled={syncing}
                  className="w-full px-4 py-2 border border-[#e8e5e1] text-gray-700 rounded-lg hover:bg-[#F7F5F2] transition-colors text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pull Contacts from HubSpot
                </button>
                <button
                  onClick={() => handleSync('full')}
                  disabled={syncing}
                  className="w-full px-4 py-2 bg-[#157A6E] text-white rounded-lg hover:bg-[#0f6960] transition-colors text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Full Bi-Directional Sync
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
