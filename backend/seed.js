require('dotenv').config();
const sequelize = require('./config/database');
const {
  Worker,
  WorkerPermission,
  User,
  ConnectorDefinition,
} = require('./models');
const bcrypt = require('bcrypt');

const developerId = '11111111-1111-1111-1111-111111111111';

const digitalEmployees = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Customer Support Specialist',
    developer_id: developerId,
    description: 'Handles customer conversations, support tickets, service recovery, and escalations 24/7/365.',
    category: 'support',
    icon_url: '🎧',
    hero_banner_url: null,
    avg_rating: 0,
    total_reviews: 0,
    total_deployments: 0,
    price_model: 'subscription',
    base_price: 24.00,
    version: '1.0.0',
    release_notes: 'Initial workspace-agnostic release.',
    status: 'published',
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Founder Assistant',
    developer_id: developerId,
    description: 'Manages email, calendars, files, follow-ups, and administrative workflows 24/7/365.',
    category: 'admin',
    icon_url: '📅',
    hero_banner_url: null,
    avg_rating: 0,
    total_reviews: 0,
    total_deployments: 0,
    price_model: 'subscription',
    base_price: 29.00,
    version: '1.0.0',
    release_notes: 'Initial workspace-agnostic release.',
    status: 'published',
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'Commerce Support Specialist',
    developer_id: developerId,
    description: 'Supports orders, customers, products, fulfillment questions, and service recovery 24/7/365.',
    category: 'support',
    icon_url: '🛍️',
    hero_banner_url: null,
    avg_rating: 0,
    total_reviews: 0,
    total_deployments: 0,
    price_model: 'subscription',
    base_price: 27.00,
    version: '1.0.0',
    release_notes: 'Initial workspace-agnostic release.',
    status: 'published',
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    name: 'Sales Follow-Up Specialist',
    developer_id: developerId,
    description: 'Follows up with leads, updates records, nurtures opportunities, and books meetings 24/7/365.',
    category: 'sales',
    icon_url: '📞',
    hero_banner_url: null,
    avg_rating: 0,
    total_reviews: 0,
    total_deployments: 0,
    price_model: 'subscription',
    base_price: 23.00,
    version: '1.0.0',
    release_notes: 'Initial workspace-agnostic release.',
    status: 'published',
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    name: 'Content Production Specialist',
    developer_id: developerId,
    description: 'Researches, drafts, organizes, and publishes approved content workflows 24/7/365.',
    category: 'design',
    icon_url: '🎬',
    hero_banner_url: null,
    avg_rating: 0,
    total_reviews: 0,
    total_deployments: 0,
    price_model: 'subscription',
    base_price: 26.00,
    version: '1.0.0',
    release_notes: 'Initial workspace-agnostic release.',
    status: 'published',
  },
];

