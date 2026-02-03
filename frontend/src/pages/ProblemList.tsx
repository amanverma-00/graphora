import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { problemService } from '../services/api'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import { Search, TrendingUp, Filter } from 'lucide-react'
import { clsx } from 'clsx'
import Button from '../components/ui/Button'

interface Problem {
  _id: string
  title: string
  slug: string
  difficulty: 'easy' | 'medium' | 'hard'
  company: string[]
  topics: string[]
  acceptanceRate?: number
  totalSubmissions?: number
  isPremium?: boolean
}

export default function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (difficultyFilter !== 'all') params.difficulty = difficultyFilter
      if (topicFilter !== 'all') params.topics = topicFilter

      const { data } = await problemService.getProblems(params)
      setProblems(data.problems || data)
    } catch (error) {
      console.error('Failed to fetch problems:', error)
    } finally {
      setLoading(false)
    }
  }, [difficultyFilter, topicFilter])

  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  const filteredProblems = problems.filter((problem) =>
    problem.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600'
      case 'medium':
        return 'text-yellow-600'
      case 'hard':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="w-full">
      {/* Filters Section - HackerRank style white container with drop shadow */}
      <div className="bg-white border rounded shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search challenges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:ring-green-500 focus:border-green-500 w-full"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-gray-500 mr-2">
            <Filter className="h-4 w-4" />
            <span>Filters:</span>
          </div>
          <Select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Difficulty' },
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
            className="w-40 border-gray-300 text-sm"
          />

          <Select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Subdomains' },
              { value: 'array', label: 'Arrays' },
              { value: 'string', label: 'Strings' },
              { value: 'dp', label: 'Dynamic Programming' },
            ]}
            className="w-40 border-gray-300 text-sm"
          />
        </div>
      </div>

      {/* Problem List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-500">Loading challenges...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProblems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded shadow-sm border">
              <p className="text-gray-500">
                No challenges matched your search.
              </p>
            </div>
          ) : (
            filteredProblems.map((problem) => (
              <div
                key={problem._id}
                className="bg-white p-6 rounded shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-center gap-4 group"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                    {problem.title}
                  </h3>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span
                      className={clsx(
                        'font-medium capitalize',
                        getDifficultyColor(problem.difficulty),
                      )}
                    >
                      {problem.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Success Rate: {problem.acceptanceRate?.toFixed(0) || 0}%
                    </span>
                    {problem.isPremium && (
                      <span className="text-yellow-600 text-xs border border-yellow-200 bg-yellow-50 px-2 py-0.5 rounded">
                        Premium
                      </span>
                    )}
                  </div>

                  {/* Topics tiny tags */}
                  {problem.topics && problem.topics.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {problem.topics.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Link to={`/problem/${problem.slug}`}>
                  <Button
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50 px-6 min-w-[160px]"
                  >
                    Solve Challenge
                  </Button>
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
