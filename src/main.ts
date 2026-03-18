import './styles/global.css'
import { bootstrapStorefrontApp } from './app/bootstrapStorefrontApp.ts'

const appRoot = document.querySelector<HTMLDivElement>('#app')

if (!appRoot) {
  throw new Error('App root element was not found.')
}

void bootstrapStorefrontApp(appRoot)
