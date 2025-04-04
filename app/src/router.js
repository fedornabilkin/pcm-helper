import {createRouter, createWebHistory} from 'vue-router';
import Main from '@/components/page/Main.vue';
import PageNotFound from '@/components/page/PageNotFound.vue';
import Personality from "@/components/page/Personality.vue";
import Channel from "@/components/page/Channel.vue";
import Interaction from "@/components/page/Interaction.vue";


const routes = [
    // {
    //   path: '/',
    //   component: () => import('./components/pages/Main.vue')
    // },

    {
        path: '/',
        name: 'main',
        meta: {
            title: 'Ваш помощник в мире коммуникации'
        },
        component: Main
    },
    {
        path: '/personality',
        name: 'personality',
        meta: {
            title: 'Части личности'
        },
        component: Personality
    },
    {
        path: '/channel',
        name: 'channel',
        meta: {
            title: 'Каналы коммуникации'
        },
        component: Channel
    },
    {
        path: '/interaction',
        name: 'interaction',
        meta: {
            title: 'Стили взаимодействия'
        },
        component: Interaction
    },

    {
        path: '/:pathMatch(.*)',
        name: 'page-not-found',
        meta: {
            title: 'Страница не найдена'
        },
        component: PageNotFound
    },

]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, from, next) => {
    // instead of having to check every route record with
    // to.matched.some(record => record.meta.requiresAuth)
    // if (to.meta.requiresAuth && store.getters['auth/isAuthorized'] === false) {
    //     // this route requires auth, check if logged in
    //     // if not, redirect to login page.
    //     return {
    //         path: '/',
    //         // save the location we were at to come back later
    //         //query: { redirect: to.fullPath },
    //     }
    // }
    const prefixTitle = 'PCM Helper.'
    const { title } = to.meta;
    if(title !== undefined) {
        document.title = `${prefixTitle} ${title}`;
    }

    next();
})

export { router }
