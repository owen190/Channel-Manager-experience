'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Bell, Zap, Users, Building2, LogOut, Save, Upload, X,
  Cloud, Mail, MessageSquare, Calendar, ChevronRight, Check, Edit2,
  Clock, AlertCircle, TrendingDown, BarChart3, MapPin, Globe,
  ArrowLeft, RefreshCw, RefreshCcw, Activity, Database, ArrowRightLeft, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { SupplierProfile } from '@/components/shared/SupplierProfile';
import { NAV_ITEMS_MANAGER } from '@/lib/constants';

type Tab = 'profile' | 'notifications' | 'connectors' | 'team' | 'organization' | 'supplier';

interface Teammate {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending';
}

interface NotificationConfig {
  morningBriefing: boolean;
  briefingTime: string;
  frictionAlerts: boolean;
  dealHealthChanges: boolean;
  weeklyDigest: boolean;
}

interface ConnectorDetail {
  id: string;
  name: string;
}

interface FieldMapping {
  ccField: string;
  externalField: string;
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

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('channel_manager');
  const [saving, setSaving] = useState(false);
  const [connectorDetail, setConnectorDetail] = useState<ConnectorDetail | null>(null);
  const [connectorSubTab, setConnectorSubTab] = useState<'overview' | 'field-mapping' | 'sync-log'>('overview');
  const [syncing, setSyncing] = useState(false);

