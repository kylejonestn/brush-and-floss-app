import React, { useState } from 'react';

export default function Onboarding({ onComplete }) {
  const [name, setName] = useState('');
  const [reminders, setReminders] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete({ name: name.trim(), reminders });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#2d3a70] text-white px-6">
      <div className="w-full max-w-md bg-white text-black p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🦷</div>
          <h1 className="text-2xl font-bold text-[#2d3a70]">Welcome!</h1>
          <p className="text-gray-500 mt-2">Let's set up your brushing dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">What should we call you?</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2d3a70] text-lg"
              placeholder="e.g. Kyle, Emily..."
              required
            />
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <input 
              type="checkbox" 
              id="reminders" 
              checked={reminders}
              onChange={(e) => setReminders(e.target.checked)}
              className="w-5 h-5 text-[#2d3a70] rounded focus:ring-[#2d3a70]"
            />
            <label htmlFor="reminders" className="text-sm text-gray-700 font-medium">
              I'd like to set up daily brushing reminders later
            </label>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#2d3a70] hover:bg-[#3b4b94] text-white font-semibold py-4 rounded-xl text-lg transition-colors shadow-lg"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}
