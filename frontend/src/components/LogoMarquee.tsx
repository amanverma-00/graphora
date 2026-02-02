import React from 'react';

const LogoMarquee: React.FC = () => {
  const companies = [
    "Amazon", "Google", "Microsoft", "Netflix", "Meta", "Apple", "Uber", "Airbnb", "Stripe", "Lyft"
  ];

  return (
    <section className="w-full border-y border-neutral-100 bg-white py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-6 text-center">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
          Prepare for interviews at top tier companies
        </p>
      </div>
      
      <div className="relative w-full overflow-hidden">
        {/* Gradient Masks for smooth fade out */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>

        <div className="flex w-[200%] animate-marquee">
          {/* First Set */}
          <div className="flex w-1/2 justify-around items-center">
            {companies.map((company, index) => (
              <span 
                key={`${company}-1-${index}`} 
                className="text-xl md:text-2xl font-bold text-neutral-300 hover:text-neutral-800 transition-colors cursor-default select-none mx-8"
              >
                {company}
              </span>
            ))}
          </div>
          {/* Duplicate Set for Loop */}
          <div className="flex w-1/2 justify-around items-center">
            {companies.map((company, index) => (
              <span 
                key={`${company}-2-${index}`} 
                className="text-xl md:text-2xl font-bold text-neutral-300 hover:text-neutral-800 transition-colors cursor-default select-none mx-8"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LogoMarquee;