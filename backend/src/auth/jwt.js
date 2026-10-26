// TEMPORARY jwt.js (Marius), so the login route works until Georgios adds the real one
// Georgios will replace this file with his real JWT code. Same name, same function
function createToken(user) {
  return 'temporary-token-for-user-' + user.user_id;
}

module.exports = { createToken };