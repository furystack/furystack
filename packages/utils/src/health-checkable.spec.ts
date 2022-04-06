import { HealthCheckable, HealthCheckResult, isHealthCheckable } from './health-checkable'

describe('HealthCheckable', () => {
  describe('type guard', () => {
    it('should return true for HealthCheckable', () => {
      class HC implements HealthCheckable {
        public async checkHealth(): Promise<HealthCheckResult> {
          return {
            healthy: 'healthy',
          }
        }
      }
      expect(isHealthCheckable(new HC())).toBe(true)
    })
    it('should return false for non-HealthCheckable', () => {
      expect(isHealthCheckable({})).toBe(false)
      expect(isHealthCheckable('')).toBe(false)
      expect(isHealthCheckable({ checkHealth: 3 })).toBe(false)
    })
  })
})
