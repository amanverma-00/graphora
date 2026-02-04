import express from 'express'
import {
    createBooking,
    getUserBookings,
    updateBookingStatus,
} from '../controller/bookingController'
import { protect } from '../middleware/authMiddleware'

const router = express.Router()

router.use(protect)

router.post('/', createBooking)
router.get('/', getUserBookings)
router.patch('/:id/status', updateBookingStatus)

export default router
