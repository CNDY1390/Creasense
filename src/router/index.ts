import type {
  RouteRecordRaw,
  Router,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from "vue-router";
import TabsLayout from "@/views/TabsLayout.vue";
import { localDataManager } from "@/services/LocalDataManager";

// 滚动位置管理
interface ScrollPosition {
  [key: string]: number;
}

// 获取滚动位置
const getScrollPosition = (): ScrollPosition => {
  try {
    const stored = sessionStorage.getItem("scrollPositions");
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("[Router] 获取滚动位置失败:", error);
    return {};
  }
};

// 保存滚动位置
const saveScrollPosition = (path: string, position: number) => {
  try {
    const positions = getScrollPosition();
    positions[path] = position;
    sessionStorage.setItem("scrollPositions", JSON.stringify(positions));
  } catch (error) {
    console.error("[Router] 保存滚动位置失败:", error);
  }
};

// 获取保存的滚动位置
const getSavedScrollPosition = (path: string): number | null => {
  const positions = getScrollPosition();
  // 区分"从未访问"和"访问过但位置是顶部"
  return positions.hasOwnProperty(path) ? positions[path] : null;
};

// 滚动行为配置
const scrollBehavior = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  savedPosition: { top: number; left: number } | null
) => {
  const timestamp = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  console.log(`[${timestamp}] [Router] 滚动行为: ${from.path} -> ${to.path}`);

  // 如果是浏览器前进/后退，使用默认行为
  if (savedPosition) {
    console.log(`[${timestamp}] [Router] 使用浏览器保存的位置:`, savedPosition);
    return savedPosition;
  }

  // 获取当前页面的滚动位置
  const tabContent = document.querySelector(".tab-content") as HTMLElement;

  // 保存离开页面的滚动位置
  if (from.path && from.path !== to.path && tabContent) {
    const currentScrollTop = tabContent.scrollTop;
    saveScrollPosition(from.path, currentScrollTop);
    console.log(`[${timestamp}] [Router] 保存页面 ${from.path} 的滚动位置:`, currentScrollTop);
  }

  // 获取目标页面的保存位置
  const savedScrollTop = getSavedScrollPosition(to.path);

  if (savedScrollTop !== null) {
    console.log(`[${timestamp}] [Router] 恢复页面 ${to.path} 的滚动位置:`, savedScrollTop);
    // 使用 Promise 确保 DOM 已渲染
    return new Promise<{ top: number }>((resolve) => {
      // 使用 requestAnimationFrame 确保在下一帧执行
      requestAnimationFrame(() => {
        const targetTabContent = document.querySelector(".tab-content") as HTMLElement;
        if (targetTabContent) {
          targetTabContent.scrollTop = savedScrollTop;
          console.log(`[${timestamp}] [Router] 已设置滚动位置:`, savedScrollTop);
        } else {
          console.log(`[${timestamp}] [Router] 延迟后仍未找到滚动容器`);
        }
        resolve({ top: savedScrollTop });
      });
    });
  } else {
    console.log(`[${timestamp}] [Router] 新页面 ${to.path}，滚动到顶部`);
    // 新页面也需要确保 DOM 已渲染
    return new Promise<{ top: number }>((resolve) => {
      requestAnimationFrame(() => {
        const targetTabContent = document.querySelector(".tab-content") as HTMLElement;
        if (targetTabContent) {
          targetTabContent.scrollTop = 0;
          console.log(`[${timestamp}] [Router] 已设置新页面滚动到顶部`);
        } else {
          console.log(`[${timestamp}] [Router] 延迟后仍未找到滚动容器，无法滚动到顶部`);
        }
        resolve({ top: 0 });
      });
    });
  }
};

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/tabs/dashboard",
  },
  {
    path: "/setup",
    component: () => import("../views/SetupView.vue"),
  },
  {
    path: "/tabs/",
    component: TabsLayout,
    children: [
      {
        path: "",
        redirect: "/tabs/dashboard",
      },
      {
        path: "dashboard",
        component: () => import("../views/DashboardView.vue"),
      },
      {
        path: "devices",
        component: () => import("../views/DevicesView.vue"),
      },
      {
        path: "profile",
        component: () => import("../views/ProfileView.vue"),
      },
      {
        path: "developer",
        component: () => import("../views/DeveloperView.vue"),
      },

    ],
  },
];

export default routes;

// 路由守卫
export async function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    // console.log(`[Router] 路由跳转: ${from.path} -> ${to.path}`)

    // 如果访问的是setup页面，直接通过
    if (to.path === "/setup") {
      console.log("[Router] 访问setup页面，直接通过");
      next();
      return;
    }

    try {
      const result = await localDataManager.loadData();
      const hasData = result.success && result.data !== undefined;
      if (!hasData) {
        console.log("[Router] 没有数据，重定向到setup页面");
        next("/setup");
        return;
      }
      // 如果有数据且访问根路径，重定向到tabs/dashboard
      if (to.path === "/") {
        console.log("[Router] 访问根路径，重定向到tabs/dashboard");
        next("/tabs/dashboard");
        return;
      }

      // console.log('[Router] 路由检查通过')
      next();
    } catch (error) {
      console.error("[Router] 路由守卫检查失败:", error);
      // 出错时重定向到setup页面
      next("/setup");
    }
  });
}

// 导出滚动行为配置
export { scrollBehavior };
