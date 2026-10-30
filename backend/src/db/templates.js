
// templates.js: functions that read and change the two template tables

const db = require('./connection');



// INSERT=adds a new row

function addExerciseTemplate(adminId, templateName, category, description) {
  const sql =
    'INSERT INTO exercise_templates (admin_id, template_name, category, description) VALUES (?, ?, ?, ?)';
  const statement = db.prepare(sql);
  const result = statement.run(adminId, templateName, category, description);
  return result.lastInsertRowid;
}

// SELECT=read rows. 
function listExerciseTemplates() {
  const sql = 'SELECT * FROM exercise_templates';
  const statement = db.prepare(sql);
  return statement.all();
}

// UPDATE=change an existing row
// Returns how many rows changed:1 if it was found,0 if there is no such id.
function updateExerciseTemplate(id, templateName, category, description) {
  const sql =
    'UPDATE exercise_templates SET template_name = ?, category = ?, description = ? WHERE exercise_template_id = ?';
  const statement = db.prepare(sql);
  const result = statement.run(templateName, category, description, id);
  return result.changes;
}

// DELETE=remove a row
function deleteExerciseTemplate(id) {
  const sql = 'DELETE FROM exercise_templates WHERE exercise_template_id = ?';
  const statement = db.prepare(sql);
  const result = statement.run(id);
  return result.changes;
}



function addGoalTemplate(adminId, templateName, goalType, description) {
  const sql =
    'INSERT INTO goal_templates (admin_id, template_name, goal_type, description) VALUES (?, ?, ?, ?)';
  const statement = db.prepare(sql);
  const result = statement.run(adminId, templateName, goalType, description);
  return result.lastInsertRowid;
}

function listGoalTemplates() {
  const sql = 'SELECT * FROM goal_templates';
  const statement = db.prepare(sql);
  return statement.all();
}

function updateGoalTemplate(id, templateName, goalType, description) {
  const sql =
    'UPDATE goal_templates SET template_name = ?, goal_type = ?, description = ? WHERE goal_template_id = ?';
  const statement = db.prepare(sql);
  const result = statement.run(templateName, goalType, description, id);
  return result.changes;
}

function deleteGoalTemplate(id) {
  const sql = 'DELETE FROM goal_templates WHERE goal_template_id = ?';
  const statement = db.prepare(sql);
  const result = statement.run(id);
  return result.changes;
}

// Make the functions available to other files.
module.exports = {
  addExerciseTemplate,
  listExerciseTemplates,
  updateExerciseTemplate,
  deleteExerciseTemplate,
  addGoalTemplate,
  listGoalTemplates,
  updateGoalTemplate,
  deleteGoalTemplate,
};
