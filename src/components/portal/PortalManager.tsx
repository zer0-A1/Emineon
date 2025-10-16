'use client';

import { useState } from 'react';
import { 
  Building2, 
  Share2, 
  Copy, 
  Mail, 
  ExternalLink, 
  Settings, 
  Users, 
  Eye,
  Link,
  Send,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ClientPortal {
  id: string;
  clientId: string;
  clientName: string;
  clientLogo?: string;
  status: 'active' | 'pending' | 'inactive';
  activeJobs: number;
  totalCandidates: number;
  lastActivity: string;
  portalUrl: string;
  accessLevel: 'VIEWER' | 'COLLABORATOR' | 'ADMIN';
  invitedUsers: {
    email: string;
    role: string;
    status: 'pending' | 'accepted';
    invitedAt: string;
  }[];
}

interface PortalManagerProps {
  portals: ClientPortal[];
  currentPortalId?: string;
  onSwitchPortal: (portalId: string) => void;
  onSharePortal: (portalId: string, method: 'link' | 'email') => void;
  onInviteUser: (portalId: string, email: string, role: string) => void;
  onManageSettings: (portalId: string) => void;
}

export default function PortalManager({
  portals,
  currentPortalId,
  onSwitchPortal,
  onSharePortal,
  onInviteUser,
  onManageSettings
}: PortalManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('COLLABORATOR');
  const [copiedPortalId, setCopiedPortalId] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null);

  const currentPortal = portals.find(p => p.id === currentPortalId);

  const handleCopyLink = async (portal: ClientPortal) => {
    try {
      await navigator.clipboard.writeText(portal.portalUrl);
      setCopiedPortalId(portal.id);
      setTimeout(() => setCopiedPortalId(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleInviteSubmit = (portalId: string) => {
    if (inviteEmail.trim()) {
      onInviteUser(portalId, inviteEmail, inviteRole);
      setInviteEmail('');
      setShowInviteModal(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Portal Selector Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 min-w-[200px] justify-between"
      >
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4" />
          <span className="truncate">
            {currentPortal ? currentPortal.clientName : 'Select Portal'}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Portal Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-w-md">
          <div className="p-3 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Client Portals</h3>
            <p className="text-sm text-gray-500">Switch between client dashboards</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {portals.map((portal) => (
              <div
                key={portal.id}
                className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                  currentPortalId === portal.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => {
                  onSwitchPortal(portal.id);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {portal.clientLogo ? (
                      <img 
                        src={portal.clientLogo} 
                        alt={portal.clientName}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {portal.clientName}
                        </h4>
                        <Badge className={`text-xs ${getStatusColor(portal.status)}`}>
                          {portal.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span>{portal.activeJobs} jobs</span>
                        <span>{portal.totalCandidates} candidates</span>
                        <span>{formatLastActivity(portal.lastActivity)}</span>
                      </div>

                      {portal.invitedUsers.length > 0 && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {portal.invitedUsers.length} user{portal.invitedUsers.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 ml-2">
                    {/* Quick Actions */}
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShareMenu(showShareMenu === portal.id ? null : portal.id);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>

                      {/* Share Menu */}
                      {showShareMenu === portal.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyLink(portal);
                              setShowShareMenu(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                          >
                            {copiedPortalId === portal.id ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            <span>{copiedPortalId === portal.id ? 'Copied!' : 'Copy Link'}</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSharePortal(portal.id, 'email');
                              setShowShareMenu(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <Mail className="h-4 w-4" />
                            <span>Send Email</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowInviteModal(portal.id);
                              setShowShareMenu(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <Users className="h-4 w-4" />
                            <span>Invite User</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(portal.portalUrl, '_blank');
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onManageSettings(portal.id);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-100">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Create New Portal
            </Button>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Invite User to Portal</h3>
                <button
                  onClick={() => setShowInviteModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Level
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="VIEWER">Viewer - Can view candidates and pipeline</option>
                    <option value="COLLABORATOR">Collaborator - Can rate and comment</option>
                    <option value="ADMIN">Admin - Full access and settings</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Invitation Details</p>
                      <p>An email will be sent with portal access instructions and a secure login link.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowInviteModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleInviteSubmit(showInviteModal)}
                  disabled={!inviteEmail.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {(isOpen || showShareMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setShowShareMenu(null);
          }}
        />
      )}
    </div>
  );
} 