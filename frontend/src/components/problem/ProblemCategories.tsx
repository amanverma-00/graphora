import { useNavigate } from 'react-router-dom'
import { Code2, Grid2X2, BookOpen } from 'lucide-react'

interface CategoryCardProps {
  icon: React.ReactNode
  title: string
  description: string
  problemCount: number
  onClick: () => void
}

function CategoryCard({
  icon,
  title,
  description,
  problemCount,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg"
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative z-10">
        {/* Icon */}
        <div className="mb-4 w-fit rounded-lg bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-white transition-all">
          {icon}
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

        {/* Problem count */}
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            {problemCount} problems
          </span>
          <span className="text-muted-foreground group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>
      </div>
    </button>
  )
}

/**
 * Problem Categories Grid Component
 */
export default function ProblemCategories() {
  const navigate = useNavigate()

  const categories = [
    {
      icon: <Code2 className="h-6 w-6" />,
      title: 'Array',
      description: 'Master array manipulation and algorithms',
      slug: 'array',
      problemCount: 0, // Will be populated from API
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'String',
      description: 'Solve string processing and pattern matching',
      slug: 'string',
      problemCount: 0,
    },
    {
      icon: <Grid2X2 className="h-6 w-6" />,
      title: 'Math',
      description: 'Tackle mathematical and logical problems',
      slug: 'math',
      problemCount: 0,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">
          Problem Categories
        </h2>
        <p className="mt-2 text-muted-foreground">
          Start learning by choosing a category
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard
            key={category.slug}
            icon={category.icon}
            title={category.title}
            description={category.description}
            problemCount={category.problemCount}
            onClick={() => navigate(`/problems/${category.slug}`)}
          />
        ))}
      </div>
    </div>
  )
}
