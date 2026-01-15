
// 메모리 백업 (Storage가 작동하지 않는 극단적 상황 대비)
const memoryCache: Record<string, any> = {};

export const safeStorage = {
  set: (key: string, value: any) => {
    try {
      const stringValue = JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      memoryCache[key] = value; // 메모리에 동시 저장
      return true;
    } catch (e) {
      console.error(`Storage Save Error [${key}]:`, e);
      memoryCache[key] = value;
      return false;
    }
  },
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) {
        return memoryCache[key] !== undefined ? memoryCache[key] : defaultValue;
      }
      const parsed = JSON.parse(saved);
      memoryCache[key] = parsed; // 메모리 동기화
      return parsed as T;
    } catch (e) {
      console.error(`Storage Load Error [${key}]:`, e);
      return memoryCache[key] !== undefined ? memoryCache[key] : defaultValue;
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
      delete memoryCache[key];
    } catch (e) {
      console.error(`Storage Remove Error [${key}]:`, e);
    }
  },
  clearAll: () => {
    try {
      localStorage.clear();
      Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
      window.location.reload();
    } catch (e) {
      console.error("Storage Clear Error:", e);
    }
  },
  // 데이터 백업용 문자열 생성
  exportData: () => {
    const data = {
      tasks: safeStorage.get('cg_flow_tasks_stable', []),
      members: safeStorage.get('cg_flow_members_stable', [])
    };
    return btoa(encodeURIComponent(JSON.stringify(data)));
  },
  // 백업 데이터로 복구
  importData: (base64Str: string) => {
    try {
      const json = decodeURIComponent(atob(base64Str));
      const data = JSON.parse(json);
      if (data.tasks && data.members) {
        safeStorage.set('cg_flow_tasks_stable', data.tasks);
        safeStorage.set('cg_flow_members_stable', data.members);
        return true;
      }
    } catch (e) {
      console.error("Import Error:", e);
    }
    return false;
  }
};
