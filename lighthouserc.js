// Lighthouse CI configuration (mobile preset)
// TODO: Introduce /api/v2 & adjust thresholds if core web vitals budgets change.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run lh:serve',
      url: [
        'http://localhost:3000/raipur/bilaspur/fare',
        'http://localhost:3000/raipur/raipur-to-bilaspur-taxi.html'
      ],
      numberOfRuns: 1,
      settings: {
        preset: 'mobile'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.90}]
      }
    },
    upload: { target: 'filesystem', outputDir: 'artifacts' }
  }
};
