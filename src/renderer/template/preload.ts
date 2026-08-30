/** Re-export so main.tsx does not reach into the canvas folder for start-up work. */
export { TEMPLATES } from './layout.schema'
export { preloadTemplate, loadedTemplateImages } from '../components/canvas/useTemplateImage'
