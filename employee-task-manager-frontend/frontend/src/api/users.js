import client from './client.js'

export async function listUsers() {
  const { data } = await client.get('/user/')
  return data
}

export async function getUser(userId) {
  const { data } = await client.get(`/user/${userId}`)
  return data
}

export async function updateUser(userId, payload) {
  const { data } = await client.patch(`/user/${userId}`, payload)
  return data
}

// ADDED: promote/demote a user's role. Manager-only on the backend.
export async function updateUserRole(userId, role) {
  const { data } = await client.patch(`/user/${userId}/role`, { role })
  return data
}

export async function deleteUser(userId) {
  await client.delete(`/user/${userId}`)
}
