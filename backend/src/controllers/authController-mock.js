import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { generateAccessToken, generateRefreshToken } from '../utils/token.js'

// Mock in-memory storage for testing
export const mockUsers = []
export const mockOrganizations = []
export const mockRefreshTokens = []

export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, organizationName } = req.body

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email)
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const organizationSlug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-')

    // Check if organization already exists
    const existingOrg = mockOrganizations.find(o => o.slug === organizationSlug)
    if (existingOrg) {
      return res.status(400).json({ message: 'Organization already exists' })
    }

    // Create organization
    const organization = {
      id: mockOrganizations.length + 1,
      name: organizationName,
      slug: organizationSlug,
      country: null,
      address: null,
      logo: null,
      timezone: null,
      currency: null,
      plan: 'free',
      status: 'active',
      createdAt: new Date()
    }
    mockOrganizations.push(organization)

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000

    // Create user
    const user = {
      id: mockUsers.length + 1,
      organizationId: organization.id,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'admin',
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified: false,
      isActive: true,
      createdAt: new Date()
    }
    mockUsers.push(user)

    console.log('Verification token for testing:', emailVerificationToken)

    res.status(201).json({
      message: 'Registration successful. Check console for verification token.'
    })
  } catch (error) {
    next(error)
  }
}

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body

    const user = mockUsers.find(
      u => u.emailVerificationToken === token && u.emailVerificationExpires > Date.now()
    )

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' })
    }

    user.isEmailVerified = true
    user.emailVerificationToken = null
    user.emailVerificationExpires = null

    res.status(200).json({ message: 'Email verified successfully' })
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = mockUsers.find(u => u.email === email)
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email first' })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is disabled' })
    }

    const organization = mockOrganizations.find(o => o.id === user.organizationId)
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' })
    }

    const accessToken = generateAccessToken(user.id, user.organizationId)
    const refreshToken = await generateRefreshToken(user.id)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          country: organization.country,
          address: organization.address,
          logo: organization.logo,
          timezone: organization.timezone,
          currency: organization.currency,
          plan: organization.plan
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

export const logout = async (req, res) => {
  res.clearCookie('refreshToken')
  res.json({ message: 'Logged out successfully' })
}

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' })
    }

    // For mock, we'll just generate a new access token
    // In real app, you'd verify the refresh token
    const accessToken = generateAccessToken(1, 1)

    res.json({ accessToken })
  } catch (error) {
    next(error)
  }
}

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    console.log('Forgot password for:', email)
    res.json({ message: 'Password reset email sent' })
  } catch (error) {
    next(error)
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body
    console.log('Reset password with token:', token)
    res.json({ message: 'Password reset successful' })
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const userId = req.user?.userId
    const user = mockUsers.find(u => u.id === userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const organization = mockOrganizations.find(o => o.id === user.organizationId)
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' })
    }

    res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          country: organization.country,
          address: organization.address,
          logo: organization.logo,
          timezone: organization.timezone,
          currency: organization.currency,
          plan: organization.plan
        }
      }
    })
  } catch (error) {
    next(error)
  }
}
