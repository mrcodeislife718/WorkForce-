const sequelize = require('./config/database');
const { Worker, WorkerPermission, User } = require('./models');
const bcrypt = require('bcrypt');

async function seed() {
  await sequelize.sync({ force: true });

  // create a default user (developer)
  const hashed = await bcrypt.hash('password123', 10);
  const dev = await User.create({
    id: '11111111-1111-1111-1111-111111111111',
    email: 'dev@orca.com',
    password: hashed,
    name: 'ORCA Studios',
  });

  const workers = [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Customer Support',
      developer_id: dev.id,
      description: 'Handles chats, tickets & customer inquiries',
      category: 'support',
      icon_url: '🎧',
      hero_banner_url: 'https://via.placeholder.com/600x300/0E4DFF/FFFFFF?text=Customer+Support',
      avg_rating: 4.8,
      total_reviews: 1200,
      total_deployments: 2300,
      price_model: 'subscription',
      base_price: 24.00,
      version: '2.1.0',
      release_notes: 'Improved tone detection',
      status: 'published',
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Founder Assistant',
      developer_id: dev.id,
      description: 'Manages ops, calendar, email & admin tasks',
      category: 'admin',
      icon_url: '📅',
      hero_banner_url: 'https://via.placeholder.com/600x300/1A2230/FFFFFF?text=Founder+Assistant',
      avg_rating: 4.9,
      total_reviews: 842,
      total_deployments: 1500,
      price_model: 'subscription',
      base_price: 29.00,
      version: '1.8.0',
      release_notes: 'Calendar sync improved',
      status: 'published',
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      name: 'Shopify Support',
      developer_id: dev.id,
      description: 'Product, order & customer support for your store',
      category: 'support',
      icon_url: '🛍️',
      hero_banner_url: 'https://via.placeholder.com/600x300/22C9FF/05070B?text=Shopify+Support',
      avg_rating: 4.8,
      total_reviews: 623,
      total_deployments: 980,
      price_model: 'subscription',
      base_price: 27.00,
      version: '3.0.0',
      release_notes: 'Shopify API v2024-04',
      status: 'published',
    },
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      name: 'Sales Follow-Up',
      developer_id: dev.id,
      description: 'Follows up, nurtures & books more calls',
      category: 'sales',
      icon_url: '📞',
      hero_banner_url: 'https://via.placeholder.com/600x300/6E7B8F/FFFFFF?text=Sales+Follow-Up',
      avg_rating: 4.7,
      total_reviews: 512,
      total_deployments: 760,
      price_model: 'subscription',
      base_price: 23.00,
      version: '1.2.0',
      release_notes: 'Better call scheduling',
      status: 'published',
    },
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      name: 'YouTube Team',
      developer_id: dev.id,
      description: 'Research, scripts, editing & publishing',
      category: 'design',
      icon_url: '🎬',
      hero_banner_url: 'https://via.placeholder.com/600x300/05070B/FFFFFF?text=YouTube+Team',
      avg_rating: 4.9,
      total_reviews: 1100,
      total_deployments: 2100,
      price_model: 'subscription',
      base_price: 26.00,
      version: '2.0.0',
      release_notes: 'Added thumbnail generation',
      status: 'published',
    },
  ];

  for (const w of workers) {
    await Worker.create(w);
  }

  // Add permissions
  const perms = [
    { worker_id: workers[0].id, tool: 'slack', scope: 'Read messages', is_required: true },
    { worker_id: workers[0].id, tool: 'slack', scope: 'Send replies', is_required: true },
    { worker_id: workers[1].id, tool: 'gmail', scope: 'Read emails', is_required: true },
    { worker_id: workers[1].id, tool: 'gmail', scope: 'Send emails', is_required: true },
    { worker_id: workers[2].id, tool: 'shopify', scope: 'View orders', is_required: true },
    { worker_id: workers[2].id, tool: 'shopify', scope: 'Update products', is_required: false },
    { worker_id: workers[3].id, tool: 'hubspot', scope: 'Read contacts', is_required: true },
    { worker_id: workers[4].id, tool: 'slack', scope: 'Read messages', is_required: true },
  ];
  for (const p of perms) {
    await WorkerPermission.create(p);
  }

  console.log('✅ Database seeded!');
  process.exit();
}
seed();