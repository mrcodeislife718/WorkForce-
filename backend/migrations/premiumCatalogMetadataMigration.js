const { Worker } = require('../models');

const enrichments = {
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': {
    publisher_name: 'ORCA Studios', publisher_type: 'first_party', is_verified: true, is_orca_certified: true,
    evidence_status: 'new', product_type: 'individual', activation_fee: 2500,
    included_workload: 'Up to 750 resolved customer conversations per month across two approved channels.',
    supported_channels: ['Email', 'Live chat', 'Helpdesk'], supported_systems: ['Gmail', 'Slack', 'Zendesk', 'HubSpot'],
    integrations_included: 2, execution_limits: 'One production workspace and customer-approved policies. Higher volume is billed separately.',
    availability: '24/7 monitoring with customer-defined response and escalation windows.',
    support_level: 'Guided onboarding and monthly performance optimization.', protect_level: 'ORCA Protect Standard',
    overage_pricing: 'Quoted by channel, workload, and required response time.',
    evaluation_options: ['Sample Work', 'Complaint Resolution Test', 'Ticket Classification Test', 'Brand-Tone Test'], team_roles: [],
  },
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb': {
    publisher_name: 'ORCA Studios', publisher_type: 'first_party', is_verified: true, is_orca_certified: true,
    evidence_status: 'new', product_type: 'individual', activation_fee: 2000,
    included_workload: 'Up to 500 inbound interactions and appointment actions per month.',
    supported_channels: ['Phone', 'Email', 'Calendar'], supported_systems: ['Google Calendar', 'Gmail', 'HubSpot', 'Slack'],
    integrations_included: 2, execution_limits: 'One business line, one primary calendar, and approved routing rules.',
    availability: '24/7 intake with customer-defined live-service and callback windows.',
    support_level: 'Guided onboarding and monthly routing optimization.', protect_level: 'ORCA Protect Standard',
    overage_pricing: 'Quoted by call volume, telephony cost, and workflow complexity.',
    evaluation_options: ['Sample Work', 'Reception Scenario Test', 'Scheduling Test', 'Lead Qualification Test'], team_roles: [],
  },
  'cccccccc-cccc-cccc-cccc-cccccccccccc': {
    publisher_name: 'ORCA Studios', publisher_type: 'first_party', is_verified: true, is_orca_certified: true,
    evidence_status: 'new', product_type: 'individual', activation_fee: 2750,
    included_workload: 'Up to 900 shopper conversations and order-support actions per month.',
    supported_channels: ['Email', 'Live chat', 'Store inbox'], supported_systems: ['Shopify', 'Gmail', 'Slack', 'HubSpot'],
    integrations_included: 2, execution_limits: 'One storefront and customer-approved refund, return, and escalation policies.',
    availability: '24/7 monitoring with customer-defined response windows.',
    support_level: 'Guided onboarding and monthly commerce workflow optimization.', protect_level: 'ORCA Protect Standard',
    overage_pricing: 'Quoted by interaction volume and order-operation complexity.',
    evaluation_options: ['Sample Work', 'Order Issue Test', 'Refund Policy Test', 'Escalation Judgment Test'], team_roles: [],
  },
  'dddddddd-dddd-dddd-dddd-dddddddddddd': {
    publisher_name: 'ORCA Studios', publisher_type: 'first_party', is_verified: true, is_orca_certified: true,
    evidence_status: 'new', product_type: 'individual', activation_fee: 3000,
    included_workload: 'Up to 1,000 approved follow-up actions per month across two channels.',
    supported_channels: ['Email', 'CRM', 'Calendar'], supported_systems: ['HubSpot', 'Gmail', 'Google Calendar', 'Slack'],
    integrations_included: 2, execution_limits: 'Customer-approved leads, messaging, cadence, and booking rules only.',
    availability: 'Continuous queue monitoring with customer-defined contact windows.',
    support_level: 'Guided onboarding and monthly conversion-workflow optimization.', protect_level: 'ORCA Protect Standard',
    overage_pricing: 'Quoted by contact volume, channel, and sequence complexity.',
    evaluation_options: ['Sample Work', 'Lead Follow-Up Test', 'Objection Handling Test', 'Calendar Booking Test'], team_roles: [],
  },
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee': {
    publisher_name: 'ORCA Studios', publisher_type: 'first_party', is_verified: true, is_orca_certified: true,
    evidence_status: 'new', product_type: 'team', activation_fee: 5000,
    included_workload: 'Up to four long-form content packages per month, each with research, plan, and draft script.',
    supported_channels: ['Content workspace', 'Email', 'Publishing handoff'], supported_systems: ['Notion', 'Google Drive', 'Slack', 'YouTube Studio'],
    integrations_included: 3, execution_limits: 'One channel brand, customer-approved sources, and one revision round per package.',
    availability: 'Continuous production queue with agreed delivery windows.',
    support_level: 'Guided onboarding, brand calibration, and monthly production review.', protect_level: 'ORCA Protect Standard',
    overage_pricing: 'Quoted per additional content package, revision, or specialized production step.',
    evaluation_options: ['Sample Work', 'Topic Research Test', 'Script Test', 'Brand Alignment Test'],
    team_roles: ['Research Specialist', 'Content Planner', 'Scriptwriter', 'Publishing Coordinator'],
  },
};

async function migratePremiumCatalogMetadata() {
  for (const [id, values] of Object.entries(enrichments)) {
    await Worker.update(values, { where: { id } });
  }
}

module.exports = migratePremiumCatalogMetadata;
