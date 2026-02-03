import React from 'react'
import { Terminal, Briefcase, User, Map, Video } from 'lucide-react'

interface FeatureCardProps {
  icon: React.ElementType
  title: string
  description: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
}) => (
  <div className="group p-6 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors duration-200">
    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center mb-4 group-hover:bg-accent transition-colors">
      <Icon className="h-5 w-5 text-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">
      {description}
    </p>
  </div>
)

const Features: React.FC = () => {
  const features = [
    {
      icon: Terminal,
      title: 'Problem Solving Arena',
      description:
        'Solve over 2,000 algorithmic problems with an integrated code editor supporting 10+ languages.',
    },
    {
      icon: Briefcase,
      title: 'Company Mock Tests',
      description:
        'Take targeted assessments mimicking actual interview loops from companies like Amazon and Google.',
    },
    {
      icon: User,
      title: 'Unified Coding Profile',
      description:
        'Aggregate your stats from LeetCode, CodeForces, and GitHub into a single professional portfolio.',
    },
    {
      icon: Map,
      title: 'Structured Roadmaps',
      description:
        'Follow step-by-step learning paths for Data Structures, Web Development, and System Design.',
    },
    {
      icon: Video,
      title: '1-to-1 Mentorship',
      description:
        'Book video sessions with Senior Engineers from top tech firms for code reviews and career advice.',
    },
  ]

  return (
    <section
      id="features"
      className="py-24 bg-background border-t border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Everything you need to crack the interview.
          </h2>
          <p className="text-muted-foreground text-lg">
            Stop switching between ten different tabs. Graphhora unifies
            practice, learning, and mentorship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard
              key={idx}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}

          {/* Call to Action Card for the grid */}
          <div className="flex flex-col justify-center items-center p-6 rounded-lg border border-dashed border-border bg-transparent text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ready to start?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Join thousands of developers leveling up today.
            </p>
            <button className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary">
              Create free account &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
