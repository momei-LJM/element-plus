import { createApp } from 'vue'
import ElementPlus from 'element-plus/es/index.mjs'
import 'element-plus/dist/index.css'
import App from './src/App.vue'

const app = createApp(App)
console.log(11111111, ElementPlus)

app.use(ElementPlus)
app.mount('#app')
