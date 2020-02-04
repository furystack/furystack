import { Injector } from '@furystack/inject'
import { DockerContainerModel } from '../models/docker-container-model'
import '../services/exec-async'

export const readDockerContainers = async (injector: Injector) => {
  const containersTextPlain = await injector.execAsync(`docker container ls  --format="{{json .}},"`, {})
  const containersText = containersTextPlain.substring(0, containersTextPlain.length - 2).replace(/\\"/g, '')

  const containers: DockerContainerModel[] = JSON.parse(`[${containersText}]`)
  return containers
}
