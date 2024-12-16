// Import types and function related to navigation failures from vue-router.
import { NavigationFailureType, isNavigationFailure } from 'vue-router';
// Import NProgress, a progress bar library
import NProgress from 'nprogress'; // progress bar
// Import Modal from ant-design-vue
import { Modal } from 'ant-design-vue';
// Import constants from src/router/constant.ts
import { LOGIN_NAME, PAGE_NOT_FOUND_NAME, REDIRECT_NAME } from './constant';
// Import type WhiteNameList from src/router/constant.ts
import type { WhiteNameList } from './constant';
// Import types Router and RouteLocationNormalized from vue-router
import type { Router, RouteLocationNormalized } from 'vue-router';
// Import useUserStore from src/store/modules/user
// TODO: add comment to the following file
import { useUserStore } from '@/store/modules/user';
// Import useKeepAliveStore from src/store/modules/keepAlive
// TODO: add comment to the following file
import { useKeepAliveStore } from '@/store/modules/keepAlive';
// Import to (aliased as _to) from src/utils/awaitTo
// TODO: add comment to the following file
import { to as _to } from '@/utils/awaitTo';
// Import transformI18n from src/hooks/useI18n
// TODO: add comment to the following file
import { transformI18n } from '@/hooks/useI18n';

// Configure NProgress to not show a spinner
NProgress.configure({ showSpinner: false }); // NProgress Configuration

// Define a constant defaultRoutePath with the value '/dashboard/welcome'
// Set the default route path.
const defaultRoutePath = '/dashboard/welcome';