const permissions = [
  ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'messages.read', 'Read customer messages', 'Read incoming customer conversations.', 'message', 'read', 'medium', true, false],
  ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'messages.send', 'Send customer replies', 'Send replies within customer-approved resources.', 'message', 'create', 'high', true, false],
  ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'tickets.update', 'Update support tickets', 'Update ticket status and internal support notes.', 'ticket', 'update', 'high', false, false],
  ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'email.read', 'Read approved mailboxes', 'Read messages in customer-selected mailboxes.', 'email', 'read', 'medium', true, false],
  ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'email.send', 'Send approved email', 'Send email from customer-approved accounts.', 'email', 'create', 'high', true, false],
  ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'calendar.events.create', 'Create calendar events', 'Create meetings on customer-approved calendars.', 'calendar_event', 'create', 'high', false, false],
  ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'files.read', 'Read approved files', 'Read files from customer-selected resources.', 'file', 'read', 'medium', false, false],
  ['cccccccc-cccc-cccc-cccc-cccccccccccc', 'orders.read', 'Read orders', 'Read customer-approved order records.', 'order', 'read', 'medium', true, false],
  ['cccccccc-cccc-cccc-cccc-cccccccccccc', 'customers.read', 'Read customer records', 'Read customer records needed to resolve service requests.', 'customer', 'read', 'medium', true, false],
  ['cccccccc-cccc-cccc-cccc-cccccccccccc', 'orders.update', 'Update orders', 'Update approved order fields and fulfillment notes.', 'order', 'update', 'critical', false, true],
  ['dddddddd-dddd-dddd-dddd-dddddddddddd', 'contacts.read', 'Read contacts', 'Read customer-approved contact records.', 'contact', 'read', 'medium', true, false],
  ['dddddddd-dddd-dddd-dddd-dddddddddddd', 'contacts.update', 'Update contacts', 'Update follow-up status and approved contact fields.', 'contact', 'update', 'high', true, false],
  ['dddddddd-dddd-dddd-dddd-dddddddddddd', 'calendar.events.create', 'Book meetings', 'Create approved sales meetings.', 'calendar_event', 'create', 'high', false, false],
  ['eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'files.read', 'Read source material', 'Read customer-selected research and source files.', 'file', 'read', 'medium', true, false],
  ['eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'documents.create', 'Create content documents', 'Create drafts in customer-approved document systems.', 'document', 'create', 'high', true, false],
  ['eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'content.publish', 'Publish approved content', 'Publish content only after customer-defined approval checks.', 'content', 'create', 'critical', false, true],
].map(([worker_id, capability_key, name, description, resource_type, action, risk_level, is_required, requires_human_approval]) => ({
  worker_id,
  capability_key,
  name,
  description,
  resource_type,
  action,
  risk_level,
  is_required,
  requires_human_approval,
  constraints_schema: {},
}));

const connectorDefinitions = [
  {
    key: 'generic-rest',
    name: 'Generic REST API',
    description: 'Connects ORCA to a real HTTPS API using customer-defined operations and capabilities.',
    category: 'universal',
    auth_type: 'custom',
    adapter_key: 'generic-rest',
    status: 'active',
    is_native: false,
    supports_workspace_discovery: false,
    supports_resource_discovery: true,
    supports_token_refresh: false,
    capability_manifest: { schema_version: '1.0', capabilities: [{ key: 'api.request' }] },
    configuration_schema: {},
  },
  {
    key: 'generic-webhook',
    name: 'Signed Webhook',
    description: 'Installs and controls a digital employee through a real signed webhook endpoint.',
    category: 'universal',
    auth_type: 'webhook',
    adapter_key: 'generic-webhook',
    status: 'active',
    is_native: false,
    supports_workspace_discovery: false,
    supports_resource_discovery: false,
    supports_token_refresh: false,
    capability_manifest: { schema_version: '1.0', capabilities: [{ key: 'webhook.deliver' }] },
    configuration_schema: {},
  },
  {
    key: 'slack',
    name: 'Slack',
    description: 'Native Slack workspace integration.',
    category: 'messaging',
    auth_type: 'oauth2',
    adapter_key: 'slack',
    status: 'not_configured',
    is_native: true,
    supports_workspace_discovery: true,
    supports_resource_discovery: true,
    supports_token_refresh: false,
    capability_manifest: { schema_version: '1.0', capabilities: [{ key: 'messages.read' }, { key: 'messages.send' }, { key: 'files.read' }] },
    configuration_schema: {},
  },
  {
    key: 'google-workspace',
    name: 'Google Workspace',
    description: 'Native Gmail, Calendar, Drive, and Contacts integration.',
    category: 'productivity',
    auth_type: 'oauth2',
    adapter_key: 'google-workspace',
    status: 'not_configured',
    is_native: true,
    supports_workspace_discovery: true,
    supports_resource_discovery: true,
    supports_token_refresh: true,
    capability_manifest: { schema_version: '1.0', capabilities: [{ key: 'email.read' }, { key: 'email.send' }, { key: 'calendar.events.create' }, { key: 'files.read' }, { key: 'documents.create' }, { key: 'contacts.read' }, { key: 'contacts.update' }] },
    configuration_schema: {},
  },
  {
    key: 'microsoft-365',
    name: 'Microsoft 365',
    description: 'Native Outlook, Teams, OneDrive, SharePoint, Calendar, and Contacts integration.',
    category: 'productivity',
    auth_type: 'oauth2',
    adapter_key: 'microsoft-365',
    status: 'not_configured',
    is_native: true,
    supports_workspace_discovery: true,
    supports_resource_discovery: true,
    supports_token_refresh: true,
    capability_manifest: { schema_version: '1.0', capabilities: [{ key: 'messages.read' }, { key: 'messages.send' }, { key: 'email.read' }, { key: 'email.send' }, { key: 'calendar.events.create' }, { key: 'files.read' }, { key: 'documents.create' }, { key: 'contacts.read' }, { key: 'contacts.update' }] },
    configuration_schema: {},
  },
  {
    key: 'shopify',
    name: 'Shopify',
    description: 'Native Shopify store integration.',
    category: 'commerce',
    auth_type: 'oauth2',
    adapter_key: 'shopify',
    status: 'not_configured',
    is_native: true,
    supports_workspace_discovery: true,
    supports_resource_discovery: true,
    supports_token_refresh: false,
    capability_manifest: { schema_version: '1.0', capabilities: [{ key: 'orders.read' }, { key: 'orders.update' }, { key: 'customers.read' }, { key: 'products.read' }, { key: 'products.update' }] },
    configuration_schema: {},
  },
  {
    key: 'hubspot',
    name: 'HubSpot',
    description: 'Native HubSpot CRM integration.',
    category: 'crm',
    auth_type: 'oauth2',
    adapter_key: 'hubspot',
    status: 'not_configured',
    is_native: true,
    supports_workspace_discovery: true,
    supports_resource_discovery: true,
    supports_token_refresh: true,
    capability_manifest: { schema_version: '1.0', capabilities: [{ key: 'contacts.read' }, { key: 'contacts.update' }, { key: 'tickets.update' }, { key: 'customers.read' }] },
    configuration_schema: {},
  },
  {
    key: 'notion',
    name: 'Notion',
    description: 'Native Notion workspace integration.',
    category: 'knowledge',
    auth_type: 'oauth2',
    adapter_key: 'notion',
    status: 'not_configured',
    is_native: true,
    supports_workspace_discovery: true,
    supports_resource_discovery: true,
    supports_token_refresh: false,
    capability_manifest: { schema_version: '1.0', capabilities: [{ key: 'files.read' }, { key: 'documents.create' }, { key: 'documents.update' }] },
    configuration_schema: {},
  },
];

async function seed() {
  await sequelize.sync();

  const seedPassword = process.env.SEED_ADMIN_PASSWORD;
  if (seedPassword) {
    const password = await bcrypt.hash(seedPassword, 12);
    await User.upsert({
      id: developerId,
      email: process.env.SEED_ADMIN_EMAIL || 'dev@orca.com',
      password,
      name: 'ORCA Studios',
    });
  }

  for (const digitalEmployee of digitalEmployees) {
    await Worker.upsert(digitalEmployee);
  }

  for (const permission of permissions) {
    await WorkerPermission.upsert(permission);
  }

  for (const connector of connectorDefinitions) {
    await ConnectorDefinition.upsert(connector);
  }

  console.log('ORCA catalog and connector definitions seeded without deleting existing data.');
  await sequelize.close();
}

seed().catch(async (error) => {
  console.error('ORCA seed failed:', error);
  await sequelize.close();
  process.exit(1);
});
