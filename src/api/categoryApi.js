import api from "./axios";

export const getCategories = () => {
  return api.get("/categories");
}

export const updateCategories = (categories) => {
  return api.put('/categories', categories);
}

export const createCategory = (name) => {
  return api.post('/categories', { name: name });
}