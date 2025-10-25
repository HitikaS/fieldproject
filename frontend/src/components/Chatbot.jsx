import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';

// Simple response generator - same as backend
const generateChatResponse = (message) => {
  const responses = {
    'recycling': 'Recycling helps reduce waste and conserve resources. Sort your plastics, paper, and metals properly. Did you know that recycling one ton of plastic saves enough energy to power a home for 2-3 months?',
    
    'carbon footprint': 'Your carbon footprint is the total greenhouse gases you produce. Track it in our app and reduce by using public transport, eating less meat, and conserving energy. Small changes like unplugging devices can make a big difference!',
    
    'water conservation': 'Save water by taking shorter showers, fixing leaks, and using water-efficient appliances. Every drop counts - the average person uses 80-100 gallons of water per day!',
    
    'sustainable living': 'Live sustainably by reducing waste, conserving energy, eating plant-based meals, and supporting green products. Start small: use reusable bags, bike instead of drive, and compost food waste.',
    
    'climate change': 'Climate change is caused by greenhouse gases trapping heat in our atmosphere. We can combat it through renewable energy, reforestation, and reducing emissions. Your actions today shape tomorrow\'s world.',
    
    'eco tips': 'Here are some quick eco tips: 1) Use LED bulbs, 2) Walk or bike for short trips, 3) Reduce meat consumption, 4) Use reusable water bottles, 5) Plant trees or support reforestation. Check our Awareness Hub for more detailed guides!',
    
    'renewable energy': 'Renewable energy comes from sources like solar, wind, and hydro power. Switching to renewables can significantly reduce your carbon footprint. Many countries are now generating over 50% of their electricity from renewables!',
    
    'plastic pollution': 'Plastic pollution affects oceans and wildlife. Reduce plastic use by choosing reusable alternatives, avoiding single-use plastics, and properly recycling. Microplastics are now found in 90% of bottled water!',
    
    'deforestation': 'Deforestation contributes to climate change and biodiversity loss. Support sustainable forestry, reduce paper use, and plant trees. We lose 18.7 million acres of forest each year.',
    
    'green technology': 'Green technology includes solar panels, electric vehicles, and energy-efficient appliances. These innovations help us live sustainably while maintaining modern conveniences.'
  };

  // Check for keywords in the message
  for (const [keyword, response] of Object.entries(responses)) {
    if (message.includes(keyword)) {
      return response;
    }
  }

  // Default responses for common greetings and questions
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return 'Hello! I\'m EcoBot, your sustainability assistant. Ask me anything about eco-friendly living, recycling, carbon footprints, or environmental topics!';
  }

  if (message.includes('help') || message.includes('what can you do')) {
    return 'I can help you with: recycling tips, carbon footprint reduction, water conservation, sustainable living advice, climate change information, and eco-friendly practices. What would you like to know?';
  }

  if (message.includes('thank')) {
    return 'You\'re welcome! Remember, every small action contributes to a healthier planet. Keep up the great work!';
  }

  // Fallback response
  return "I'm here to help with sustainability questions! Try asking about recycling, carbon footprints, water conservation, or eco-tips. What specific topic interests you?";
};

function Chatbot() {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm EcoBot, your sustainability assistant. Ask me anything about eco-friendly living!", sender: 'bot', timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = { text: inputMessage, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Try to use the backend API first
      const response = await api.post('/awareness/chat', { message: inputMessage });
      const botMessage = {
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(response.data.timestamp)
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback to local response generation
      const localResponse = generateChatResponse(inputMessage.trim().toLowerCase());
      const botMessage = {
        text: localResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Header */}
        <div className="bg-green-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-xl">🌱</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">EcoBot</h2>
              <p className="text-green-100">Your Sustainability Assistant</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-4 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-base whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-2 ${
                  message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">EcoBot is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me about sustainability, recycling, carbon footprints..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Chatbot;
