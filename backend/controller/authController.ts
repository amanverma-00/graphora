import { Request, Response, CookieOptions } from 'express'
import * as jwt from 'jsonwebtoken'
import * as crypto from 'crypto'
import User from '../models/user'
import Problem from '../models/problem'
import Submission from '../models/submission'
import emailService from '../services/emailService'
import { AuthenticatedRequest } from '../middleware/authMiddleware'
import { IUser, UserLevel, ProgrammingLanguage } from '../types/type'

interface RegisterBody {
  name: string
  username: string
  email: string
  password: string
  passwordConfirm?: string
  age?: number
  college?: string
  level?: UserLevel
  languages?: ProgrammingLanguage[]
  github?: string
  linkedin?: string
  portfolio?: string
}

interface LoginBody {
  emailOrUsername: string
  password: string
}

interface VerifyOTPBody {
  email: string
  otp: string
}

interface ResendOTPBody {
  email: string
}

interface ChangePasswordBody {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface UpdateProfileBody {
  name?: string
  bio?: string
  age?: number
  college?: string
  level?: UserLevel
  languages?: ProgrammingLanguage[]
  avatar?: string
  timezone?: string
  socialLinks?: {
    github?: string
    linkedin?: string
    portfolio?: string
  }
  preference?: {
    difficulty?: string
    companies?: string[]
    domains?: string[]
  }
}

interface ForgotPasswordBody {
  email: string
}

interface ResetPasswordBody {
  token: string
  password: string
  passwordConfirm: string
}

interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  token?: string
  error?: string
}

const config = {
  jwt: {
    secret:
      process.env.JWT_KEY || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },
  cookie: {
    expiresDays: 30,
  },
  env: process.env.NODE_ENV || 'development',
  passwordReset: {
    expiresIn: 60 * 60 * 1000,
  },
}

const signToken = (id: string): string => {
  const secret: jwt.Secret = config.jwt.secret
  return jwt.sign({ id }, secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  })
}

const getCookieOptions = (): CookieOptions => ({
  expires: new Date(
    Date.now() + config.cookie.expiresDays * 24 * 60 * 60 * 1000,
  ),
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: config.env === 'production' ? 'strict' : 'lax',
  path: '/',
  ...(config.env === 'development' && { domain: 'localhost' }),
})

const sanitizeUser = (user: IUser): Partial<IUser> => {
  const userObj = user.toObject()
  const sensitiveFields = [
    'password',
    'otp',
    'otpExpiry',
    'passwordResetToken',
    'passwordResetExpires',
    '__v',
  ]
  sensitiveFields.forEach((field) => delete userObj[field])
  return userObj
}

const createSendToken = (
  user: IUser,
  statusCode: number,
  res: Response,
): void => {
  const token = signToken(user._id.toString())

  res.cookie('token', token, getCookieOptions())

  const response: ApiResponse<{ user: Partial<IUser> }> = {
    success: true,
    token,
    data: { user: sanitizeUser(user) },
  }

  res.status(statusCode).json(response)
}

const sendResponse = <T>(
  res: Response,
  statusCode: number,
  data: ApiResponse<T>,
): void => {
  res.status(statusCode).json(data)
}

const sendError = (
  res: Response,
  statusCode: number,
  message: string,
): void => {
  sendResponse(res, statusCode, { success: false, message })
}

const handleError = (error: unknown, res: Response, context: string): void => {
  console.error(`[${context}] Error:`, error)

  const errorMessage =
    error instanceof Error ? error.message : 'Unknown error occurred'

  if (error instanceof Error && error.message.includes('duplicate key')) {
    sendError(res, 409, 'A user with this email or username already exists')
    return
  }

  if (error instanceof Error && error.name === 'ValidationError') {
    sendError(res, 400, errorMessage)
    return
  }

  sendResponse(res, 500, {
    success: false,
    message: `Error in ${context}`,
    error: config.env === 'development' ? errorMessage : undefined,
  })
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (
  req: Request<object, object, RegisterBody>,
  res: Response,
): Promise<void> => {
  try {
    const {
      name,
      username,
      email,
      password,
      age,
      college,
      level,
      languages,
      github,
      linkedin,
      portfolio,
    } = req.body

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    })

    if (existingUser) {
      const field =
        existingUser.email === email.toLowerCase() ? 'email' : 'username'
      sendError(res, 409, `User with this ${field} already exists`)
      return
    }

    const newUser = new User({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password,
      age,
      college: college?.trim(),
      level: level || 'beginner',
      languages: languages || [],
      isEmailVerified: false,
      socialLinks: {
        github: github?.trim() || '',
        linkedin: linkedin?.trim() || '',
        portfolio: portfolio?.trim() || '',
      },
    })

    const otp = newUser.generateOTP()
    await newUser.save()

    emailService.sendOTP(email, otp, name).catch((err) => {
      console.warn(`[register] Failed to send OTP email: ${err}`)
    })

    if (config.env === 'development') {
      console.log(`[DEV] OTP for ${email}: ${otp}`)
    }

    sendResponse(res, 201, {
      success: true,
      message:
        'Registration successful. Please verify your email with the OTP sent.',
      data: {
        email: newUser.email,
        username: newUser.username || '',
        otpExpiresIn: '10 minutes',
      },
    })
  } catch (error) {
    handleError(error, res, 'register')
  }
}

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and activate account
 * @access  Public
 */
