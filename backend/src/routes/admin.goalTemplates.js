// admin.goalTemplates.js: the four admin routes for goal templates.
// Create (POST), read (GET), update (PUT) and delete (DELETE).
// Only admins can reach them: app.js puts requireAuth and requireRole('admin') in front.


const express = require('express');
const templates = require('../db/templates');

const router = express.Router();


router.post('/', (req, res) => {
  const body = req.body || {};


  if (!body.templateName || !body.goalType) {
    return res.status(400).json({ error: 'Template name and goal type are required' });
  }


  const id = templates.addGoalTemplate(
    req.user.user_id,
    body.templateName,
    body.goalType,
    body.description || null
  );

 
  res.status(201).json({ goalTemplateId: Number(id) });
});


router.get('/', (req, res) => {
  res.json(templates.listGoalTemplates());
});


router.get('/:id', (req, res) => {
  const template = templates.getGoalTemplate(Number(req.params.id));


  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json(template);
});


router.put('/:id', (req, res) => {
  const body = req.body || {};

  if (!body.templateName || !body.goalType) {
    return res.status(400).json({ error: 'Template name and goal type are required' });
  }

 
  const changed = templates.updateGoalTemplate(
    Number(req.params.id),
    body.templateName,
    body.goalType,
    body.description || null
  );

  if (changed === 0) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json({ updated: true });
});


router.delete('/:id', (req, res) => {
  const deleted = templates.deleteGoalTemplate(Number(req.params.id));

  if (deleted === 0) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json({ deleted: true });
});

module.exports = router;