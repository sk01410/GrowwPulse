export interface PulseConfig {
  baseIntervalMinutes: number
  minimumObservationsForBaseline: number
  insufficientDataThreshold: number
  freshnessThresholdMinutes: number
  attentionThresholds: {
    high: number
    important: number
    watch: number
  }
  meaningfulMovementThreshold: number // Min % change to count as "moved" (e.g. 0.05%)
}

export const defaultPulseConfig: PulseConfig = {
  baseIntervalMinutes: 15, // 15-minute base interval
  minimumObservationsForBaseline: 15,
  insufficientDataThreshold: 4,
  freshnessThresholdMinutes: 30,
  attentionThresholds: {
    high: 2.5,
    important: 1.75,
    watch: 1.25,
  },
  meaningfulMovementThreshold: 0.0005, // 0.05%
}
