const ROLE_DEFAULTS = {
  'Customer Support': { displayName: 'Customer Service Specialist', employmentFee: 1795, comparableMonthlySalary: 3564.5, icon: '🎧', description: 'Handles customer email, live chat, support tickets, returns, common account issues, and escalation preparation.', supportedChannels: ['Email', 'Live chat', 'Helpdesk'], supportedSystems: ['Gmail', 'Slack', 'Zendesk', 'HubSpot'], evaluationOptions: ['Sample Work', 'Complaint Resolution Test', 'Ticket Classification Test'], includedWorkload: 'Up to 750 resolved customer conversations per month across two approved channels.', availability: '24/7 monitoring with customer-defined response windows.', protectLevel: 'ORCA Protect Standard', activationFee: 2500 },
  'Customer Service Specialist': { displayName: 'Customer Service Specialist', employmentFee: 1795, comparableMonthlySalary: 3564.5, icon: '🎧', supportedChannels: ['Email', 'Live chat', 'Helpdesk'], supportedSystems: ['Gmail', 'Slack', 'Zendesk', 'HubSpot'], evaluationOptions: ['Sample Work', 'Complaint Resolution Test', 'Ticket Classification Test'] },
  'Founder Assistant': { displayName: 'Digital Receptionist', employmentFee: 1495, icon: '☎️', description: 'Answers inbound inquiries, captures messages and leads, schedules appointments, and routes requests.', supportedChannels: ['Phone', 'Email', 'Calendar'], supportedSystems: ['Google Calendar', 'Gmail', 'HubSpot', 'Slack'], evaluationOptions: ['Sample Work', 'Reception Scenario Test', 'Scheduling Test'], includedWorkload: 'Up to 500 inbound interactions and appointment actions per month.', availability: '24/7 intake with customer-defined live-service windows.', protectLevel: 'ORCA Protect Standard', activationFee: 2000 },
  'Digital Receptionist': { displayName: 'Digital Receptionist', employmentFee: 1495, icon: '☎️', supportedChannels: ['Phone', 'Email', 'Calendar'], supportedSystems: ['Google Calendar', 'Gmail', 'HubSpot', 'Slack'], evaluationOptions: ['Sample Work', 'Reception Scenario Test', 'Scheduling Test'] },
  'Shopify Support': { displayName: 'E-commerce Support Specialist', employmentFee: 1895, icon: '🛍️', description: 'Supports shoppers with product questions, order updates, returns, refunds, and approved store workflows.', supportedChannels: ['Email', 'Live chat', 'Store inbox'], supportedSystems: ['Shopify', 'Gmail', 'Slack', 'HubSpot'], evaluationOptions: ['Sample Work', 'Order Issue Test', 'Refund Policy Test'], includedWorkload: 'Up to 900 shopper conversations and order-support actions per month.', availability: '24/7 monitoring with customer-defined response windows.', protectLevel: 'ORCA Protect Standard', activationFee: 2750 },
  'E-commerce Support Specialist': { displayName: 'E-commerce Support Specialist', employmentFee: 1895, icon: '🛍️', supportedChannels: ['Email', 'Live chat', 'Store inbox'], supportedSystems: ['Shopify', 'Gmail', 'Slack', 'HubSpot'], evaluationOptions: ['Sample Work', 'Order Issue Test', 'Refund Policy Test'] },
  'Sales Follow-Up': { displayName: 'Sales Follow-Up Specialist', employmentFee: 1995, icon: '📞', description: 'Follows up with qualified leads, maintains approved nurture sequences, records outcomes, and schedules sales conversations.', supportedChannels: ['Email', 'CRM', 'Calendar'], supportedSystems: ['HubSpot', 'Gmail', 'Google Calendar', 'Slack'], evaluationOptions: ['Sample Work', 'Lead Follow-Up Test', 'Objection Handling Test'], includedWorkload: 'Up to 1,000 approved follow-up actions per month across two channels.', availability: 'Continuous queue monitoring with customer-defined contact windows.', protectLevel: 'ORCA Protect Standard', activationFee: 3000 },
  'Sales Follow-Up Specialist': { displayName: 'Sales Follow-Up Specialist', employmentFee: 1995, icon: '📞', supportedChannels: ['Email', 'CRM', 'Calendar'], supportedSystems: ['HubSpot', 'Gmail', 'Google Calendar', 'Slack'], evaluationOptions: ['Sample Work', 'Lead Follow-Up Test', 'Objection Handling Test'] },
  'YouTube Team': { displayName: 'YouTube Production Team', employmentFee: 3995, icon: '🎬', productType: 'team', description: 'A coordinated multi-employee digital workforce for topic research, content planning, script development, and publishing preparation.', supportedChannels: ['Content workspace', 'Email', 'Publishing handoff'], supportedSystems: ['Notion', 'Google Drive', 'Slack', 'YouTube Studio'], evaluationOptions: ['Sample Work', 'Topic Research Test', 'Script Test'], includedWorkload: 'Up to four long-form content packages per month with research, planning, and a draft script.', availability: 'Continuous production queue with agreed delivery windows.', protectLevel: 'ORCA Protect Standard', activationFee: 5000, teamRoles: ['Research Specialist', 'Content Planner', 'Scriptwriter', 'Publishing Coordinator'] },
  'YouTube Production Team': { displayName: 'YouTube Production Team', employmentFee: 3995, icon: '🎬', productType: 'team', supportedChannels: ['Content workspace', 'Email', 'Publishing handoff'], supportedSystems: ['Notion', 'Google Drive', 'Slack', 'YouTube Studio'], evaluationOptions: ['Sample Work', 'Topic Research Test', 'Script Test'], teamRoles: ['Research Specialist', 'Content Planner', 'Scriptwriter', 'Publishing Coordinator'] },
};

