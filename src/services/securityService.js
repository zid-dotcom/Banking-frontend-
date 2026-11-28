// Security Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export function parseApiError(errBody, status, fallbackMessage = 'Operation completed') {
  return errBody?.message || fallbackMessage;
}

export async function getSuperadminSecurityEvents() {
  return mockDb.getSecurityEvents();
}

export async function getSuperadminSecurityEventsSummary() {
  const events = mockDb.getSecurityEvents();
  return {
    total_events: events.length,
    successful_logins: events.filter((e) => e.event_type.includes('success')).length,
    failed_attempts: 0,
    critical_alerts: 0,
  };
}

export async function getBranchAdminSecurityEvents() {
  return mockDb.getSecurityEvents();
}

export async function getMemberSecurityEvents() {
  return mockDb.getSecurityEvents();
}

export function formatSecurityEventType(eventType) {
  if (!eventType) return 'Security Event';
  return eventType
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatAccountRole(role) {
  if (!role) return '—';
  const r = role.toLowerCase().replace(/[\s_-]+/g, '');
  if (r.includes('branch') && (r.includes('admin') || r.includes('manager'))) {
    return 'Branch Manager';
  }
  if (r.includes('super')) {
    return 'Super Admin';
  }
  if (r.includes('staff')) {
    return 'Branch Staff';
  }
  if (r.includes('member')) {
    return 'Member';
  }
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getSecurityEventTypeBadge(eventType = '') {
  const type = String(eventType).toLowerCase();

  if (type.includes('fail') || type.includes('denied') || type.includes('invalid') || type.includes('breach')) {
    return {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    };
  }
  if (type.includes('login') || type.includes('auth') || type.includes('token')) {
    return {
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
      dot: 'bg-teal-500',
    };
  }
  if (type.includes('password') || type.includes('pin') || type.includes('credential')) {
    return {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    };
  }
  if (type.includes('logout') || type.includes('session')) {
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    };
  }
  return {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  };
}
