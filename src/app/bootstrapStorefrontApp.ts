import { mountAuthPage } from '../features/auth/mountAuthPage.ts'

export const bootstrapStorefrontApp = async (appRoot: HTMLDivElement) => {
  await mountAuthPage(appRoot)
}
