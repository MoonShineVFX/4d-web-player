module.exports = (api) => {
  api.cache.using(() => process.env.NODE_ENV);
  const plugins = [];
  if (api.env('production')) {
    plugins.push(['transform-remove-console', { 'exclude': [ 'error', 'warn'] }])
  } else {
    plugins.push(['react-refresh/babel'])
  }

  return {
    presets: [
      '@babel/preset-env',
      '@babel/preset-typescript',
      ['@babel/preset-react', { development: !api.env('production'), runtime: 'automatic' }],
    ],
    plugins: plugins
  };
};
