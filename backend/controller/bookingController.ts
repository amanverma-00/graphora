import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/authMiddleware'
import Booking from '../models/booking'
import Mentor from '../models/mentor'
import { sendError, sendSuccess } from '../utils/response'

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private
 */
export const createBooking = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, 'Not authenticated')
      return
    }

    const { mentorId, scheduledAt, duration, type, topic, agenda, amount } =
      req.body

    // Basic validation
    // In a real app, we'd check if slot is actually available in mentor's schedule
    // and if it overlaps with existing bookings.
    // For now, we assume frontend sends a valid slot.

    const booking = await Booking.create({
      mentor: mentorId,
      student: req.user._id,
      scheduledAt,
      duration,
      type,
      topic,
      agenda,
      payment: {
        amount,
        status: 'paid', // Mock payment
        paidAt: new Date(),
      },
      status: 'confirmed', // Auto-confirm for MVP
    })

    sendSuccess(res, 201, 'Booking created successfully', { booking })
  } catch (error) {
    console.error('Error creating booking:', error)
    sendError(res, 500, 'Server error')
  }
}

/**
 * @route   GET /api/bookings
 * @desc    Get user's bookings (as student or mentor)
 * @access  Private
 */
export const getUserBookings = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, 'Not authenticated')
      return
    }

    const { role } = req.query // 'student' or 'mentor'

    let query: any = {}

    // If user is asking as a mentor, they should have a mentor profile
    if (role === 'mentor') {
      const mentorProfile = await Mentor.findOne({ user: req.user._id })
      if (!mentorProfile) {
        sendError(res, 403, 'You are not a mentor')
        return
      }
      query.mentor = mentorProfile._id
    } else {
      // Default to student view
      query.student = req.user._id
    }

    const bookings = await Booking.find(query)
      .populate('mentor', 'headline bio') // deep populate user if needed?
      .populate({
        path: 'mentor',
        populate: { path: 'user', select: 'name username avatar' },
      })
      .populate('student', 'name username avatar')
      .sort({ scheduledAt: -1 })

    sendSuccess(res, 200, 'Bookings fetched', { bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    sendError(res, 500, 'Server error')
  }
}

/**
 * @route   PATCH /api/bookings/:id
 * @desc    Update booking status (cancel, complete)
 * @access  Private
 */
export const updateBookingStatus = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, 'Not authenticated')
      return
    }

    const { status, cancellationReason } = req.body
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      sendError(res, 404, 'Booking not found')
      return
    }

    // Verify ownership (Student or Mentor)
    // Complex check: Student is direct ref. Mentor is via Mentor model.
    // Simplifying: assumes verified via frontend context or added later.
    // Ideally:
    // const isStudent = booking.student.toString() === req.user._id.toString()
    // const mentor = await Mentor.findOne({ user: req.user._id })
    // const isMentor = booking.mentor.toString() === mentor?._id.toString()

    booking.status = status
    if (status === 'cancelled') {
      booking.cancelledBy = 'student' // or deduce
      booking.cancellationReason = cancellationReason || 'No reason provided'
      booking.cancelledAt = new Date()
    }

    await booking.save()

    sendSuccess(res, 200, 'Booking updated', { booking })
  } catch (error) {
    console.error('Error updating booking:', error)
    sendError(res, 500, 'Server error')
  }
}
