import React from 'react';

const ApexWorkflow = () => {
  const steps = [
    {
      stepNumber: 1,
      title: 'Define Parameters',
      description:
        'Input your location, specific timeframes, and sensitivity levels for different weather events.',
    },
    {
      stepNumber: 2,
      title: 'Data Synthesis',
      description:
        'Our engines aggregate data from 40,000+ stations and proprietary satellite imagery in real-time.',
    },
    {
      stepNumber: 3,
      title: 'Actionable Reports',
      description:
        'Receive automated PDF summaries or live dashboard alerts customized to your needs.',
    },
  ];

  return (
    <div className="w-full bg-[#f8fbff] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans text-center">
        
        {/* Section Heading */}
        <h2 className="text-4xl md:text-5xl font-extrabold text-[#002244] tracking-tight mb-16">
          The Apex Workflow
        </h2>

        {/* Steps Container */}
        <div className="relative">
          {/* Horizontal Connecting Line (Hidden on mobile, visible on desktop) */}
          <div className="hidden md:block absolute top-6 left-[15%] right-[15%] h-[1px] bg-gray-300 z-0" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative z-10">
            {steps.map((step) => (
              <div key={step.stepNumber} className="flex flex-col items-center">
                
                {/* Number Badge with Circle & Soft Shadow */}
                <div className="w-12 h-12 rounded-full bg-[#005a8d] text-white font-bold text-lg flex items-center justify-center shadow-lg mb-6 ring-8 ring-[#f8fbff]">
                  {step.stepNumber}
                </div>

                {/* Step Title */}
                <h3 className="text-xl font-extrabold text-[#002244] mb-3">
                  {step.title}
                </h3>

                {/* Step Description */}
                <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ApexWorkflow;