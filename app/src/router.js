import {createRouter, createWebHistory} from 'vue-router';
import Main from '@/components/page/Main.vue';
import PageNotFound from '@/components/page/PageNotFound.vue';


const routes = [
    // {
    //   path: '/',
    //   component: () => import('./components/pages/Main.vue')
    // },

    { path: '/', component: Main },

    { path: '/:pathMatch(.*)', component: PageNotFound },

]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// router.beforeEach((to, from) => {
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
// })

export { router }
