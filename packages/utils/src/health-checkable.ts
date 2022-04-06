export type HealthCheckStatus = 'healthy' | 'unhealthy' | 'unknown'

/**
 * A health check result when everything is OK with the HealthCheckable
 */
export type HealthCheckHealthyResult = {
  healthy: 'healthy'
}

/**
 * A health check result when something is not OK with the HealthCheckable
 */
export type HealthCheckUnhealthyResult = {
  healthy: 'unhealthy'
  /**
   * A meaningful message that describes why the health check failed
   */
  reason: any
}

/**
 * A health check result when the Health Check status cannot be determined
 */
export type HealthCheckUnknownResult = {
  healthy: 'unknown'
  /**
   * An optional message that describes why the health check status cannot be determined
   */
  reason?: any
}

/**
 * A result type of a health check
 */
export type HealthCheckResult = HealthCheckHealthyResult | HealthCheckUnhealthyResult | HealthCheckUnknownResult

/**
 * A health checkable object
 */
export interface HealthCheckable {
  /**
   * Check the health of the object
   *
   * @returns A promise that resolves to a HealthCheckResult
   */
  checkHealth(): Promise<HealthCheckResult>
}

/**
 * Type guard that determines if an object is a HealthCheckable
 *
 * @param obj The object to check
 * @returns if the object is a HealthCheckable
 */
export const isHealthCheckable = (obj: any): obj is HealthCheckable => {
  return ((obj as HealthCheckable).checkHealth && typeof (obj as HealthCheckable).checkHealth === 'function') || false
}
