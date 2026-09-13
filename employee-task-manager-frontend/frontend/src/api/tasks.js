import client from './client.js'

export async function listTasks(status) {
  const params = status ? { status } : {}
  const { data } = await client.get('/tasks/', { params })
  return data
}

export async function getTask(taskId) {
  const { data } = await client.get(`/tasks/${taskId}`)
  return data
}

export async function createTask(payload) {
  const { data } = await client.post('/tasks/', payload)
  return data
}

export async function updateTask(taskId, payload) {
  const { data } = await client.patch(`/tasks/${taskId}`, payload)
  return data
}

export async function deleteTask(taskId) {
  await client.delete(`/tasks/${taskId}`)
}

export async function requestTaskCompletion(taskId) {
  const { data } = await client.post(`/tasks/${taskId}/request-completion`)
  return data
}