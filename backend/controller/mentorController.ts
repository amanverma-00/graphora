import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/authMiddleware'
import Mentor from '../models/mentor'
import User from '../models/user'
import { sendError, sendSuccess } from '../utils/response'

/**
 * @route   POST /api/mentors
 * @desc    Register as a mentor
 * @access  Private
 */
export const createMentorProfile = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, 'Not authenticated')
      return
    }

    const { headline, bio, expertise, experience, availability, pricing } =
      req.body

    // Check if profile already exists
    const existingProfile = await Mentor.findOne({ user: req.user._id })
    if (existingProfile) {
      sendError(res, 400, 'Mentor profile already exists')
      return
    }

    const mentor = await Mentor.create({
      user: req.user._id,
      headline,
      bio,
      expertise,
      experience,
      availability,
      pricing,
    })

    sendSuccess(res, 201, 'Mentor profile created successfully', { mentor })
  } catch (error) {
    console.error('Error creating mentor profile:', error)
    sendError(res, 500, 'Server error')
  }
}

/**
 * @route   PATCH /api/mentors/me
 * @desc    Update mentor profile
 * @access  Private
 */
export const updateMentorProfile = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, 'Not authenticated')
      return
    }

    const mentor = await Mentor.findOne({ user: req.user._id })
    if (!mentor) {
      sendError(res, 404, 'Mentor profile not found')
      return
    }

    const allowedUpdates = [
      'headline',
      'bio',
      'expertise',
      'experience',
      'availability',
      'pricing',
      'isAcceptingBookings',
    ]

    const updates = Object.keys(req.body)
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update),
    )

    if (!isValidOperation) {
      sendError(res, 400, 'Invalid updates')
      return
    }

    updates.forEach((update) => {
      ;(mentor as any)[update] = req.body[update]
    })

    await mentor.save()

    sendSuccess(res, 200, 'Mentor profile updated', { mentor })
  } catch (error) {
    console.error('Error updating mentor profile:', error)
    sendError(res, 500, 'Server error')
  }
}

/**
 * @route   GET /api/mentors
 * @desc    Get all mentors with filters
 * @access  Public
 */
export const getAllMentors = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { expertise, company, maxPrice } = req.query

    const match: any = { isActive: true, verified: true } // Only active/verified by default? Or show all for now?
    // For demo purposes, let's relax verified check or ensure we can verify easily
    // match.verified = true

    if (expertise) {
      match.expertise = { $in: [expertise] }
    }

    if (maxPrice) {
      match['pricing.thirtyMin'] = { $lte: Number(maxPrice) }
    }

    // Company filtering would ideally need a text search or structured query on experience array
    // Simplifying for now to simple fetch

    const mentors = await Mentor.find(match).populate(
      'user',
      'name username avatar',
    )

    // Manual filter for company if needed, or simple return
    let filteredMentors = mentors
    if (company) {
      const companyRegex = new RegExp(company as string, 'i')
      filteredMentors = mentors.filter(
        (m) =>
          m.experience?.currentCompany?.match(companyRegex) ||
          m.experience?.pastCompanies?.some((c) => c.match(companyRegex)),
      )
    }

    sendSuccess(res, 200, 'Mentors fetched successfully', {
      count: filteredMentors.length,
      mentors: filteredMentors,
    })
  } catch (error) {
    console.error('Error fetching mentors:', error)
    sendError(res, 500, 'Server error')
  }
}

/**
 * @route   GET /api/mentors/:id
 * @desc    Get mentor by ID
 * @access  Public
 */
export const getMentor = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const mentor = await Mentor.findById(req.params.id).populate(
      'user',
      'name username avatar',
    )

    if (!mentor) {
      sendError(res, 404, 'Mentor not found')
      return
    }

    sendSuccess(res, 200, 'Mentor fetched successfully', { mentor })
  } catch (error) {
    console.error('Error fetching mentor:', error)
    sendError(res, 500, 'Server error')
  }
}

/**
 * @route   GET /api/mentors/me
 * @desc    Get current user's mentor profile
 * @access  Private
 */
export const getMyMentorProfile = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, 'Not authenticated')
      return
    }

    const mentor = await Mentor.findOne({ user: req.user._id }).populate(
      'user',
      'name username avatar',
    )

    if (!mentor) {
      sendError(res, 404, 'Mentor profile not found')
      return
    }

    sendSuccess(res, 200, 'Profile fetched', { mentor })
  } catch (error) {
    console.error('Error fetching my mentor profile:', error)
    sendError(res, 500, 'Server error')
  }
}
