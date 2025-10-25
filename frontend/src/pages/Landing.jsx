import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: '🌱',
      title: 'Track Your Impact',
      description: 'Monitor your carbon footprint and water usage with detailed analytics and insights.',
      color: 'from-green-400 to-green-600'
    },
    {
      icon: '♻️',
      title: 'Recycle & Exchange',
      description: 'List items for recycling and discover eco-friendly exchanges in your community.',
      color: 'from-blue-400 to-blue-600'
    },
    {
      icon: '🤝',
      title: 'Give Back',
      description: 'Donate items to NGOs and help those in need while reducing waste.',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: '📚',
      title: 'Learn & Grow',
      description: 'Access awareness content, eco-tips, and connect with like-minded individuals.',
      color: 'from-orange-400 to-orange-500'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Active Users' },
    { number: '50K+', label: 'Items Recycled' },
    { number: '25K+', label: 'Donations Made' },
    { number: '100K+', label: 'CO₂ Saved (kg)' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-blue-400/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-8">
              🌍 Making Sustainability Personal
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Journey to a
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                {' '}Sustainable Lifestyle
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Track your environmental impact, connect with eco-conscious communities,
              and make meaningful changes that benefit our planet. Every action counts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/register"
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Start Your Journey
              </Link>
              <Link
                to="/login"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:border-green-500 hover:text-green-600 transform hover:scale-105 transition-all duration-200"
              >
                Sign In
              </Link>
            </div>

            {/* Animated scroll indicator */}
            <div className="animate-bounce">
              <div className="w-6 h-10 border-2 border-gray-400 rounded-full mx-auto flex justify-center">
                <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Sustainable Living
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools and community support
              you need to make a real difference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Feature Showcase */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {features[currentSlide].title}
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {features[currentSlide].description}
              </p>
              <div className="flex gap-2 mb-8">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <Link
                to="/register"
                className="inline-flex items-center text-green-600 font-semibold hover:text-green-700"
              >
                Learn more about this feature →
              </Link>
            </div>

            <div className="relative">
              <div className={`w-full h-96 bg-gradient-to-r ${features[currentSlide].color} rounded-2xl flex items-center justify-center text-8xl shadow-2xl transform hover:scale-105 transition-transform duration-500`}>
                {features[currentSlide].icon}
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-bounce"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Making a Real Impact Together
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of users who are already making a difference
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Sustainable Journey?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join our community of eco-warriors and begin tracking your impact today.
            Every small action contributes to a healthier planet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              to="/awareness"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-green-600 transform hover:scale-105 transition-all duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Don't wait for tomorrow</h3>
          <p className="text-gray-300 mb-6">
            Start making a positive impact on our planet today. Your future self will thank you.
          </p>
          <Link
            to="/register"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Join Now - It's Free!
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Landing;
