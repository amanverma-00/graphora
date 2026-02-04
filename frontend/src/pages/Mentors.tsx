import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { mentorService } from '../services/api'
import { Search, Briefcase, Star, Clock, Users } from 'lucide-react'
import Button from '../components/ui/Button'

export default function Mentors() {
  const [expertise, setExpertise] = useState<string>('')
  const [company, setCompany] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')

  const { data: mentorsData, isLoading } = useQuery({
    queryKey: ['mentors', expertise, company, maxPrice],
    queryFn: () =>
      mentorService.getAll({
        expertise: expertise || undefined,
        company: company || undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      }),
  })

  const mentors = mentorsData?.data?.data?.mentors || []

  const expertiseOptions = [
    'DSA',
    'System Design',
    'Frontend',
    'Backend',
    'ML/AI',
    'DevOps',
    'Mobile',
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Find a Mentor</h1>
        <p className="text-[#8b949e]">
          Book 1:1 sessions with industry experts
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#161b22] p-4 rounded-lg border border-[#30363d] mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b949e]" />
          <input
            type="text"
            placeholder="Search by company..."
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md pl-9 pr-4 py-2 text-white focus:outline-none focus:border-[#58a6ff]"
          />
        </div>
        <div>
          <select
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-4 py-2 text-white focus:outline-none focus:border-[#58a6ff]"
          >
            <option value="">All Expertise</option>
            {expertiseOptions.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-4 py-2 text-white focus:outline-none focus:border-[#58a6ff]"
          >
            <option value="">Any Price</option>
            <option value="500">Under ₹500</option>
            <option value="1000">Under ₹1000</option>
            <option value="2000">Under ₹2000</option>
            <option value="5000">Under ₹5000</option>
          </select>
        </div>
      </div>

      {/* Mentor Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-[#8b949e]">
          Loading mentors...
        </div>
      ) : mentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor: any) => (
            <div
              key={mentor._id}
              className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden flex flex-col hover:border-[#58a6ff] transition-colors"
            >
              <div className="p-6 flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-16 w-16 rounded-full bg-[#238636] flex items-center justify-center text-xl font-bold text-white shrink-0 overflow-hidden">
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
                  <div>
                    <h3 className="text-lg font-bold text-white hover:text-[#58a6ff]">
                      <Link to={`/mentors/${mentor._id}`}>
                        {mentor.user?.name}
                      </Link>
                    </h3>
                    <p className="text-[#8b949e] text-sm line-clamp-1">
                      {mentor.headline}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-yellow-400 text-sm">
                      <Star className="h-4 w-4 fill-current" />
                      <span>{mentor.rating?.average || 'New'}</span>
                      <span className="text-[#8b949e]">
                        ({mentor.rating?.count || 0})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-[#8b949e]">
                    <Briefcase className="h-4 w-4 mr-2 text-[#58a6ff]" />
                    <span>
                      {mentor.experience?.currentRole} at{' '}
                      {mentor.experience?.currentCompany}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-[#8b949e]">
                    <Clock className="h-4 w-4 mr-2 text-[#f78166]" />
                    <span>{mentor.experience?.years} years experience</span>
                  </div>
                  {/* Expertise Tags */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {mentor.expertise?.slice(0, 3).map((exp: string) => (
                      <span
                        key={exp}
                        className="px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-xs text-[#8b949e]"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#0d1117] border-t border-[#30363d] flex items-center justify-between">
                <div>
                  <p className="text-[#8b949e] text-xs">Starting from</p>
                  <p className="text-white font-bold">
                    ₹{mentor.pricing?.thirtyMin}{' '}
                    <span className="text-[#8b949e] font-normal text-xs">
                      / 30m
                    </span>
                  </p>
                </div>
                <Link to={`/mentors/${mentor._id}`}>
                  <Button size="sm" className="bg-[#238636] hover:bg-[#2ea043]">
                    View Profile
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-[#30363d] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No mentors found
          </h3>
          <p className="text-[#8b949e]">
            Try adjusting filters to find more experts
          </p>
        </div>
      )}
    </div>
  )
}
