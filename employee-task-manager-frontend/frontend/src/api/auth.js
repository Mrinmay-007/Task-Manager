import client from './client.js'

// The backend's /auth/login expects OAuth2PasswordRequestForm, i.e.
// application/x-www-form-urlencoded with `username` and `password` fields
// (username is the email here).
export async function login(email, password) {
  const body = new URLSearchParams()
  // body.set('username', email)
  body.set('username', email.trim().toLowerCase())
  body.set('password', password)
  const { data } = await client.post('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data // { access_token, token_type }
}

export async function register({ name, email, password }) {
  const { data } = await client.post('/auth/register', { name, email, password })
  return data // UserRead
}

export async function fetchMe() {
  const { data } = await client.get('/user/me')
  return data // UserRead
}

export async function updateMe(payload) {
  const { data } = await client.patch('/user/me', payload)
  return data
}
