import { mockOrganizations, mockUsers } from './authController-mock.js'

export const updateOrganization = async (req, res, next) => {
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

    const { businessEmail, website, country, address, logo, timezone, currency } = req.body

    // Update the organization
    Object.assign(organization, {
      businessEmail,
      website,
      country,
      address,
      logo,
      timezone,
      currency
    })

    res.json({
      organization })
  } catch (error) {
    next(error)
  }
}

export const getOrganization = async (req, res, next) => {
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

    res.json({ organization })
  } catch (error) {
    next(error)
  }
}
