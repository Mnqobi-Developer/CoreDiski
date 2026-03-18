import { mountStorefrontApp } from './mountStorefrontApp.ts'

export const bootstrapStorefrontApp = async (appRoot: HTMLDivElement) => {
  await mountStorefrontApp(appRoot)
}
