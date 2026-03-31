'use client';

import { useState, useEffect } from 'react';
import {
  Users, Settings, Zap, CreditCard, LogOut, Search, Plus, Edit2, Trash2,
  Mail, Eye, EyeOff, X, Check, AlertCircle, Cloud, Hash, Mic, Flame,
  Calendar, MessageSquare, Hexagon, Download, ChevronDown,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

type AdminTab = 'users' | 'organization' | 'integrations' | 'billing' | 'audit';
type UserRole = 'admin' | 'manager' | 'member';
type PlanType = 'trial' | 'pro' | 'enterprise';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  lastActive: string;
}

interface Integration {
  id: string;
  type: string;
  name: string;
  status: 'connected' | 'disconnected';
  lastSync?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  details: string;
}

const NAV_ITEMS_ADMIN = [
  { id: 'users', label: 'Users', icon: 'Users' },
  { id: 'organization', label: 'Organization', icon: 'Settings' },
  { id: 'integrations', label: 'Integrations', icon: 'Zap' },
  { id: 'billing', label: 'Billing', icon: 'CreditCard' },
  { id: 'audit', label: 'Audit Log', icon: 'BarChart3' },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Settings,
  Zap,
  CreditCard,
  BarChart3: ({ className }) => <Cloud className={className} />,
};

const INTEGRATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  salesforce: Cloud,
  hubspot: Hexagon,
  gmail: Mail,
  'google-calendar': Calendar,
  gong: Mic,
  fireflies: Flame,
  slack: Hash,
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('manager');

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPlan, setCurrentPlan] = useState<PlanType>('trial');

  const userName = 'Admin User';
  const userInitials = 'AU';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, integrationsRes, auditRes] = await Promise.all([
        fetch('/api/admin/users').catch(() => null),
        fetch('/api/integrations').catch(() => null),
        fetch('/api/admin/audit-logs').catch(() => null),
      ]);

      if (usersRes?.ok) {
        setUsers(await usersRes.json());
      } else {
        setUsers(mockUsers());
      }

      if (integrationsRes?.ok) {
        const data = await integrationsRes.json();
        setIntegrations(formatIntegrations(data));
      } else {
        setIntegrations(mockIntegrations());
      }

      if (auditRes?.ok) {
        setAuditLogs(await auditRes.json());
      } else {
        setAuditLogs(mockAuditLogs());
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setUsers(mockUsers());
      setIntegrations(mockIntegrations());
      setAuditLogs(mockAuditLogs());
    }
    setLoading(false);
  };

  const formatIntegrations = (data: any[]) => {
    return data.map((item) => ({
      id: item.id,
      type: item.type,
      name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
      status: item.status,
      lastSync: item.last_sync,
      icon: INTEGRATION_ICONS[item.type] || Cloud,
    }));
  };

  const mockUsers = (): User[] => [
    {
      id: '1',
      name: 'Jordan R.',
      email: 'jordan@example.com',
      role: 'admin',
      status: 'active',
      lastActive: '2 minutes ago',
    },
    {
      id: '2',
      name: 'Alex K.',
      email: 'alex@example.com',
      role: 'manager',
      status: 'active',
      lastActive: '1 hour ago',
    },
    {
      id: '3',
      name: 'Sam J.',
      email: 'sam@example.com',
      role: 'member',
      status: 'inactive',
      lastActive: '3 days ago',
    },
  ];

  const mockIntegrations = (): Integration[] => [
    {
      id: '1',
      type: 'salesforce',
      name: 'Salesforce',
      status: 'connected',
      lastSync: '2 hours ago',
      icon: Cloud,
    },
    {
      id: '2',
      type: 'hubspot',
      name: 'HubSpot',
      status: 'disconnected',
      icon: Hexagon,
    },
    {
      id: '3',
      type: 'slack',
      name: 'Slack',
      status: 'connected',
      lastSync: '30 minutes ago',
      icon: Hash,
    },
    {
      id: '4',
      type: 'gong',
      name: 'Gong',
      status: 'connected',
      lastSync: '1 day ago',
      icon: Mic,
    },
  ];

  const mockAuditLogs = (): AuditLog[] => [
    {
      id: '1',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      user: 'Jordan R.',
      action: 'user_invited',
      entity: 'User',
      details: 'Invited new_user@example.com as manager',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      user: 'Jordan R.',
      action: 'integration_connected',
      entity: 'Integration',
      details: 'Connected Salesforce integration',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      user: 'Alex K.',
      action: 'user_role_updated',
      entity: 'User',
      details: 'Updated sam@example.com role from member to manager',
    },
  ];

  const handleInviteUser = async () => {
    if (!inviteEmail) return;

    try {
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (response.ok) {
        setShowInviteModal(false);
        setInviteEmail('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to invite user:', err);
    }
  };

  return (
    <div className="flex h-screen bg-[#F7F5F2]">
      <Sidebar
        items={NAV_ITEMS_ADMIN as any}
        activeView={activeTab}
        onViewChange={(id) => setActiveTab(id as AdminTab)}
        role="manager"
        userName={userName}
        userInitials={userInitials}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar nudges={[] as any} userName={userName} userInitials={userInitials} />

        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Tab Navigation */}
            <div className="flex gap-6 mb-8 border-b border-[#e8e5e1]">
              {NAV_ITEMS_ADMIN.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`px-4 py-3 rounded-t-lg font-medium text-13px transition-colors ${
                    activeTab === item.id
                      ? 'text-[#157A6E] border-b-2 border-[#157A6E]'
                      : 'text-[#666] hover:text-[#333]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && <UsersTab users={users} onShowInvite={() => setShowInviteModal(true)} />}

            {/* Organization Tab */}
            {activeTab === 'organization' && <OrganizationTab currentPlan={currentPlan} />}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && <IntegrationsTab integrations={integrations} />}

            {/* Billing Tab */}
            {activeTab === 'billing' && <BillingTab currentPlan={currentPlan} />}

            {/* Audit Log Tab */}
            {activeTab === 'audit' && <AuditLogTab logs={auditLogs} />}
          </div>
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[10px] p-6 w-96 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-16px font-semibold">Invite User</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-[#999] hover:text-[#333]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-13px font-medium text-[#333] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[10px] text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E]"
                />
              </div>

              <div>
                <label className="block text-13px font-medium text-[#333] mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[10px] text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E]"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-[#e8e5e1] rounded-[10px] text-13px font-medium text-[#666] hover:bg-[#f5f3f0]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteUser}
                  className="flex-1 px-4 py-2 bg-[#157A6E] text-white rounded-[10px] text-13px font-medium hover:bg-[#126b61]"
                >
                  Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab({ users, onShowInvite }: { users: User[]; onShowInvite: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#999]" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#e8e5e1] rounded-[10px] text-13px"
          />
        </div>
        <button
          onClick={onShowInvite}
          className="ml-4 flex items-center gap-2 px-4 py-2 bg-[#157A6E] text-white rounded-[10px] text-13px font-medium hover:bg-[#126b61]"
        >
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f5f3f0] border-b border-[#e8e5e1]">
            <tr>
              <th className="px-6 py-3 text-left text-13px font-semibold text-[#333]">
                Name
              </th>
              <th className="px-6 py-3 text-left text-13px font-semibold text-[#333]">
                Email
              </th>
              <th className="px-6 py-3 text-left text-13px font-semibold text-[#333]">
                Role
              </th>
              <th className="px-6 py-3 text-left text-13px font-semibold text-[#333]">
                Status
              </th>
              <th className="px-6 py-3 text-left text-13px font-semibold text-[#333]">
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-13px font-semibold text-[#333]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, idx) => (
              <tr
                key={user.id}
                className={`border-b border-[#e8e5e1] ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-[#fafaf8]'
                }`}
              >
                <td className="px-6 py-3 text-13px font-medium text-[#333]">
                  {user.name}
                </td>
                <td className="px-6 py-3 text-13px text-[#666]">{user.email}</td>
                <td className="px-6 py-3 text-13px">
                  <select
                    defaultValue={user.role}
                    className="px-2 py-1 border border-[#e8e5e1] rounded-[5px] text-13px bg-white"
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-11px font-medium ${
                      user.status === 'active'
                        ? 'bg-[#e8f5f3] text-[#157A6E]'
                        : 'bg-[#f5f3f0] text-[#999]'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-13px text-[#666]">
                  {user.lastActive}
                </td>
                <td className="px-6 py-3 flex gap-2">
                  <button className="p-1 hover:bg-[#f5f3f0] rounded-[5px]">
                    <Edit2 className="w-4 h-4 text-[#666]" />
                  </button>
                  <button className="p-1 hover:bg-[#f5f3f0] rounded-[5px]">
                    <Trash2 className="w-4 h-4 text-[#666]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrganizationTab({ currentPlan }: { currentPlan: PlanType }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
        <h3 className="text-14px font-semibold text-[#333] mb-4">
          Organization Details
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-13px font-medium text-[#666] mb-2">
              Organization Name
            </label>
            <input
              type="text"
              defaultValue="Acme Corporation"
              className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[10px] text-13px"
            />
          </div>
          <div>
            <label className="block text-13px font-medium text-[#666] mb-2">
              Slug
            </label>
            <input
              type="text"
              defaultValue="acme-corp"
              className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[10px] text-13px"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-13px font-medium text-[#666] mb-2">
            Logo
          </label>
          <div className="border-2 border-dashed border-[#e8e5e1] rounded-[10px] p-6 text-center hover:border-[#157A6E] transition-colors cursor-pointer">
            <div className="text-13px text-[#666]">
              Drag and drop your logo here, or click to select
            </div>
            <div className="text-11px text-[#999] mt-1">
              PNG, JPG up to 5MB
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
        <h3 className="text-14px font-semibold text-[#333] mb-4">
          Current Plan
        </h3>
        <div className="flex justify-between items-center p-4 bg-[#f5f3f0] rounded-[10px]">
          <div>
            <p className="text-13px font-semibold text-[#333]">
              {currentPlan === 'trial' ? 'Trial' : currentPlan === 'pro' ? 'Professional' : 'Enterprise'}
            </p>
            <p className="text-11px text-[#999]">
              {currentPlan === 'trial'
                ? '14-day free trial'
                : currentPlan === 'pro'
                ? '$49 per user per month'
                : 'Custom pricing'}
            </p>
          </div>
          <button className="px-4 py-2 bg-[#157A6E] text-white rounded-[10px] text-13px font-medium hover:bg-[#126b61]">
            Upgrade Plan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
        <h3 className="text-14px font-semibold text-[#333] mb-4">
          Usage Stats
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-[#f5f3f0] rounded-[10px]">
            <p className="text-11px text-[#999] uppercase tracking-[0.5px]">Users</p>
            <p className="text-20px font-bold text-[#157A6E] mt-2">5 / 25</p>
          </div>
          <div className="p-4 bg-[#f5f3f0] rounded-[10px]">
            <p className="text-11px text-[#999] uppercase tracking-[0.5px]">Advisors</p>
            <p className="text-20px font-bold text-[#157A6E] mt-2">127 / Unlimited</p>
          </div>
          <div className="p-4 bg-[#f5f3f0] rounded-[10px]">
            <p className="text-11px text-[#999] uppercase tracking-[0.5px]">Deals</p>
            <p className="text-20px font-bold text-[#157A6E] mt-2">43</p>
          </div>
          <div className="p-4 bg-[#f5f3f0] rounded-[10px]">
            <p className="text-11px text-[#999] uppercase tracking-[0.5px]">API Calls</p>
            <p className="text-20px font-bold text-[#157A6E] mt-2">2.4K / 10K</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationsTab({ integrations }: { integrations: Integration[] }) {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-14px font-semibold text-[#333] mb-4">
          Available Integrations
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white border border-[#e8e5e1] rounded-[10px] p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedIntegration(integration.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-[#f5f3f0] rounded-[8px] flex items-center justify-center">
                  <integration.icon className="w-5 h-5 text-[#157A6E]" />
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-11px font-medium ${
                    integration.status === 'connected'
                      ? 'bg-[#e8f5f3] text-[#157A6E]'
                      : 'bg-[#fff3f0] text-[#d97706]'
                  }`}
                >
                  {integration.status}
                </span>
              </div>

              <h4 className="text-13px font-semibold text-[#333] mb-2">
                {integration.name}
              </h4>

              {integration.lastSync && (
                <p className="text-11px text-[#999] mb-4">
                  Last sync: {integration.lastSync}
                </p>
              )}

              <button className="w-full px-3 py-2 bg-[#157A6E] text-white text-13px font-medium rounded-[8px] hover:bg-[#126b61]">
                Configure
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
        <h3 className="text-14px font-semibold text-[#333] mb-4">
          Webhook Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-13px font-medium text-[#666] mb-2">
              Organization Webhook URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value="https://api.channelcompanion.com/webhooks/org-abc123"
                className="flex-1 px-3 py-2 border border-[#e8e5e1] rounded-[10px] text-13px bg-[#f5f3f0]"
              />
              <button className="px-4 py-2 bg-[#157A6E] text-white rounded-[10px] text-13px font-medium hover:bg-[#126b61]">
                Copy
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-13px font-semibold text-[#333] mb-3">
              Active Webhooks
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-[#f5f3f0] rounded-[8px]">
                <div className="text-13px">
                  <p className="font-medium text-[#333]">Meeting Intel (Gong)</p>
                  <p className="text-11px text-[#999]">Triggered on new transcripts</p>
                </div>
                <button className="text-[#999] hover:text-[#d97706]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#f5f3f0] rounded-[8px]">
                <div className="text-13px">
                  <p className="font-medium text-[#333]">Slack Notifications</p>
                  <p className="text-11px text-[#999]">Triggered on deal changes</p>
                </div>
                <button className="text-[#999] hover:text-[#d97706]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingTab({ currentPlan }: { currentPlan: PlanType }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-14px font-semibold text-[#333] mb-4">
          Plan Comparison
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              name: 'Trial',
              price: 'Free',
              period: '14 days',
              features: ['5 users', '50 advisors', 'Basic scoring', 'Email support'],
              cta: 'Current Plan',
            },
            {
              name: 'Professional',
              price: '$49',
              period: 'per user/month',
              features: [
                '25 users',
                'Unlimited advisors',
                'Full scoring',
                'CRM integrations',
                'Priority support',
              ],
              cta: 'Upgrade',
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              period: 'pricing',
              features: [
                'Unlimited users',
                'Unlimited advisors',
                'Custom scoring',
                'All integrations',
                '24/7 support',
                'SSO & audit log',
              ],
              cta: 'Contact Sales',
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[10px] border p-6 ${
                currentPlan === plan.name.toLowerCase()
                  ? 'border-[#157A6E] bg-[#e8f5f3]'
                  : 'border-[#e8e5e1] bg-white'
              }`}
            >
              <h4 className="text-14px font-semibold text-[#333]">
                {plan.name}
              </h4>
              <p className="text-20px font-bold text-[#157A6E] mt-2">
                {plan.price}
              </p>
              <p className="text-11px text-[#999] mb-4">{plan.period}</p>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-13px text-[#333]"
                  >
                    <Check className="w-4 h-4 text-[#157A6E] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full px-4 py-2 rounded-[10px] text-13px font-medium ${
                  currentPlan === plan.name.toLowerCase()
                    ? 'bg-[#157A6E] text-white'
                    : 'border border-[#e8e5e1] text-[#333] hover:bg-[#f5f3f0]'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
        <h3 className="text-14px font-semibold text-[#333] mb-4">
          Payment Method
        </h3>
        <div className="p-4 bg-[#f5f3f0] rounded-[10px]">
          <p className="text-13px text-[#333]">Visa ending in 4242</p>
          <button className="mt-3 text-13px font-medium text-[#157A6E] hover:underline">
            Update Payment Method
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
        <h3 className="text-14px font-semibold text-[#333] mb-4">
          Invoice History
        </h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e8e5e1]">
              <th className="px-0 py-3 text-left text-13px font-semibold text-[#333]">
                Date
              </th>
              <th className="px-0 py-3 text-left text-13px font-semibold text-[#333]">
                Description
              </th>
              <th className="px-0 py-3 text-right text-13px font-semibold text-[#333]">
                Amount
              </th>
              <th className="px-0 py-3 text-right text-13px font-semibold text-[#333]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                date: 'Mar 1, 2026',
                description: 'Trial ended - upgrade to Pro',
                amount: '$0',
                status: 'Pending',
              },
              {
                date: 'Feb 1, 2026',
                description: 'Trial subscription',
                amount: '$0',
                status: 'Paid',
              },
            ].map((invoice, idx) => (
              <tr key={idx} className="border-b border-[#e8e5e1]">
                <td className="px-0 py-3 text-13px text-[#333]">{invoice.date}</td>
                <td className="px-0 py-3 text-13px text-[#666]">
                  {invoice.description}
                </td>
                <td className="px-0 py-3 text-13px text-right font-medium">
                  {invoice.amount}
                </td>
                <td className="px-0 py-3 text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-11px font-medium ${
                      invoice.status === 'Paid'
                        ? 'bg-[#e8f5f3] text-[#157A6E]'
                        : 'bg-[#fff3f0] text-[#d97706]'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditLogTab({ logs }: { logs: AuditLog[] }) {
  const [dateRange, setDateRange] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  const filteredLogs = logs.filter((log) => {
    if (selectedUser !== 'all' && log.user !== selectedUser) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-13px font-medium text-[#666] mb-2">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[10px] text-13px"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-13px font-medium text-[#666] mb-2">
            User
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[10px] text-13px"
          >
            <option value="all">All Users</option>
            <option value="Jordan R.">Jordan R.</option>
            <option value="Alex K.">Alex K.</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className="px-4 py-2 bg-[#157A6E] text-white rounded-[10px] text-13px font-medium hover:bg-[#126b61] flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f5f3f0] border-b border-[#e8e5e1]">
            <tr>
              <th className="px-6 py-3 text-left text-13px font-semibold text-[#333]">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-13px font-semibold text-[#333]">
                User
              </th>
              <th className="px-6 py-3 text-left text-13px font-semibold text-[#333]">
                Action
              </th>
              <th className="px-6 py-3 text-left text-13px font-semibold text-[#333]">
                Entity
              </th>
              <th className="px-6 py-3 text-left text-13px font-semibold text-[#333]">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, idx) => (
              <tr
                key={log.id}
                className={`border-b border-[#e8e5e1] ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-[#fafaf8]'
                }`}
              >
                <td className="px-6 py-3 text-13px text-[#666] whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-3 text-13px font-medium text-[#333]">
                  {log.user}
                </td>
                <td className="px-6 py-3 text-13px text-[#666]">
                  {log.action.replace(/_/g, ' ')}
                </td>
                <td className="px-6 py-3 text-13px text-[#666]">
                  {log.entity}
                </td>
                <td className="px-6 py-3 text-13px text-[#666]">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
