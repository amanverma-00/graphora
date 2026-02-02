import React from 'react';
import Button from './ui/Button';
import { ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
      <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600 mb-8">
        <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></span>
        Now available for early access
      </div>
      
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-neutral-900 mb-6 max-w-4xl">
        Practice algorithms. <br className="hidden md:block" />
        Simulate reality. Track progress.
      </h1>
      
      <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mb-10 leading-relaxed">
        The complete platform for technical interview preparation. Solve standard DSA problems, 
        take company-specific mock tests, and maintain a unified coding portfolio.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Button variant="primary" size="lg" className="group">
          Start Practicing
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
        <Button variant="outline" size="lg">
          Explore Roadmaps
        </Button>
      </div>
    </section>
  );
};

export default Hero;