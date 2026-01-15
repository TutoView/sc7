
// 모든 저장소 키를 V4로 통일하여 데이터 엇갈림 방지
export const STORAGE_KEYS = {
  TASKS: 'cg_flow_v4_tasks',
  MEMBERS: 'cg_flow_v4_members',
  ADMIN_PW: 'cg_flow_v4_pw',
  ADMIN_SESSION: 'cg_flow_v4_session'
};

const memoryCache: Record<string, any> = {};

export const safeStorage = {
  set: (key: string, value: any) => {
    try {
      const stringValue = JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      memoryCache[key] = value;
      return true;
    } catch (e) {
      console.error(`Save Error:`, e);
      memoryCache[key] = value;
      return false;
    }
  },
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) {
        return memoryCache[key] !== undefined ? memoryCache[key] : defaultValue;
      }
      const parsed = JSON.parse(saved);
      memoryCache[key] = parsed;
      return parsed as T;
    } catch (e) {
      console.error(`Load Error:`, e);
      return memoryCache[key] !== undefined ? memoryCache[key] : defaultValue;
    }
  },
  clearAll: () => {
    localStorage.clear();
    window.location.reload();
  },
  exportData: () => {
    const data = {
      tasks: safeStorage.get(STORAGE_KEYS.TASKS, []),
      members: safeStorage.get(STORAGE_KEYS.MEMBERS, [])
    };
    return btoa(encodeURIComponent(JSON.stringify(data)));
  },
  importData: (base64Str: string) => {
    try {
      const json = decodeURIComponent(atob(base64Str));
      const data = JSON.parse(json);
      if (data.tasks && data.members) {
        safeStorage.set(STORAGE_KEYS.TASKS, data.tasks);
        safeStorage.set(STORAGE_KEYS.MEMBERS, data.members);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }
};
