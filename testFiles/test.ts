import { NavigationFailureType, isNavigationFailure } from 'vue-router';
 // Import types and function related to navigation failures from vue-router.
import NProgress from 'nprogress'; // Import NProgress for loading bar functionality.
import { Modal } from 'ant-design-vue'; 
// Import Modal component from Ant Design Vue for displaying modals.
import { LOGIN_NAME, PAGE_NOT_FOUND_NAME, REDIRECT_NAME } from './constant'; 
// Import constant route names.
import type { WhiteNameList } from './constant'; // Import type for whitelist of routes.
import type { Router, RouteLocationNormalized } from 'vue-router'; // Import types related to router and route.
import { useUserStore } from '@/store/modules/user'; // Import user store for user-related operations.
import { useKeepAliveStore } from '@/store/modules/keepAlive'; // Import keepAlive store for managing cached components.
import { to as _to } from '@/utils/awaitTo';
 // Import utility function for async/await error handling.
import { transformI18n } from '@/hooks/useI18n'; // Import function for internationalization.