import type { CreateMfeCallback, DestroyMfeCallback } from './create-custom-micro-frontend.js'

export class CreateMicroFrontendService<TApi> {
  constructor(
    public readonly create: CreateMfeCallback<TApi>,
    public readonly destroy?: DestroyMfeCallback<TApi>,
  ) {}
}
