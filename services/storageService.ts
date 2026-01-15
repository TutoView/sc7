
export const safeStorage = {
  set: (key: string, value: any) => {
    try {
      const stringValue = JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      return true;
    } catch (e) {
      console.error(`Storage Save Error [${key}]:`, e);
      // 용량 초과 등의 이유로 저장 실패 시 경고 (필요 시)
      return false;
    }
  },
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return defaultValue;
      return JSON.parse(saved) as T;
    } catch (e) {
      console.error(`Storage Load Error [${key}]:`, e);
      return defaultValue;
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Storage Remove Error [${key}]:`, e);
    }
  },
  clearAll: () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error("Storage Clear Error:", e);
    }
  }
};
