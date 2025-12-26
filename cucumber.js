export default {
  default: {
    import: [
      'features/support/bluetooth-connection.steps.ts',
      'features/support/data-streaming.steps.ts',
      'features/support/device-info.steps.ts'
    ],
    format: ['progress', 'summary'],
    publishQuiet: true,
  }
};