export const verifyOTP = async (
  req: Request<object, object, VerifyOTPBody>,
  res: Response,
): Promise<void> => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+otp +otpExpiry',
    )

    if (!user) {
      sendError(res, 404, 'User not found')
      return
    }

    if (user.isEmailVerified) {
      sendError(res, 400, 'Email is already verified')
      return
    }

    if (!user.verifyOTP(otp)) {
      sendError(res, 400, 'Invalid or expired OTP')
      return
    }

    user.clearOTP()
    user.isEmailVerified = true
    await user.save()

    emailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.warn(`[verifyOTP] Failed to send welcome email: ${err}`)
    })

    createSendToken(user, 200, res)
  } catch (error) {
    handleError(error, res, 'verifyOTP')
  }
}

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to email
 * @access  Public
 */
export const resendOTP = async (
  req: Request<object, object, ResendOTPBody>,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+otp +otpExpiry',
    )

    if (!user) {
      sendError(res, 404, 'User not found')
      return
    }

    if (user.isEmailVerified) {
      sendError(res, 400, 'Email is already verified')
      return
    }

    const otp = user.generateOTP()
    await user.save({ validateBeforeSave: false })

    const emailResult = await emailService.sendOTP(email, otp, user.name)
    if (!emailResult.success) {
      sendError(res, 500, 'Failed to send OTP email. Please try again.')
      return
    }

    if (config.env === 'development') {
      console.log(`[DEV] Resent OTP for ${email}: ${otp}`)
    }

    sendResponse(res, 200, {
      success: true,
      message: 'OTP has been sent to your email',
      data: { otpExpiresIn: '10 minutes' },
    })
  } catch (error) {
    handleError(error, res, 'resendOTP')
  }
}

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
export const login = async (
  req: Request<object, object, LoginBody>,
  res: Response,
): Promise<void> => {
  try {
    const { emailOrUsername, password } = req.body

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() },
      ],
      isActive: true,
    }).select('+password')

    if (!user) {
      sendError(res, 401, 'Invalid credentials')
      return
    }

    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect) {
      sendError(res, 401, 'Invalid credentials')
      return
    }

    if (!user.isEmailVerified) {
      sendError(res, 403, 'Please verify your email before logging in')
      return
    }

    user.lastLoginAt = new Date()
    await user.save({ validateBeforeSave: false })

    createSendToken(user, 200, res)
  } catch (error) {
    handleError(error, res, 'login')
  }
}

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear cookie
 * @access  Private
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  // Clear the token cookie properly
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: config.env === 'production' ? 'strict' : 'lax',
    path: '/',
    ...(config.env === 'development' && { domain: 'localhost' }),
  })

  sendResponse(res, 200, { success: true, message: 'Logged out successfully' })
}

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, 'Not authenticated')
      return
    }

    const user = await User.findById(req.user._id)
      .populate('solvedProblems', 'title difficulty')
      .populate('bookmarkedProblems', 'title difficulty')

    if (!user) {
      sendError(res, 404, 'User not found')
      return
    }

    sendResponse(res, 200, {
      success: true,
      data: { user: sanitizeUser(user) },
    })
  } catch (error) {
    handleError(error, res, 'getProfile')
  }
}

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = async (
  req: AuthenticatedRequest & { body: UpdateProfileBody },
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, 'Not authenticated')
      return
    }

    const restrictedFields = [
      'password',
      'email',
      'username',
      'role',
      'otp',
      'otpExpiry',
      'isEmailVerified',
      'otpVerified',
      'totalMocksAttempted',
      'completedMocks',
      'stats',
      'isActive',
      'createdAt',
      'updatedAt',
      'subscription',
      'mentorProfile',
      'solvedProblems',
      'bookmarkedProblems',
      'passwordResetToken',
      'passwordResetExpires',
      'passwordChangedAt',
    ]

    const filteredBody: Record<string, unknown> = { ...req.body }
    restrictedFields.forEach((field) => delete filteredBody[field])

    const updateData: Record<string, unknown> = {}

    const allowedFields = [
      'name',
      'bio',
      'age',
      'college',
      'level',
      'languages',
      'avatar',
      'timezone',
    ]
    allowedFields.forEach((field) => {
      if (filteredBody[field] !== undefined) {
        updateData[field] = filteredBody[field]
      }
    })

    if (
      filteredBody.socialLinks &&
      typeof filteredBody.socialLinks === 'object'
    ) {
      const socialLinks = filteredBody.socialLinks as Record<string, string>
      if (socialLinks.github !== undefined)
        updateData['socialLinks.github'] = socialLinks.github
      if (socialLinks.linkedin !== undefined)
        updateData['socialLinks.linkedin'] = socialLinks.linkedin
      if (socialLinks.portfolio !== undefined)
        updateData['socialLinks.portfolio'] = socialLinks.portfolio
    }

    if (
      filteredBody.platformHandles &&
      typeof filteredBody.platformHandles === 'object'
    ) {
      const handles = filteredBody.platformHandles as Record<string, string>
      const platforms = [
        'leetcode',
        'codeforces',
        'codechef',
        'hackerrank',
        'geeksforgeeks',
        'atcoder',
      ]
      platforms.forEach((platform) => {
        if (handles[platform] !== undefined) {
          updateData[`platformHandles.${platform}`] = handles[platform]
        }
      })
    }

    if (Object.keys(updateData).length === 0) {
      sendError(res, 400, 'No valid fields to update')
      return
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    })

    if (!updatedUser) {
      sendError(res, 404, 'User not found')
      return
    }

    sendResponse(res, 200, {
      success: true,
      message: 'Profile updated successfully',
      data: { user: sanitizeUser(updatedUser) },
    })
  } catch (error) {
    handleError(error, res, 'updateProfile')
  }
}

