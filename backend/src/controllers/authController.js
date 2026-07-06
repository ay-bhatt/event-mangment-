import * as authService from '../services/authService.js'

function meta(req) {
  return { ipAddress: req.ip, userAgent: req.get('user-agent') }
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username or email and password required' })
    }
    const result = await authService.loginUser(username, password, meta(req))
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function logout(req, res, next) {
  try {
    const { loginHistoryId } = req.body
    await authService.logoutUser(req.dbUser.id, loginHistoryId, meta(req))
    res.json({ success: true, message: 'Logged out' })
  } catch (err) {
    next(err)
  }
}

export async function me(req, res) {
  res.json({
    success: true,
    user: {
      id: req.dbUser.id,
      username: req.dbUser.username,
      email: req.dbUser.email,
      role: req.dbUser.role,
      fullName: req.dbUser.full_name,
    },
  })
}

export async function validateSession(req, res, next) {
  try {
    const user = await authService.validateSession(req.dbUser.id)
    if (!user) {
      return res.status(401).json({ success: false, error: 'Session invalid' })
    }
    res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        lastLoginAt: user.last_login_at,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email required' })
    }
    const result = await authService.requestPasswordReset(email)
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token and new password required' })
    }
    const result = await authService.resetPassword(token, newPassword)
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}
