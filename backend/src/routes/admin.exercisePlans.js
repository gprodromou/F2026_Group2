// admin.exercisePlans.js: the four admin routes for exercise plan templates.
// Create,read ,update  and delete.
// Only admins can reach them


const express = require('express');
const templates = require('../db/templates');

const router = express.Router();


router.post('/', (req, res) => {
  const body = req.body || {};

  // The template must have a name
  if (!body.templateName) {
    return res.status(400).json({ error: 'Template name is required' });
  }

  
  const id = templates.addExerciseTemplate(
    req.user.user_id,
    body.templateName,
    body.category || null,
    body.description || null
  );


  res.status(201).json({ exerciseTemplateId: Number(id) });
});


router.get('/', (req, res) => {
  res.json(templates.listExerciseTemplates());
});


router.get('/:id', (req, res) => {
  const template = templates.getExerciseTemplate(Number(req.params.id));

  // No row with that id: 404 =not found
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json(template);
});

//  UPDATE: PUT /admin/exercise-plans/:id
router.put('/:id', (req, res) => {
  const body = req.body || {};

  if (!body.templateName) {
    return res.status(400).json({ error: 'Template name is required' });
  }

  // The function gives back how many rows changed: 1 = found, 0 = no such id.
  const changed = templates.updateExerciseTemplate(
    Number(req.params.id),
    body.templateName,
    body.category || null,
    body.description || null
  );

  if (changed === 0) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json({ updated: true });
});

//DELETE: DELETE /admin/exercise-plans/:id
router.delete('/:id', (req, res) => {
  const deleted = templates.deleteExerciseTemplate(Number(req.params.id));

  if (deleted === 0) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json({ deleted: true });
});

module.exports = router;