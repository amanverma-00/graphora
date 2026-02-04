import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { bookingService } from '../services/api'
import { Calendar, Clock, User, Video } from 'lucide-react'
import Button from '../components/ui/Button'
import { cn } from '../lib/utils'

export default function Bookings() {
  const [role, setRole] = useState<'student' | 'mentor'>('student')

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', role],
    queryFn: () => bookingService.getUserBookings(role),
  })

  const bookings = bookingsData?.data?.data?.bookings || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-500 bg-green-500/10 border-green-500/20'
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'cancelled':
        return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'completed':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
          <p className="text-[#8b949e]">
            Manage your upcoming and past sessions
          </p>
        </div>
        <div className="flex bg-[#161b22] p-1 rounded-lg border border-[#30363d]">
          <button
            onClick={() => setRole('student')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              role === 'student'
                ? 'bg-[#238636] text-white'
                : 'text-[#8b949e] hover:text-white',
            )}
          >
            Learner
          </button>
          <button
            onClick={() => setRole('mentor')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              role === 'mentor'
                ? 'bg-[#238636] text-white'
                : 'text-[#8b949e] hover:text-white',
            )}
          >
            Mentor
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[#8b949e]">
          Loading bookings...
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking: any) => (
            <div
              key={booking._id}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 flex flex-col md:flex-row gap-6 items-start md:items-center"
            >
              {/* Date/Time Box */}
              <div className="flex flex-col items-center justify-center min-w-[100px] p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                <span className="text-[#8b949e] text-sm uppercase font-bold">
                  {new Date(booking.scheduledAt).toLocaleString('default', {
                    month: 'short',
                  })}
                </span>
                <span className="text-3xl font-bold text-white my-1">
                  {new Date(booking.scheduledAt).getDate()}
                </span>
                <span className="text-[#8b949e] text-xs">
                  {new Date(booking.scheduledAt).toLocaleTimeString('default', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs border uppercase font-bold',
                      getStatusColor(booking.status),
                    )}
                  >
                    {booking.status}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {booking.topic || 'Mentorship Session'}
                  </h3>
                </div>

                <div className="flex items-center gap-6 text-sm text-[#8b949e]">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span>
                      {role === 'student'
                        ? `Mentor: ${booking.mentor?.user?.name || 'Unknown'}`
                        : `Student: ${booking.student?.name || 'Unknown'}`}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{booking.duration} min</span>
                  </div>
                  <div className="flex items-center">
                    <Video className="h-4 w-4 mr-2" />
                    <span>Video Call</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                {booking.status === 'confirmed' && (
                  <Button className="bg-[#1f6feb] hover:bg-[#388bfd] w-full md:w-auto">
                    Join Meeting
                  </Button>
                )}
                {booking.status === 'confirmed' && (
                  <Button
                    variant="outline"
                    className="w-full md:w-auto border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#161b22] border border-[#30363d] rounded-lg">
          <Calendar className="h-12 w-12 text-[#30363d] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No bookings yet
          </h3>
          <p className="text-[#8b949e]">
            {role === 'student'
              ? 'Book your first session with a mentor!'
              : 'You have no upcoming sessions scheduled.'}
          </p>
        </div>
      )}
    </div>
  )
}