const CATEGORY_LABELS = { support: 'Customer Support', sales: 'Sales and Growth', admin: 'Administration', design: 'Content and Creative', research: 'Research' };

function asArray(value, fallback = []) { return Array.isArray(value) && value.length > 0 ? value : fallback; }
function asNumber(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }

export function formatMoney(value, options = {}) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: options.showCents ? 2 : 0 }).format(asNumber(value, 0));
}

export function getDigitalEmployeePresentation(record = {}) {
  const defaults = ROLE_DEFAULTS[record.name] || {};
  const employmentFee = asNumber(record.base_price, defaults.employmentFee || 0);
  const comparableMonthlySalary = asNumber(record.comparable_monthly_salary, defaults.comparableMonthlySalary || 0);
  const salaryDifference = Math.max(comparableMonthlySalary - employmentFee, 0);
  const supportedChannels = asArray(record.supported_channels, defaults.supportedChannels || []);
  const supportedSystems = asArray(record.supported_systems, defaults.supportedSystems || []);
  const evidenceStatus = record.evidence_status || 'new';
  const hasVerifiedEvidence = evidenceStatus === 'verified';
  return {
    id: record.id,
    displayName: defaults.displayName || record.name || 'Digital Employee',
    icon: record.icon_url || defaults.icon || '◉',
    description: record.description || defaults.description || 'Role-specific digital employee capability details are available on the full profile.',
    category: record.category || 'admin',
    categoryLabel: CATEGORY_LABELS[record.category] || 'Business Operations',
    publisherName: record.publisher_name || 'ORCA Studios',
    publisherType: record.publisher_type || 'first_party',
    publisherTypeLabel: (record.publisher_type || 'first_party') === 'third_party' ? 'Third-party' : 'First-party',
    isVerified: Boolean(record.is_verified ?? true),
    isOrcaCertified: Boolean(record.is_orca_certified ?? true),
    productType: record.product_type || defaults.productType || 'individual',
    productTypeLabel: (record.product_type || defaults.productType) === 'team' ? 'Multi-employee digital workforce' : 'Individual digital employee',
    evidenceStatus,
    hasVerifiedEvidence,
    rating: hasVerifiedEvidence ? asNumber(record.avg_rating, 0) : 0,
    customerReviews: hasVerifiedEvidence ? asNumber(record.total_reviews, 0) : 0,
    activeDeployments: hasVerifiedEvidence ? asNumber(record.total_deployments, 0) : 0,
    employmentFee,
    comparableMonthlySalary,
    salaryDifference,
    salaryDifferencePercent: comparableMonthlySalary > 0 ? Math.round((salaryDifference / comparableMonthlySalary) * 100) : 0,
    activationFee: asNumber(record.activation_fee, defaults.activationFee || 0),
    includedWorkload: record.included_workload || defaults.includedWorkload || 'Included workload is finalized during role and workflow scoping.',
    supportedChannels,
    supportedSystems,
    integrationsIncluded: asNumber(record.integrations_included, Math.min(supportedSystems.length, 2)),
    executionLimits: record.execution_limits || 'Customer-approved scope, permissions, policies, and workload limits apply.',
    availability: record.availability || defaults.availability || 'Availability is configured during deployment.',
    supportLevel: record.support_level || 'Guided onboarding and ongoing support.',
    protectLevel: record.protect_level || defaults.protectLevel || 'ORCA Protect Standard',
    overagePricing: record.overage_pricing || 'Additional workload is priced by volume, channel, and execution cost.',
    evaluationOptions: asArray(record.evaluation_options, defaults.evaluationOptions || ['Sample Work', 'Role Test']),
    teamRoles: asArray(record.team_roles, defaults.teamRoles || []),
    version: record.version || '1.0.0',
    releaseNotes: record.release_notes || 'Initial ORCA catalog release.',
  };
}
