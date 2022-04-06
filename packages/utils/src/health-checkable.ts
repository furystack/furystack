export type HealthCheckStatus = 'healthy' | 'unhealthy' | 'unknown'

export type HealthCheckHealthyResult = {
  healthy: 'healthy'
}

export type HealthCheckUnhealthyResult = {
  healthy: 'unhealthy'
  reason: any
}

export type HealthCheckUnknownResult = {
  healthy: 'unknown'
  reason?: any
}

export type HealthCheckResult = HealthCheckHealthyResult | HealthCheckUnhealthyResult | HealthCheckUnknownResult

export interface HealthCheckable {
  checkHealth(): Promise<HealthCheckResult>
}

export const isHealthCheckable = (obj: any): obj is HealthCheckable => {
  return ((obj as HealthCheckable).checkHealth && typeof (obj as HealthCheckable).checkHealth === 'function') || false
}