// Export a function createRouterGuards to create router guards
export function createRouterGuards(router: Router, whiteNameList: WhiteNameList) {
  // Use router.beforeEach to create a global before guard
  // for each route add the following functionality
  // https://enterprisevue.dev/blog/exploring-vue-3-router-guards/
  /***  to: The target Route object that is being navigated to.
  from: The current Route object that is being navigated away from.
  next: A function that must be called to indicate that the navigation should proceed.
 */
  router.beforeEach(async (to, from, next) => {
    // Check if the progress bar should be started for this route
    // Start the progress bar if not explicitly hidden.
    if (!from.meta?.hideProgressBar || !to.meta?.hideProgressBar) {
      // Start the progress bar
      NProgress.start(); // start progress bar
    }
    // Get the user store
    const userStore = useUserStore();

    // Check if the user is logged in
    // if userStore.token is true so than the user logged in
    if (userStore.token) {
      // If the user is logged in and trying to access the login page,

      if (to.name === LOGIN_NAME) {
        // redirect to the default route 'dashboard/welcome' and exit
        next({ path: defaultRoutePath });
      }
      // other routes than login
      else {
        const hasRoute = router.hasRoute(to.name!);
        // Check if the user has routes (i.e., if they have been fetched from the server)
        // check if the user did not fetch menus from the backend
        // if true then the user did not fetch menus from the backend
        // fetch menus, go in the if condition.
        if (userStore.menus.length === 0) {
          // 从后台获取菜单 Get the menu from the backend
          // Fetch the user's routes from the server
          const [err] = await _to(userStore.afterLogin());
          if (err) {
            // If there was an error when fetching the user's data,
            // clear the user's login status and redirect to the login page
            userStore.clearLoginStatus();
            Modal.destroyAll();
            return next({ name: LOGIN_NAME });
          }
          // If the user is trying to access the 404 page, redirect to the current full path
          // if the user also accessing invalid route, redirect to not found page
          // 解决警告：No match found for location with path "XXXXXXX"
          if (to.name === PAGE_NOT_FOUND_NAME) {
            next({ path: to.fullPath, replace: true });
          }
          // If the route does not exist, try to access it again
          // 如果该路由不存在，可能是动态注册的路由，它还没准备好，需要再重定向一次到该路由
          // If the route does not exist, it may be a dynamically registered route that is not ready yet and needs to be redirected to the route again
          else if (!hasRoute) {
            next({ ...to, replace: true });
          } else {
            // Otherwise, proceed to the next route
            next();
          }
        }
        // if the user has fetched menus from the backend
        // go to the exit and go to the next route
        else {
          next();
        }
      }
    } else {
      // If the user is not logged in
      // not login
      if (whiteNameList.some((n) => n === to.name)) {
        // 在免登录名单，直接进入
        // If the route is in the whitelist, proceed to the next route
        next();
      } else {
        // Otherwise, redirect to the login page with the current full path as a query parameter
        next({ name: LOGIN_NAME, query: { redirect: to.fullPath }, replace: true });
      }
    }
  });
  // Define a function getComponentName to get the component name of a route
  /** 获取路由对应的组件名称 */
  /** Get the component name corresponding to the route */
  const getComponentName = (route: RouteLocationNormalized): string[] => {
    // Map over the matched routes and return the component names
    return (
      route.matched
        .map((n) => {
          // If the route has a keepAlive meta property, return the component name.
          // If the route doesn't have the `keepAlive` meta property, skip it.
          // if the keepAlive is false or undefined, skip (exit)
          if (!n.meta?.keepAlive) return;
          // Get the default component from the route record
          const comp = n.components?.default;
          // Extract the component name from the `comp` object
          // If `comp.name` is undefined, try to extract it from `comp.type.name`
          return comp?.name ?? (comp as any)?.type?.name;
        })
        // Filter out any undefined or null values from the mapped array
        .filter(Boolean)
    );
  };

  // Use the router.afterEach hook to execute a callback function after every route navigation
  router.afterEach((to, from, failure) => {
    // This hook is triggered after every route navigation.
    // 跳过自己手动取消路由导航时的错误
    // It receives the to route, from route, and any navigation failure.

    // Skip errors caused by manually aborted navigation
    if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
      // Close the progress bar.
      NProgress.done();
      console.error('failed navigation', failure);
      return;
    }

    // Check if the current route has a title meta property
    if (to.meta?.title) {
      // Set the document title using the internationalized title
      // 设置网页标题 (Set the page title)
      document.title = transformI18n(to.meta.title);
    }

    // Get the keep-alive store instance
    const keepAliveStore = useKeepAliveStore();

    // Get the name of the component to be navigated to.
    // 在这里设置需要缓存的组件名称
    // Set the component name that needs to be cached here
    const toCompName = getComponentName(to);
    // If the route is configured for keep-alive:
    // 判断当前页面是否开启缓存，如果开启，则将当前页面的 componentName 信息存入 keep-alive 全局状态
    //Determine whether the current page is cached. If so, store the componentName information
    //  of the current page in the keep-alive global state.Determine whether the current page is cached. If so
    // store the componentName information of the current page in the keep-alive global state.
    if (to.meta?.keepAlive) {
      // 需要缓存的组件
      // If the component name is obtained, add it to the keep-alive store.
      // Components that need to be cached
      if (toCompName) {
        // FIXME: toCompName is alway true
        keepAliveStore.add(toCompName);
      } else {
        // Log a warning if the component name is missing.
        console.warn(
          `${to.fullPath}页面组件的keepAlive为true但未设置组件名，会导致缓存失效，请检查`,
        );
      }
    } else {
      // 不需要缓存的组件
      // If the route is not configured for keep-alive:
      // If the component name is obtained, remove it from the keep-alive store.
      if (toCompName) {
        keepAliveStore.remove(toCompName);
      }
    }
    // Check if the current route is the Redirect page
    // 如果进入的是 Redirect 页面，则也将离开页面的缓存清空(刷新页面的操作)
    // If you enter a Redirect page, the cache of the page you left will also be cleared
    if (to.name === REDIRECT_NAME) {
      // Get the component name of the previous route
      const fromCompName = getComponentName(from);
      // Remove the previous route's component name from the keep-alive store
      fromCompName && keepAliveStore.remove(fromCompName);
    }

    // Get the user store instance
    const userStore = useUserStore();
    // If the user is logged out, clear the entire keep-alive cache.
    // 如果用户已登出，则清空所有缓存的组件
    if (!userStore.token) {
      // Clear all cached components from the keep-alive store
      keepAliveStore.clear();
    }
    // Uncomment to log the current keep-alive store for debugging.
    // console.log('keepAliveStore', keepAliveStore.list);
    NProgress.done(); // finish progress bar
  });

  router.onError((error) => {
    // This function is a global error handler for the router.
    // It will be called whenever an error occurs during navigation.
    console.error('路由错误', error); // Log the error to the console for debugging purposes.
  });
}
