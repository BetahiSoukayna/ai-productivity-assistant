import React, { useState } from 'react';
import axios from 'axios';

function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        // Ajouter le message utilisateur
        const userMsg = { role: 'user', content: input };
        setMessages([...messages, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Appeler le backend
            const response = await axios.post('/api/chat', {
                user_message: input,
                conversation_history: messages
            });

            // Ajouter la réponse du chatbot
            const botMsg = { 
                role: 'assistant', 
                content: response.data.response 
            };
            setMessages(prev => [...prev, userMsg, botMsg]);

        } catch (error) {
            console.error('Erreur chat:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {loading && <div className="message bot">Réflexion en cours...</div>}
            </div>
            
            <div className="input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Dis-moi ce que tu dois faire..."
                />
                <button onClick={sendMessage} disabled={loading}>
                    Envoyer
                </button>
            </div>
        </div>
    );
}

export default Chatbot;