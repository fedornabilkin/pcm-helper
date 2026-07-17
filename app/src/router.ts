import {createRouter, createWebHistory} from 'vue-router';
import type {NavigationGuardNext, RouteLocationNormalized} from 'vue-router';
import Main from '@/components/page/Main.vue';
import PageNotFound from '@/components/page/PageNotFound.vue';
import Personality from "@/components/page/Personality.vue";
import Channel from "@/components/page/Channel.vue";
import Interaction from "@/components/page/Interaction.vue";
import MymraCreation from "@/components/page/MymraCreation.vue";
import Payment from "@/components/page/Payment.vue";


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
        path: '/mymra-creation/:id?',
        name: 'mymraCreation',
        meta: {
            title: 'Мымра-creation',
            hideFooter: true,
            compactHeader: true,
            hidePageTitle: true
        },
        component: MymraCreation
    },
    {
        path: '/payment',
        name: 'payment',
        meta: {
            title: 'Поддержать проект',
            hidePageTitle: true,
        },
        component: Payment,
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

router.beforeEach((to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
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
    if(typeof title === 'string') {
        document.title = `${prefixTitle} ${title}`;
    }

    next();
})

export { router }
