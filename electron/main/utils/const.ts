import { join } from 'path'   
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const PRELOAD = join(__dirname, '../preload/index.mjs')
export const URL = process.env.VITE_DEV_SERVER_URL
export const DIST = join(__dirname, '../../dist')
export const INDEX_HTML = join(DIST, 'index.html')
export const TITLE_BAR_HEIGHT = 46
