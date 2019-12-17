import { DockerContainerModel } from '../models/docker-container-model'
import { execAsync } from './exec-async'

export const readDockerContainers = async () => {
  const containersTextPlain = await execAsync(`docker container ls  --format="{{json .}},"`, {})
  const containersText = containersTextPlain.substring(0, containersTextPlain.length - 2).replace(/\\"/g, '')

  const containers: DockerContainerModel[] = JSON.parse(`[${containersText}]`)
  return containers
}
