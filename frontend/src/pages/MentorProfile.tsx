import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { mentorService, bookingService } from '../services/api'
import { ArrowLeft, Star, Clock, MapPin, Briefcase } from 'lucide-react'
import Button from '../components/ui/Button'
import { cn } from '../lib/utils'
import { toast } from 'react-hot-toast'

export default function MentorProfile() {
  const { id } = useParams<{ id: string }>()
  const [selectedSlot, setSelectedSlot] = useState<{
    day: number
    slot: { start: string; end: string }
    date: Date
  } | null>(null)
  const [bookingNote, setBookingNote] = useState('')

  const { data: mentorData, isLoading } = useQuery({
    queryKey: ['mentor', id],
    queryFn: () => mentorService.getById(id!),
    enabled: !!id,
  })

  const bookingMutation = useMutation({
    mutationFn: bookingService.create,
    onSuccess: () => {
      toast.success('Booking requested successfully!')
      setSelectedSlot(null)
      setBookingNote('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to book session')
    },
  })

  if (isLoading)
    return (
      <div className="text-center py-12 text-[#8b949e]">Loading profile...</div>
    )

  const mentor = mentorData?.data?.data?.mentor

  if (!mentor)
    return <div className="text-center py-12 text-white">Mentor not found</div>

  // Helper to generate next 7 days dates for availability
  const getNextDays = () => {
    const days = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      days.push(d)
    }
    return days
  }

  const nextDays = getNextDays()
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handleBook = () => {
    if (!selectedSlot) return

    bookingMutation.mutate({
      mentorId: mentor._id,
      scheduledAt: selectedSlot.date.toISOString(),
      duration: 30, // Default 30 min for now
      type: 'video',
      topic: 'Mentorship Session',
      agenda: bookingNote,
      amount: mentor.pricing.thirtyMin,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link
        to="/mentors"
        className="text-[#8b949e] hover:text-[#58a6ff] flex items-center mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Mentors
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="h-24 w-24 rounded-full bg-[#238636] flex items-center justify-center text-3xl font-bold text-white shrink-0 overflow-hidden">
                {mentor.user?.avatar ? (
                  <img
                    src={mentor.user.avatar}
                    alt={mentor.user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  mentor.user?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {mentor.user?.name}
                    </h1>
                    <p className="text-xl text-[#8b949e] mb-4">
                      {mentor.headline}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-bold">
                      {mentor.rating?.average || 'New'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-[#8b949e] text-sm mb-6">
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span>
                      {mentor.experience?.currentRole} at{' '}
                      {mentor.experience?.currentCompany}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{mentor.experience?.years} Years Exp.</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{mentor.timezone}</span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <h3 className="text-lg font-bold text-white mb-2">About</h3>
                  <p className="text-[#8b949e] whitespace-pre-wrap">
                    {mentor.bio}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8">
            <h3 className="text-xl font-bold text-white mb-4">Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {mentor.expertise?.map((exp: string) => (
                <span
                  key={exp}
                  className="px-3 py-1 bg-[#0d1117] border border-[#30363d] rounded-full text-sm text-[#8b949e]"
                >
                  {exp}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 sticky top-24">
            <h3 className="text-xl font-bold text-white mb-6">
              Book a Session
            </h3>

            <div className="mb-6">
              <label className="text-sm text-[#8b949e] mb-2 block">
                Select Date
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {nextDays.map((date, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSlot(null)} // Reset slot when day changes
                    className={cn(
                      'flex flex-col items-center justify-center min-w-[60px] p-2 rounded border transition-colors',
                      // Simple active state check could be improved
                      'border-[#30363d] bg-[#0d1117] hover:border-[#58a6ff] text-[#8b949e]',
                    )}
                  >
                    <span className="text-xs">{daysOfWeek[date.getDay()]}</span>
                    <span className="font-bold text-white">
                      {date.getDate()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm text-[#8b949e] mb-2 block">
                Available Slots (Mock)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* Mocking slots for now as backend transformation is complex */}
                {['10:00 AM', '02:00 PM', '04:00 PM', '07:00 PM'].map(
                  (time) => (
                    <button
                      key={time}
                      onClick={() => {
                        const today = new Date() // Should use selected date
                        setSelectedSlot({
                          day: today.getDay(),
                          slot: { start: time, end: time }, // simplified
                          date: new Date(today.setHours(10, 0, 0, 0)), // Fixed for mock
                        })
                      }}
                      className={cn(
                        'py-2 px-3 rounded text-sm text-center transition-colors border',
                        selectedSlot?.slot.start === time
                          ? 'bg-[#238636] border-[#238636] text-white'
                          : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#58a6ff]',
                      )}
                    >
                      {time}
                    </button>
                  ),
                )}
              </div>
            </div>

            {selectedSlot && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm text-[#8b949e] mb-2 block">
                  Agenda / Notes
                </label>
                <textarea
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-md p-3 text-white text-sm focus:outline-none focus:border-[#58a6ff]"
                  rows={3}
                  placeholder="What do you want to discuss?"
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                />
              </div>
            )}

            <div className="pt-4 border-t border-[#30363d]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[#8b949e]">Total</span>
                <span className="text-2xl font-bold text-white">
                  ₹{mentor.pricing?.thirtyMin}
                </span>
              </div>
              <Button
                onClick={handleBook}
                disabled={!selectedSlot || bookingMutation.isPending}
                isLoading={bookingMutation.isPending}
                className="w-full bg-[#238636] hover:bg-[#2ea043]"
              >
                {selectedSlot ? 'Confirm Booking' : 'Select a Slot'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