/**
 * @route   PATCH /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
export const changePassword = async (
  req: AuthenticatedRequest & { body: ChangePasswordBody },
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, 'Not authenticated')
      return
    }

    const { currentPassword, newPassword, confirmPassword } = req.body

    if (newPassword !== confirmPassword) {
      sendError(res, 400, 'New password and confirmation do not match')
      return
    }

    if (currentPassword === newPassword) {
      sendError(
        res,
        400,
        'New password must be different from current password',
      )
      return
    }

    const user = await User.findById(req.user._id).select('+password')

    if (!user) {
      sendError(res, 404, 'User not found')
      return
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword)
    if (!isPasswordCorrect) {
      sendError(res, 401, 'Current password is incorrect')
      return
    }

    user.password = newPassword
    await user.save()

    emailService
      .sendPasswordChangedEmail(user.email, user.name)
      .catch((err) => {
        console.warn(`[changePassword] Failed to send notification: ${err}`)
      })

    createSendToken(user, 200, res)
  } catch (error) {
    handleError(error, res, 'changePassword')
  }
}

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
export const forgotPassword = async (
  req: Request<object, object, ForgotPasswordBody>,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body

    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    })

    if (!user) {
      sendResponse(res, 200, {
        success: true,
        message:
          'If an account exists with that email, a password reset link will be sent.',
      })
      return
    }

    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    if (config.env === 'development') {
      console.log(`[DEV] Reset token for ${email}: ${resetToken}`)
    }

    emailService
      .sendPasswordResetEmail(user.email, user.name, resetToken)
      .catch((err) => {
        console.warn(`[forgotPassword] Failed to send reset email: ${err}`)
      })

    sendResponse(res, 200, {
      success: true,
      message:
        'If an account exists with that email, a password reset link will be sent.',
    })
  } catch (error) {
    handleError(error, res, 'forgotPassword')
  }
}

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
export const resetPassword = async (
  req: Request<object, object, ResetPasswordBody>,
  res: Response,
): Promise<void> => {
  try {
    const { token, password, passwordConfirm } = req.body

    if (password !== passwordConfirm) {
      sendError(res, 400, 'Passwords do not match')
      return
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
      isActive: true,
    }).select('+password +passwordResetToken +passwordResetExpires')

    if (!user) {
      sendError(res, 400, 'Token is invalid or has expired')
      return
    }

    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    sendResponse(res, 200, {
      success: true,
      message:
        'Password has been reset successfully. Please login with your new password.',
    })

    setImmediate(() => {
      emailService
        .sendPasswordChangedEmail(user.email, user.name)
        .catch((err) => {
          console.warn(
            `[resetPassword] Failed to send notification: ${err.message}`,
          )
        })
    })
  } catch (error) {
    handleError(error, res, 'resetPassword')
  }
}

/**
 * @route   GET /api/auth/stats
 * @desc    Get user statistics (problems solved, submissions, etc.)
 * @access  Private
 */
