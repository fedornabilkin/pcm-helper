import {createApp} from 'vue';
import {router} from './router';

import App from './App.vue';

import '@fortawesome/fontawesome-free/css/all.css';
import 'bulma/css/bulma.css';
import '@/assets/bulma/root-custom.css'

const app = createApp(App)

app
  .use(router)

app.mount('#app')
