// Added NProgress CSS for progress bar styling
// Nprogress is for show loading bar when loading new page
import 'nprogress/css/nprogress.css'; // 进度条样式

// Imported createRouter and createWebHashHistory from vue-router

import {
  // createRouter is a function provided by vue-router to create a router instance.
  //  This router instance is then integrated into your Vue application to handle
  //  navigation and URL management.
  // createRouter is a function provided by vue-router to create a router instance.
  //  This router instance is then integrated into your Vue application to handle
  //  navigation and URL management.
  createRouter,
  // the createWebHashHistory function is used to create a history mode that employs,
  //  the hash part of the URL to represent the route state. This means that the route ,
  // information is stored in the hash part of the URL, following the # symbol.
  //createWebHashHistory is like giving your website a simple way to remember ,
  // where you've been and where you want to go, using a little hashtag trick.
  createWebHashHistory,
} from 'vue-router';

// Imported createRouterGuards from local router-guards file
// This function is used to create router guards
// for any route that is incorrect.
import { createRouterGuards } from './router-guards';

// Imported whiteNameList from local constant file
import { whiteNameList } from './constant';

// Imported basicRoutes from local routes file
import { basicRoutes } from './routes';
// Imported App type from vue
import type { App } from 'vue';

//  Created router instance with createRouter
export const router = createRouter({
  //  Set history mode to hash
  // process.env.BASE_URL
  history: createWebHashHistory(''),
  // Set routes to basicRoutes
  routes: basicRoutes,
});

// reset router
//  Exported resetRouter function
/**
This function resets the router by removing all routes except those in the `whiteNameList`. 

Here's a step-by-step breakdown:

1. It gets all routes from the router using `router.getRoutes()`.
2. For each route, it checks if the route has a name and if that name is not in the `whiteNameList`.
3. If the route meets these conditions, it checks if the router still has this route using `router.hasRoute(name)`.
4. If the route exists, it removes the route from the router using `router.removeRoute(name)`. */
export function resetRouter() {
  // Iterate through routes and remove non-whitelisted routes
  router.getRoutes().forEach((route) => {
    const { name } = route;
    if (name && !whiteNameList.some((n) => n === name)) {
      //  Remove route if it exists
      router.hasRoute(name) && router.removeRoute(name);
    }
  });
}

// Set up router guards and mount the router to the Vue app
export async function setupRouter(app: App) {
  // 创建路由守卫
  // Set up router guards
  createRouterGuards(router, whiteNameList);
  // Use the router in the Vue app
  app.use(router);

  // 路由准备就绪后挂载APP实例
  // Wait for the router to be ready before proceeding
  await router.isReady();
}
// Export the router instance as default for use in other parts of the application
export default router;