export const getUserStats = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, 'Not authenticated')
      return
    }

    const user = await User.findById(req.user._id).populate('solvedProblems')

    if (!user) {
      sendError(res, 404, 'User not found')
      return
    }

    // Get total counts for each difficulty
    const easyTotal = await Problem.countDocuments({ difficulty: 'easy' })
    const mediumTotal = await Problem.countDocuments({ difficulty: 'medium' })
    const hardTotal = await Problem.countDocuments({ difficulty: 'hard' })

    // Count solved problems by difficulty
    const solvedProblemIds = user.solvedProblems.map((p: any) => p._id)
    const easySolved = await Problem.countDocuments({
      _id: { $in: solvedProblemIds },
      difficulty: 'easy',
    })
    const mediumSolved = await Problem.countDocuments({
      _id: { $in: solvedProblemIds },
      difficulty: 'medium',
    })
    const hardSolved = await Problem.countDocuments({
      _id: { $in: solvedProblemIds },
      difficulty: 'hard',
    })

    // Get submission statistics
    const totalSubmissions = await Submission.countDocuments({ user: user._id })
    const acceptedSubmissions = await Submission.countDocuments({
      user: user._id,
      status: 'Accepted',
    })

    const acceptanceRate =
      totalSubmissions > 0 ? (acceptedSubmissions / totalSubmissions) * 100 : 0

    // Fetch external coding profile
    const { default: CodingProfile } = await import('../models/codingProfile')
    const codingProfile = await CodingProfile.findOne({ user: user._id })

    const stats = {
      totalSolved: user.solvedProblems.length,
      easySolved,
      mediumSolved,
      hardSolved,
      easyTotal,
      mediumTotal,
      hardTotal,
      totalSubmissions,
      acceptedSubmissions,
      acceptanceRate,
      // External stats (from CodingProfile)
      external: codingProfile ? codingProfile.platforms : null,
      aggregated: codingProfile ? codingProfile.aggregatedStats : null,
      externalMeta: codingProfile
        ? {
            lastFullSync: codingProfile.lastFullSync,
            updatedAt: (codingProfile as any).updatedAt,
          }
        : null,
    }

    sendResponse(res, 200, {
      success: true,
      data: stats,
    })
  } catch (error) {
    handleError(error, res, 'getUserStats')
  }
}

/**
 * @route   GET /api/auth/skills
 * @desc    Get skill analysis based on solved problems
 * @access  Private
 */
export const getSkillAnalysis = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, 'Not authenticated')
      return
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      sendError(res, 404, 'User not found')
      return
    }

    // Get all solved problems with their topics and patterns
    const solvedProblems = await Problem.find({
      _id: { $in: user.solvedProblems },
    }).select('topics pattern')

    // Count skill occurrences
    const skillCounts: Record<string, number> = {}
    const skillTotals: Record<string, number> = {}

    // Aggregate all topics and patterns from solved problems
    solvedProblems.forEach((problem: any) => {
      const allSkills = [...(problem.topics || []), ...(problem.pattern || [])]
      allSkills.forEach((skill: string) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1
      })
    })

    // Get total problems per skill in the database
    const allProblems = await Problem.find({}).select('topics pattern')
    allProblems.forEach((problem: any) => {
      const allSkills = [...(problem.topics || []), ...(problem.pattern || [])]
      allSkills.forEach((skill: string) => {
        skillTotals[skill] = (skillTotals[skill] || 0) + 1
      })
    })

    // Calculate percentages
    const skills = Object.keys(skillCounts).map((skill) => {
      const count = skillCounts[skill]
      const total = skillTotals[skill] || 1
      const percentage = Math.round((count / total) * 100)

      return {
        name: skill,
        value: percentage,
        solved: count,
        total,
      }
    })

    // Sort by value (percentage) and take top skills
    skills.sort((a, b) => b.value - a.value)

    sendResponse(res, 200, {
      success: true,
      data: { skills },
    })
  } catch (error) {
    handleError(error, res, 'getSkillAnalysis')
  }
}

