module.exports = {
  enabled: false,
  release_branch: 'master',
  develop_branch: 'dev',
  statuses: {
    checklist: {
      context: 'sert/checklist',
      description: '{{ completed }}/{{ total }} tasks complete'
    },
    semver: {
      context: 'sert/semver',
      description: 'Expected: v{{ expected }}, Found: v{{ found }}'
    }
  },
  required_statuses: {
    change: [
      'sert/checklist',
      'continuous-integration/travis-ci/pr',
      'continuous-integration/travis-ci/push'
    ],
    release: [
      // 'sert/checklist',
      'sert/semver',
      'continuous-integration/travis-ci/pr',
      'continuous-integration/travis-ci/push'
    ]
  },
  checklists: {
    change: [
      'Test code changes on the robot (if possible).',
      'Verify that significant changes have tests and pass successfully.',
      'Ensure this pull request is appropriately titled.'
    ],
    release: [
      'Test all code changes on the robot (if possible).',
      'Verify that core functionalities are tested and pass successfully.',
      'Talk with the rest of the programming team about this release and go over the significant changes.',
      'Perform any necessary squashing to keep the history clean (Andrew will be angry if there are any merge commits).'
    ]
  },
  labels: [
    // Difficulties
    {
      name: 'difficulty/easy',
      color: 'c5def5'
    },
    {
      name: 'difficulty/medium',
      color: 'fef2c0'
    },
    {
      name: 'difficulty/hard',
      color: 'e99695'
    },

    // Importances
    {
      name: 'importance/low',
      color: 'c5def5'
    },
    {
      name: 'importance/medium',
      color: 'fef2c0'
    },
    {
      name: 'importance/high',
      color: 'e99695'
    },

    // Areas
    {
      name: 'area/subsystem',
      color: '5319e7'
    },
    {
      name: 'area/command',
      color: '0052cc'
    },
    {
      name: 'area/control',
      color: '006b75'
    },

    // Types
    {
      name: 'type/bug',
      color: 'd93f0b'
    },
    {
      name: 'type/feature',
      color: '1d76db'
    },
    {
      name: 'type/release',
      color: '5319e7'
    },

    // Statuses
    {
      name: 'status/blocked',
      color: 'b60205'
    },

    // Processes
    {
      name: 'process/needs-triage',
      color: 'd93f0b'
    },
    {
      name: 'process/approved',
      color: '0e8a16'
    },
    {
      name: 'process/changes-requested',
      color: 'fbca04'
    },
    {
      name: 'process/review-pending',
      color: 'd4c5f9'
    },
    {
      name: 'process/checklist-done',
      color: '0e8a16'
    },
    {
      name: 'process/checklist-pending',
      color: 'd4c5f9'
    }
  ]
};