  // Mock data
  const [profileData, setProfileData] = useState({
    name: 'Jordan Rivera',
    email: 'jordan@example.com',
    timezone: 'America/Los_Angeles',
    role: 'channel_manager',
  });

  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    morningBriefing: true,
    briefingTime: '08:00',
    frictionAlerts: true,
    dealHealthChanges: true,
    weeklyDigest: true,
  });

  const [teammates, setTeammates] = useState<Teammate[]>([
    { id: '1', name: 'Alex Chen', email: 'alex@example.com', role: 'channel_manager', status: 'active' },
    { id: '2', name: 'Sam Patel', email: 'sam@example.com', role: 'channel_manager', status: 'active' },
    { id: '3', name: 'Jordan Reynolds', email: 'jordan.r@example.com', role: 'channel_manager', status: 'pending' },
  ]);

  const [connectedTools] = useState({
    salesforce: true,
    hubspot: false,
    gong: true,
    slack: false,
  });

  const TOOLS = [
    { id: 'salesforce', name: 'Salesforce', icon: Cloud, desc: 'CRM & opportunity data' },
    { id: 'hubspot', name: 'HubSpot', icon: Cloud, desc: 'Deals & contacts' },
    { id: 'gmail', name: 'Gmail', icon: Mail, desc: 'Email communications' },
    { id: 'gong', name: 'Gong', icon: Zap, desc: 'Call recordings & insights' },
    { id: 'slack', name: 'Slack', icon: MessageSquare, desc: 'Team communication' },
    { id: 'gcalendar', name: 'Google Calendar', icon: Calendar, desc: 'Schedule & availability' },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      alert('Profile saved!');
    }, 500);
  };

  const handleInviteTeammate = async () => {
    if (!inviteEmail) return;
    // Simulate invite
    setInviteEmail('');
    setShowInviteModal(false);
    alert(`Invite sent to ${inviteEmail}`);
  };

  const pendingCount = teammates.filter(t => t.status === 'pending').length;

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
          pageTitle="Settings"
        />

        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-8">
            {/* Tabs */}
            <div className="flex border-b border-[#e8e5e1] gap-8 mb-8">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'connectors', label: 'Connectors', icon: Zap },
                { id: 'team', label: 'Team', icon: Users },
                { id: 'organization', label: 'Organization', icon: Building2 },
                { id: 'supplier', label: 'Supplier Profile', icon: Cloud },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`pb-4 px-1 flex items-center gap-2 border-b-2 transition-colors text-[13px] font-medium ${
                    activeTab === tab.id
                      ? 'border-[#157A6E] text-[#157A6E]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.id === 'profile' && <User className="w-4 h-4" />}
                  {tab.id === 'notifications' && <Bell className="w-4 h-4" />}
                  {tab.id === 'connectors' && <Zap className="w-4 h-4" />}
                  {tab.id === 'team' && <Users className="w-4 h-4" />}
                  {tab.id === 'organization' && <Building2 className="w-4 h-4" />}
                  {tab.id === 'supplier' && <Cloud className="w-4 h-4" />}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-1">
                    Profile Information
                  </h3>
                  <p className="text-[12px] text-gray-600">
                    Update your personal information and preferences
                  </p>
                </div>

                {/* Photo Upload */}
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                  <label className="block text-[13px] font-medium text-gray-900 mb-3">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#157A6E] flex items-center justify-center text-white font-semibold">
                      JR
                    </div>
                    <button className="px-4 py-2 border border-[#e8e5e1] rounded-[8px] hover:bg-[#F7F5F2] transition-colors text-[12px] font-medium text-gray-700 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Change Photo
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6 space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[8px] text-[13px] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[8px] text-[13px] bg-gray-50 text-gray-600"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Contact support to change your email address
                    </p>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={profileData.timezone}
                      onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[8px] text-[13px] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E] transition-colors"
                    >
                      <option>America/Los_Angeles</option>
                      <option>America/Denver</option>
                      <option>America/Chicago</option>
                      <option>America/New_York</option>
                      <option>Europe/London</option>
                      <option>Europe/Paris</option>
                      <option>Asia/Tokyo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value="Channel Manager"
                      disabled
                      className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[8px] text-[13px] bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-[#157A6E] text-white rounded-[8px] hover:bg-[#0f6960] transition-colors text-[13px] font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-1">
                    Notification Preferences
                  </h3>
                  <p className="text-[12px] text-gray-600">
                    Choose how and when we send you updates
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Morning Briefing */}
                  <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <Bell className="w-5 h-5 text-[#157A6E] flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 text-[13px]">Morning Briefing</h4>
                          <p className="text-[12px] text-gray-500 mt-1">
                            Daily email summary of key metrics and alerts
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationConfig.morningBriefing}
                        onChange={(e) =>
                          setNotificationConfig(prev => ({ ...prev, morningBriefing: e.target.checked }))
                        }
                        className="w-4 h-4"
                      />
                    </div>
                    {notificationConfig.morningBriefing && (
                      <div className="mt-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <input
                          type="time"
                          value={notificationConfig.briefingTime}
                          onChange={(e) =>
                            setNotificationConfig(prev => ({ ...prev, briefingTime: e.target.value }))
                          }
                          className="text-[12px] border border-[#e8e5e1] rounded-[6px] px-2 py-1"
                        />
                      </div>
                    )}
                  </div>

                  {/* Friction Alerts */}
                  <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-[#157A6E] flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 text-[13px]">Friction Alerts</h4>
                          <p className="text-[12px] text-gray-500 mt-1">
                            Immediate notifications when friction is detected
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationConfig.frictionAlerts}
                        onChange={(e) =>
                          setNotificationConfig(prev => ({ ...prev, frictionAlerts: e.target.checked }))
                        }
                        className="w-4 h-4"
                      />
                    </div>
                  </div>

                  {/* Deal Health Changes */}
                  <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <TrendingDown className="w-5 h-5 text-[#157A6E] flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 text-[13px]">Deal Health Changes</h4>
                          <p className="text-[12px] text-gray-500 mt-1">
                            Alerts when deal status moves to at-risk or closed
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationConfig.dealHealthChanges}
                        onChange={(e) =>
                          setNotificationConfig(prev => ({ ...prev, dealHealthChanges: e.target.checked }))
                        }
                        className="w-4 h-4"
                      />
                    </div>
                  </div>

                  {/* Weekly Digest */}
                  <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <BarChart3 className="w-5 h-5 text-[#157A6E] flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 text-[13px]">Weekly Digest</h4>
                          <p className="text-[12px] text-gray-500 mt-1">
                            Friday summary of the week's key moments
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationConfig.weeklyDigest}
                        onChange={(e) =>
                          setNotificationConfig(prev => ({ ...prev, weeklyDigest: e.target.checked }))
                        }
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                </div>

                <button className="px-4 py-2 bg-[#157A6E] text-white rounded-[8px] hover:bg-[#0f6960] transition-colors text-[13px] font-medium flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            )}

            {/* Connectors Tab */}
            {activeTab === 'connectors' && !connectorDetail && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-1">
                    Connected Tools
                  </h3>
                  <p className="text-[12px] text-gray-600">
                    Manage integrations with your favorite platforms
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-4xl">
                  {TOOLS.map(tool => {
                    const Icon = tool.icon;
                    const isConnected = connectedTools[tool.id as keyof typeof connectedTools];
                    return (
                      <div
                        key={tool.id}
                        className={`bg-white rounded-[10px] border border-[#e8e5e1] p-4 flex items-start justify-between ${isConnected ? 'cursor-pointer hover:border-[#157A6E] hover:shadow-sm' : ''} transition-all`}
                        onClick={() => {
                          if (isConnected) {
                            setConnectorDetail({ id: tool.id, name: tool.name });
                            setConnectorSubTab('overview');
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="w-5 h-5 text-[#157A6E] flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-900 text-[13px]">{tool.name}</h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">{tool.desc}</p>
                            <div className="mt-2">
                              {isConnected ? (
                                <div className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
                                  <Check className="w-3 h-3" />
                                  Connected
                                </div>
                              ) : (
                                <div className="text-[11px] text-gray-500">Not connected</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            className="text-[12px] font-medium text-[#157A6E] hover:underline"
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            {isConnected ? 'Disconnect' : 'Connect'}
                          </button>
                          {isConnected && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                              <ChevronRight className="w-3 h-3" />
                              Manage
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Connector Detail View */}
            {activeTab === 'connectors' && connectorDetail && (() => {
              const fieldMappings: Record<string, FieldMapping[]> = {
                hubspot: [
                  { ccField: 'name', externalField: 'firstname + lastname', type: 'text' },
                  { ccField: 'title', externalField: 'jobtitle', type: 'text' },
                  { ccField: 'company', externalField: 'company', type: 'text' },
                  { ccField: 'email', externalField: 'email', type: 'email' },
                  { ccField: 'mrr', externalField: 'custom note', type: 'currency' },
                  { ccField: 'pulse', externalField: 'custom note', type: 'text' },
                  { ccField: 'tier', externalField: 'role_in_the_channel', type: 'select' },
                  { ccField: 'friction', externalField: 'custom note', type: 'text' },
                  { ccField: 'lifecyclestage', externalField: 'based on tier', type: 'derived' },
                ],
                salesforce: [
                  { ccField: 'name', externalField: 'Name', type: 'text' },
                  { ccField: 'company', externalField: 'Account.Name', type: 'text' },
                  { ccField: 'email', externalField: 'Email', type: 'email' },
                  { ccField: 'mrr', externalField: 'Monthly_Revenue__c', type: 'currency' },
                  { ccField: 'deals', externalField: 'Opportunity', type: 'object' },
                  { ccField: 'stage', externalField: 'StageName', type: 'select' },
                ],
                gong: [
                  { ccField: 'advisor.id', externalField: 'participant.email', type: 'lookup' },
                  { ccField: 'transcript', externalField: 'call.transcript', type: 'text' },
                  { ccField: 'sentiment', externalField: 'call.sentiment_score', type: 'number' },
                  { ccField: 'topics', externalField: 'call.topics[]', type: 'array' },
                  { ccField: 'duration', externalField: 'call.duration', type: 'number' },
                ],
                slack: [
                  { ccField: 'notifications', externalField: '#channel-alerts', type: 'channel' },
                  { ccField: 'deal_updates', externalField: '#deals-pipeline', type: 'channel' },
                  { ccField: 'morning_briefing', externalField: 'DM to user', type: 'message' },
                ],
              };

              const dealStageMappings: Record<string, Array<{ ccStage: string; externalStage: string }>> = {
                hubspot: [
                  { ccStage: 'Discovery', externalStage: 'appointmentscheduled' },
                  { ccStage: 'Qualifying', externalStage: 'qualifiedtobuy' },
                  { ccStage: 'Proposal', externalStage: 'presentationscheduled' },
                  { ccStage: 'Negotiating', externalStage: 'decisionmakerboughtin' },
                  { ccStage: 'Closed Won', externalStage: 'closedwon' },
                  { ccStage: 'Stalled', externalStage: 'closedlost' },
                ],
                salesforce: [
                  { ccStage: 'Discovery', externalStage: 'Prospecting' },
                  { ccStage: 'Qualifying', externalStage: 'Qualification' },
                  { ccStage: 'Proposal', externalStage: 'Proposal/Price Quote' },
                  { ccStage: 'Negotiating', externalStage: 'Negotiation/Review' },
                  { ccStage: 'Closed Won', externalStage: 'Closed Won' },
                  { ccStage: 'Stalled', externalStage: 'Closed Lost' },
                ],
              };

              const mappings = fieldMappings[connectorDetail.id] || [];
              const stages = dealStageMappings[connectorDetail.id] || [];

              const handleSync = async () => {
                setSyncing(true);
                setTimeout(() => {
                  setSyncing(false);
                  alert(`${connectorDetail.name} sync complete`);
                }, 1500);
              };

              return (
              <div className="space-y-6">
                {/* Back button + Header */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setConnectorDetail(null)}
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="flex-1">
                    <h3 className="font-newsreader text-lg font-bold text-gray-900">
                      {connectorDetail.name} Integration
                    </h3>
                    <p className="text-[12px] text-gray-500">Manage sync, field mappings, and activity</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-[12px] font-medium text-green-700">Connected</span>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex border-b border-[#e8e5e1] gap-6">
                  {[
                    { id: 'overview' as const, label: 'Overview' },
                    { id: 'field-mapping' as const, label: 'Field Mapping' },
                    { id: 'sync-log' as const, label: 'Sync Log' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setConnectorSubTab(tab.id)}
                      className={`pb-3 px-1 border-b-2 transition-colors text-[13px] font-medium ${
                        connectorSubTab === tab.id
                          ? 'border-[#157A6E] text-[#157A6E]'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Overview sub-tab */}
                {connectorSubTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                      <h4 className="font-medium text-gray-900 text-[14px] mb-4">Sync Status</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-[#e8e5e1]">
                          <span className="text-[13px] text-gray-700">Connection Status</span>
                          <span className="text-[13px] font-medium text-green-600">Connected</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-[#e8e5e1]">
                          <span className="text-[13px] text-gray-700">Last Sync</span>
                          <span className="text-[13px] font-medium text-gray-900">Today, 8:00 AM</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-[#e8e5e1]">
                          <span className="text-[13px] text-gray-700">Synced Records</span>
                          <span className="text-[13px] font-medium text-gray-900">0</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[13px] text-gray-700">Sync Direction</span>
                          <span className="text-[13px] font-medium text-gray-900">Bi-directional</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                      <h4 className="font-medium text-gray-900 text-[14px] mb-4">Quick Actions</h4>
                      <div className="flex gap-3">
                        <button
                          onClick={handleSync}
                          disabled={syncing}
                          className="px-4 py-2 bg-[#157A6E] text-white rounded-[8px] hover:bg-[#0f6960] transition-colors text-[13px] font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                          <RefreshCcw className="w-4 h-4" />
                          {syncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                        <button className="px-4 py-2 border border-[#157A6E] text-[#157A6E] rounded-[8px] hover:bg-[#F0FAF8] transition-colors text-[13px] font-medium">
                          Push Advisors
                        </button>
                        <button className="px-4 py-2 border border-[#157A6E] text-[#157A6E] rounded-[8px] hover:bg-[#F0FAF8] transition-colors text-[13px] font-medium">
                          Push Deals
                        </button>
                      </div>
                    </div>

                    {/* Deal Stage Mapping */}
                    {stages.length > 0 && (
                      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                        <h4 className="font-medium text-gray-900 text-[14px] mb-4">Deal Stage Mapping</h4>
                        <table className="w-full text-[13px]">
                          <thead>
                            <tr className="border-b border-[#e8e5e1]">
                              <th className="text-left py-2 font-medium text-gray-500">CC Stage</th>
                              <th className="text-left py-2 font-medium text-gray-500">{connectorDetail.name} Stage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stages.map((s, i) => (
                              <tr key={i} className="border-b border-[#e8e5e1] last:border-0">
                                <td className="py-2 font-medium text-gray-900">{s.ccStage}</td>
                                <td className="py-2 text-gray-700">{s.externalStage}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Field Mapping sub-tab */}
                {connectorSubTab === 'field-mapping' && (
                  <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-[#e8e5e1] bg-[#F7F5F2]">
                          <th className="px-6 py-4 text-left font-medium text-gray-700">Channel Companion Field</th>
                          <th className="px-6 py-4 text-left font-medium text-gray-700">{connectorDetail.name} Field</th>
                          <th className="px-6 py-4 text-left font-medium text-gray-700">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappings.map((m, i) => (
                          <tr key={i} className="border-b border-[#e8e5e1] hover:bg-[#F7F5F2]">
                            <td className="px-6 py-4 font-medium text-gray-900">{m.ccField}</td>
                            <td className="px-6 py-4 text-gray-700">{m.externalField}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-full bg-[#F0FAF8] text-[#157A6E] text-[11px] font-medium">{m.type}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sync Log sub-tab */}
                {connectorSubTab === 'sync-log' && (
                  <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-8 text-center">
                    <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-[13px] text-gray-600">No sync activity yet</p>
                    <p className="text-[11px] text-gray-400 mt-1">Sync activity will appear here once data starts flowing</p>
                  </div>
                )}
              </div>
              );
            })()}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-1">
                    Team Members
                  </h3>
                  <p className="text-[12px] text-gray-600">
                    Manage your team's access and roles
                  </p>
                </div>

                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-[#157A6E] text-white rounded-[8px] hover:bg-[#0f6960] transition-colors text-[13px] font-medium"
                >
                  Invite Team Member
                </button>

                {/* Team List */}
                <div className="space-y-2">
                  {teammates.map(teammate => (
                    <div
                      key={teammate.id}
                      className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#e8e5e1] flex items-center justify-center text-[12px] font-semibold text-gray-700">
                          {teammate.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-[13px]">{teammate.name}</h4>
                          <p className="text-[12px] text-gray-500">{teammate.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] text-gray-600">{teammate.role === 'channel_manager' ? 'Channel Manager' : 'Sales Leader'}</span>
                        <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${teammate.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {teammate.status === 'active' ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {pendingCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-[8px] p-4">
                    <p className="text-[12px] text-yellow-900">
                      You have <span className="font-medium">{pendingCount} pending invite(s)</span> waiting to be accepted
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Organization Tab */}
            {activeTab === 'organization' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-1">
                    Organization Settings
                  </h3>
                  <p className="text-[12px] text-gray-600">
                    Manage organization profile and billing
                  </p>
                </div>

                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6 space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Acme Corporation"
                      className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[8px] text-[13px] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-2">
                      Organization Slug
                    </label>
                    <input
                      type="text"
                      defaultValue="acme-corp"
                      className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[8px] text-[13px] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-2">
                      Current Plan
                    </label>
                    <div className="flex items-center justify-between p-3 bg-[#F0FAF8] border border-[#157A6E] rounded-[8px]">
                      <span className="text-[13px] font-medium text-[#157A6E]">Trial</span>
                      <button className="text-[12px] font-medium text-[#157A6E] hover:underline">
                        Upgrade
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-2">
                      Logo
                    </label>
                    <button className="px-4 py-2 border border-[#e8e5e1] rounded-[8px] hover:bg-[#F7F5F2] transition-colors text-[12px] font-medium text-gray-700 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </button>
                  </div>
                </div>

                <button className="px-4 py-2 bg-[#157A6E] text-white rounded-[8px] hover:bg-[#0f6960] transition-colors text-[13px] font-medium">
                  Save Changes
                </button>
              </div>
            )}

            {/* Supplier Profile Tab */}
            {activeTab === 'supplier' && (
              <div>
                <div className="mb-6">
                  <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-1">
                    Supplier Profile
                  </h3>
                  <p className="text-[12px] text-gray-600">
                    Manage your organization's supplier positioning and messaging for advisors
                  </p>
                </div>
                <SupplierProfile editable={true} onSave={(data) => {
                  console.log('Supplier profile saved:', data);
                }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[10px] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-newsreader text-lg font-bold text-gray-900">
                Invite Team Member
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 hover:bg-gray-100 rounded-[8px] transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="invite@example.com"
                  className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[8px] text-[13px] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[8px] text-[13px] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E] transition-colors"
                >
                  <option value="channel_manager">Channel Manager</option>
                  <option value="sales_leader">Sales Leader</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-[#e8e5e1] rounded-[8px] hover:bg-gray-50 transition-colors text-[13px] font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteTeammate}
                  className="flex-1 px-4 py-2 bg-[#157A6E] text-white rounded-[8px] hover:bg-[#0f6960] transition-colors text-[13px] font-medium"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
