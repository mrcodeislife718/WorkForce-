const express = require('express');
const { ConnectorDefinition } = require('../models');
const registry = require('../connectors/registerBuiltins')();

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const definitions = await ConnectorDefinition.findAll({
      where: { status: ['active', 'not_configured'] },
      attributes: { exclude: ['configuration_schema'] },
      order: [['category', 'ASC'], ['name', 'ASC']],
    });
    return res.json(definitions.map((definition) => ({
      ...definition.toJSON(),
      adapter_installed: registry.has(definition.adapter_key),
      available: definition.status === 'active' && registry.has(definition.adapter_key),
    })));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load connector catalog.' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const definition = await ConnectorDefinition.findOne({ where: { key: req.params.key } });
    if (!definition) return res.status(404).json({ error: 'Connector was not found.' });
    return res.json({
      ...definition.toJSON(),
      adapter_installed: registry.has(definition.adapter_key),
      available: definition.status === 'active' && registry.has(definition.adapter_key),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load connector.' });
  }
});

module.exports = router;
