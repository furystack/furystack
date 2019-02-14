/**
 * Represents a job instance
 */
export interface IJob {
  displayName?: string
  description?: string
  category?: string
  prerequisiteJobNames?: string[]
  completed?: boolean
  repeatable?: boolean
}
