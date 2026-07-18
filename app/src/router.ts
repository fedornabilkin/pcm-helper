import {createRouter, createWebHistory} from 'vue-router';
import type {NavigationGuardNext, RouteLocationNormalized} from 'vue-router';
const Main = () => import('@/components/page/Main.vue')
const PageNotFound = () => import('@/components/page/PageNotFound.vue')
const Personality = () => import('@/components/page/Personality.vue')
const Channel = () => import('@/components/page/Channel.vue')
const Interaction = () => import('@/components/page/Interaction.vue')
const MymraCreation = () => import('@/components/page/MymraCreation.vue')
const Payment = () => import('@/components/page/Payment.vue')
const Conversation = () => import('@/components/page/Conversation.vue')
const Stress = () => import('@/components/page/Stress.vue')
const Needs = () => import('@/components/page/Needs.vue')
const Practice = () => import('@/components/page/Practice.vue')
const Dictionary = () => import('@/components/page/Dictionary.vue')

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
        path: '/practice',
        name: 'practice',
        meta: {
            title: 'Практикум PCM',
            hidePageTitle: true,
        },
        component: Practice,
    },
    {
        path: '/dictionary',
        name: 'dictionary',
        meta: {
            title: 'Словарь и конструктор фраз',
            hidePageTitle: true,
        },
        component: Dictionary,
    },
    {
        path: '/needs',
        name: 'needs',
        meta: {
            title: 'Потребности и ресурс',
            hidePageTitle: true,
        },
        component: Needs,
    },
    {
        path: '/stress',
        name: 'stress',
        meta: {
            title: 'Стресс-радар',
            hidePageTitle: true,
        },
        component: Stress,
    },
    {
        path: '/conversation',
        name: 'conversation',
        meta: {
            title: 'Навигатор разговора',
            hidePageTitle: true,
        },
        component: Conversation,
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
