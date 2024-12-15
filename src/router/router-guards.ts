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

  /** 获取路由对应的组件名称 */
  const getComponentName = (route: RouteLocationNormalized): string[] => {
    return route.matched
      .map((n) => {
        if (!n.meta?.keepAlive) return;
        const comp = n.components?.default;
        return comp?.name ?? (comp as any)?.type?.name;
      })
      .filter(Boolean);
  };

  router.afterEach((to, from, failure) => {
    // 跳过自己手动取消路由导航时的错误
    if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
      NProgress.done();
      // console.error('failed navigation', failure);
      return;
    }

    if (to.meta?.title) {
      // 设置网页标题
      document.title = transformI18n(to.meta.title);
    }

    const keepAliveStore = useKeepAliveStore();

    // 在这里设置需要缓存的组件名称
    const toCompName = getComponentName(to);
    // 判断当前页面是否开启缓存，如果开启，则将当前页面的 componentName 信息存入 keep-alive 全局状态
    if (to.meta?.keepAlive) {
      // 需要缓存的组件
      if (toCompName) {
        keepAliveStore.add(toCompName);
      } else {
        console.warn(
          `${to.fullPath}页面组件的keepAlive为true但未设置组件名，会导致缓存失效，请检查`,
        );
      }
    } else {
      // 不需要缓存的组件
      if (toCompName) {
        keepAliveStore.remove(toCompName);
      }
    }
    // 如果进入的是 Redirect 页面，则也将离开页面的缓存清空(刷新页面的操作)
    if (to.name === REDIRECT_NAME) {
      const fromCompName = getComponentName(from);
      fromCompName && keepAliveStore.remove(fromCompName);
    }
    const userStore = useUserStore();
    // 如果用户已登出，则清空所有缓存的组件
    if (!userStore.token) {
      keepAliveStore.clear();
    }
    // console.log('keepAliveStore', keepAliveStore.list);
    NProgress.done(); // finish progress bar
  });

  router.onError((error) => {
    console.error('路由错误', error);
  });
}