/**
 * @route   GET /api/auth/achievements
 * @desc    Get user achievements and progress
 * @access  Private
 */
export const getAchievements = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, 'Not authenticated')
      return
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      sendError(res, 404, 'User not found')
      return
    }

    // Count solved problems by difficulty
    const solvedProblemIds = user.solvedProblems.map((p: any) => p)
    const easySolved = await Problem.countDocuments({
      _id: { $in: solvedProblemIds },
      difficulty: 'easy',
    })
    const mediumSolved = await Problem.countDocuments({
      _id: { $in: solvedProblemIds },
      difficulty: 'medium',
    })
    const hardSolved = await Problem.countDocuments({
      _id: { $in: solvedProblemIds },
      difficulty: 'hard',
    })

    // Calculate streak from submission history
    const submissions = await Submission.find({ user: user._id })
      .sort({ createdAt: -1 })
      .select('createdAt')

    let currentStreak = 0
    let maxStreak = 0
    if (submissions.length > 0) {
      const submissionDates = new Set<string>()
      submissions.forEach((sub: any) => {
        const date = new Date(sub.createdAt).toISOString().split('T')[0]
        submissionDates.add(date)
      })

      const dates = Array.from(submissionDates).sort().reverse()
      const today = new Date().toISOString().split('T')[0]

      // Calculate current streak
      let streakCount = 0
      let currentDate = new Date(today)
      for (const dateStr of dates) {
        const checkDate = currentDate.toISOString().split('T')[0]
        if (dateStr === checkDate) {
          streakCount++
          currentDate.setDate(currentDate.getDate() - 1)
        } else if (dateStr < checkDate) {
          const daysDiff = Math.floor(
            (new Date(checkDate).getTime() - new Date(dateStr).getTime()) /
              (1000 * 60 * 60 * 24),
          )
          if (daysDiff === 1) {
            streakCount++
            currentDate = new Date(dateStr)
            currentDate.setDate(currentDate.getDate() - 1)
          } else {
            break
          }
        }
      }
      currentStreak = streakCount
      maxStreak = streakCount // Simplified - could track historical max
    }

    const achievements = [
      {
        id: 'first-solve',
        name: 'First Solve',
        icon: '🎯',
        description: 'Solved your first problem',
        unlocked: user.solvedProblems.length > 0,
      },
      {
        id: 'streak-7',
        name: '7-Day Streak',
        icon: '🔥',
        description: '7 days in a row',
        unlocked: currentStreak >= 7,
        progress: Math.min(currentStreak, 7),
        target: 7,
      },
      {
        id: 'easy-50',
        name: 'Easy Master',
        icon: '🟢',
        description: 'Solved 50 easy problems',
        unlocked: easySolved >= 50,
        progress: easySolved,
        target: 50,
      },
      {
        id: 'medium-25',
        name: 'Medium Warrior',
        icon: '🟡',
        description: 'Solved 25 medium problems',
        unlocked: mediumSolved >= 25,
        progress: mediumSolved,
        target: 25,
      },
      {
        id: 'hard-10',
        name: 'Hard Crusher',
        icon: '🔴',
        description: 'Solved 10 hard problems',
        unlocked: hardSolved >= 10,
        progress: hardSolved,
        target: 10,
      },
      {
        id: 'streak-30',
        name: '30-Day Streak',
        icon: '💪',
        description: '30 days in a row',
        unlocked: currentStreak >= 30,
        progress: Math.min(currentStreak, 30),
        target: 30,
      },
    ]

    sendResponse(res, 200, {
      success: true,
      data: { achievements, currentStreak, maxStreak },
    })
  } catch (error) {
    handleError(error, res, 'getAchievements')
  }
}

/**
 * @route   POST /api/auth/profile/sync
 * @desc    Sync external coding platform stats
 * @access  Private
 */
export const syncProfile = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, 'Not authenticated')
      return
    }

    const { codingPlatformService } =
      await import('../services/codingPlatformService')
    const profile = await codingPlatformService.syncUserStats(
      req.user._id.toString(),
    )

    sendResponse(res, 200, {
      success: true,
      message: 'Profile synced successfully',
      data: profile,
    })
  } catch (error) {
    handleError(error, res, 'syncProfile')
  }
}

export default {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getUserStats,
  getSkillAnalysis,
  getAchievements,
  syncProfile,
}
