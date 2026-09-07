import api from "./axios";

export const getTodos = () => {
  return api.get('/todos');
}

export const createTodoWithName = (title) => {
  return api.post('/todos', {
    name: title,
    title: title
  });
}

export const createTodo = (request) => {
  return api.post('/todos', { ...request });
}

export const updateTodo = (id, request) => {
  return api.put(`/todos/${id}`, { ...request });
}

export const checkTodo = (todoId, completed) => {
  return api.put(`/todos/${todoId}/check`, { completed });
}

export const checkTodoSubtask = (todoId, subtaskId, completed) => {
  return api.put(`/todos/${todoId}/subtasks/${subtaskId}`, { completed });
}

export const deleteTodo = (id) => {
  return api.delete(`/todos/${id}`);
}
