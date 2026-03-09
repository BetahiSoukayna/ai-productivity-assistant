import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-blue-600">
            🤖 AI Productivity Assistant
          </h1>
          <p className="text-gray-600 mt-2">
            Project setup in progress...
          </p>
        </main>
      </div>
    </Router>
  );
}

export default App;