// frontend/babel.config.cjs
// Lets Jest understand modern JavaScript (import/export) and JSX.
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};