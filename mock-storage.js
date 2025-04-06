// mock-storage.js
// A simple in-memory storage for local testing

let storage = {};

export const mockEdgeConfig = {
  get: async (key) => {
    return storage[key] || null;
  },
  set: async (key, value) => {
    storage[key] = value;
    return true;
  }
};
