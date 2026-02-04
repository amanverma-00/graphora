import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roadmapService } from '../services/api'
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  PlayCircle,
  BookOpen,
  Clock,
  Award,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { cn } from '../lib/utils'
import { toast } from 'react-hot-toast'

export default function RoadmapDetail() {
  const { slug } = useParams<{ slug: string }>()
  const queryClient = useQueryClient()

  const { data: roadmapData, isLoading } = useQuery({
    queryKey: ['roadmap', slug],
    queryFn: () => roadmapService.getRoadmap(slug!),
    enabled: !!slug,
  })

  const enrollMutation = useMutation({
    mutationFn: roadmapService.enroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', slug] })
      toast.success('Successfully enrolled in roadmap!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to enroll')
    },
  })

  const progressMutation = useMutation({
    mutationFn: ({ id, moduleId }: { id: string; moduleId: string }) =>
      roadmapService.updateProgress(id, moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', slug] })
    },
  })

  if (isLoading)
    return (
      <div className="text-center py-12 text-[#8b949e]">Loading roadmap...</div>
    )

  if (!roadmapData?.data?.data?.roadmap)
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-white">Roadmap not found</h2>
        <Link
          to="/roadmaps"
          className="text-[#58a6ff] hover:underline block mt-4"
        >
          Back to roadmaps
        </Link>
      </div>
    )

  const { roadmap, userProgress } = roadmapData.data.data
  const isEnrolled = !!userProgress

  const handleEnroll = () => {
    enrollMutation.mutate(roadmap._id)
  }

  const toggleModule = (moduleId: string) => {
    if (!isEnrolled) return
    progressMutation.mutate({ id: roadmap._id, moduleId })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link
        to="/roadmaps"
        className="text-[#8b949e] hover:text-[#58a6ff] flex items-center mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Roadmaps
      </Link>

      {/* Header */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden mb-8">
        <div className="h-48 bg-gradient-to-r from-[#1f6feb] to-[#238636] p-8 flex flex-col justify-end relative">
          <div className="absolute top-6 right-6 flex gap-2">
            <span className="bg-black/30 backdrop-blur px-3 py-1 rounded-full text-white text-sm border border-white/20 capitalize">
              {roadmap.level}
            </span>
            <span className="bg-black/30 backdrop-blur px-3 py-1 rounded-full text-white text-sm border border-white/20">
              {roadmap.domain}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {roadmap.title}
          </h1>
          <p className="text-white/80 max-w-2xl">{roadmap.description}</p>
        </div>

        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-8 text-[#8b949e]">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <span>{roadmap.estimatedDuration} Weeks</span>
            </div>
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              <span>{roadmap.modules.length} Modules</span>
            </div>
            <div className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              <span>Certificate on completion</span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {isEnrolled ? (
              <div className="flex flex-col items-end mr-4">
                <span className="text-[#8b949e] text-sm mb-1">
                  {userProgress.progress}% Completed
                </span>
                <div className="w-32 h-2 bg-[#30363d] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#238636] transition-all duration-500"
                    style={{ width: `${userProgress.progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <Button
                onClick={handleEnroll}
                isLoading={enrollMutation.isPending}
                className="w-full md:w-auto bg-[#238636] hover:bg-[#2ea043]"
              >
                Start Learning Path
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content Modules */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4">Course Content</h2>
        {roadmap.modules.map((module: any, index: number) => {
          const isCompleted = userProgress?.completedModules?.includes(
            module._id,
          )

          return (
            <div
              key={module._id}
              className={cn(
                'bg-[#0d1117] border rounded-lg p-6 transition-colors',
                isCompleted ? 'border-[#238636]' : 'border-[#30363d]',
              )}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleModule(module._id)}
                  disabled={!isEnrolled || progressMutation.isPending}
                  className={cn(
                    'mt-1 rounded-full p-1 transition-colors',
                    !isEnrolled && 'opacity-50 cursor-not-allowed',
                    isCompleted
                      ? 'text-[#238636]'
                      : 'text-[#8b949e] hover:text-white',
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </button>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                    <span className="text-[#8b949e] mr-3 font-normal text-sm">
                      Module {index + 1}
                    </span>
                    {module.title}
                  </h3>
                  <p className="text-[#8b949e] mb-4">{module.description}</p>

                  {/* Topics */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {module.topics.map((topic: string) => (
                      <span
                        key={topic}
                        className="px-2 py-1 bg-[#161b22] border border-[#30363d] rounded text-xs text-[#8b949e]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>

                  {/* Resources */}
                  {module.resources && module.resources.length > 0 && (
                    <div className="bg-[#161b22] rounded-md p-4">
                      <h4 className="text-sm font-semibold text-white mb-3">
                        Resources
                      </h4>
                      <div className="space-y-2">
                        {module.resources.map((resource: any) => (
                          <a
                            key={resource._id || resource.title}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-[#58a6ff] hover:underline text-sm"
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            {resource.title}
                            <span className="text-[#8b949e] ml-2 text-xs no-underline">
                              ({resource.duration}m)
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
