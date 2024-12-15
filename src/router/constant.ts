// Export a constant named LOGIN_NAME with the value 'Login'
export const LOGIN_NAME = 'Login';

// Export a constant named REDIRECT_NAME with the value 'Redirect'
export const REDIRECT_NAME = 'Redirect';

// Export a constant named PARENT_LAYOUT_NAME with the value 'ParentLayout'
export const PARENT_LAYOUT_NAME = 'ParentLayout';

// Export a constant named PAGE_NOT_FOUND_NAME with the value 'PageNotFound'
export const PAGE_NOT_FOUND_NAME = 'PageNotFound';

// 路由白名单 (// Routing whitelist)
// Define and Export an array of route names that don't require authentication or redirection
// These routes can be accessed directly without going through the login or redirect process
// or removing the routes from the has history
export const whiteNameList = [LOGIN_NAME, 'icons', 'error', 'error-404'] as const; // no redirect whitelist

// Create and export a type alias for the whitelist array to improve code readability and type safety
export type WhiteNameList = typeof whiteNameList;

// Create a type alias for a single element from the whitelist array
export type WhiteName = (typeof whiteNameList)[number];
