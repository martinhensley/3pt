import type { GenkitConfig } from 'genkit';

const config: GenkitConfig = {
  telemetry: {
    instrumentation: 'genkit',
    logger: 'genkit',
  },
  flowStateStore: 'local',
  traceStore: 'local',
  enableTracingAndMetrics: true,
};

export default config;
