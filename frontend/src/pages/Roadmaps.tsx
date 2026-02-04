import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { roadmapService } from '../services/api'
import { Search, BookOpen, Clock, Users, ArrowRight } from 'lucide-react'
import Button from '../components/ui/Button'

export default function Roadmaps() {
    const [domain, setDomain] = useState<string>('')
    const [level, setLevel] = useState<string>('all')
    const [search, setSearch] = useState('')

    const { data: roadmapsData, isLoading } = useQuery({
        queryKey: ['roadmaps', domain, level, search],
        queryFn: () => roadmapService.getAllRoadmaps({ domain, level, search }),
    })

    const roadmaps = roadmapsData?.data?.data || []

    const domains = ['MERN Stack', 'Frontend', 'Backend', 'Full Stack', 'DevOps', 'Data Science', 'Machine Learning', 'Mobile Development', 'System Design']
    const levels = ['all', 'beginner', 'intermediate', 'advanced']

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Learning Paths</h1>
                    <p className="text-[#8b949e]">Curated roadmaps to master new skills</p>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
                <div className="relative col-span-1 md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b949e]" />
                    <input
                        type="text"
                        placeholder="Search roadmaps..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-md pl-9 pr-4 py-2 text-white focus:outline-none focus:border-[#58a6ff]"
                    />
                </div>
                <div>
                    <select
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-4 py-2 text-white focus:outline-none focus:border-[#58a6ff]"
                    >
                        <option value="">All Domains</option>
                        {domains.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-4 py-2 text-white focus:outline-none focus:border-[#58a6ff]"
                    >
                        {levels.map(l => (
                            <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Roadmap Grid */}
            {isLoading ? (
                <div className="text-center py-12 text-[#8b949e]">Loading roadmaps...</div>
            ) : roadmaps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roadmaps.map((roadmap: any) => (
                        <Link
                            key={roadmap._id}
                            to={`/roadmaps/${roadmap.slug}`}
                            className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden hover:border-[#58a6ff] transition-colors group flex flex-col h-full"
                        >
                            <div className="h-40 bg-gradient-to-br from-[#1f6feb] to-[#238636] relative p-6">
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white capitalize">
                                    {roadmap.level}
                                </div>
                                <h3 className="text-xl font-bold text-white mt-auto absolute bottom-4 left-4 right-4 line-clamp-2">
                                    {roadmap.title}
                                </h3>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <p className="text-[#8b949e] text-sm mb-6 line-clamp-3 flex-1">
                                    {roadmap.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="flex items-center text-[#8b949e] text-xs">
                                        <BookOpen className="h-4 w-4 mr-2 text-[#58a6ff]" />
                                        <span>{roadmap.domain}</span>
                                    </div>
                                    <div className="flex items-center text-[#8b949e] text-xs">
                                        <Clock className="h-4 w-4 mr-2 text-[#f78166]" />
                                        <span>{roadmap.estimatedDuration} weeks</span>
                                    </div>
                                    <div className="flex items-center text-[#8b949e] text-xs col-span-2">
                                        <Users className="h-4 w-4 mr-2 text-[#238636]" />
                                        <span>{roadmap.stats?.totalEnrollments || 0} enrolled</span>
                                    </div>
                                </div>

                                <Button className="w-full group-hover:bg-[#1f6feb] group-hover:text-white transition-colors">
                                    View Roadmap <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-[#30363d] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No roadmaps found</h3>
                    <p className="text-[#8b949e]">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    )
}
