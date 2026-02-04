import express from 'express'
import {
    createMentorProfile,
    updateMentorProfile,
    getAllMentors,
    getMentor,
    getMyMentorProfile,
} from '../controller/mentorController'
import { protect } from '../middleware'

const router = express.Router()

router.get('/', getAllMentors)
router.get('/me', protect, getMyMentorProfile)
router.get('/:id', getMentor)

router.post('/', protect, createMentorProfile)
router.patch('/me', protect, updateMentorProfile)

export default router
