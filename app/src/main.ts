import {createApp} from 'vue';
import {router} from './router';

import App from './App.vue';
import {useTheme} from "@/core/composable/theme/useTheme";

import '@fortawesome/fontawesome-free/css/fontawesome.css';
import '@/assets/font-awesome.scss';
import '@/assets/bulma/app.scss';
import '@/assets/bulma/root-custom.css'

useTheme().applyTheme()

const app = createApp(App)

app
  .use(router)

app.mount('#app')
