import React from 'react';
import ChatCore from './chat/ChatCore';

const HeroChatCard: React.FC = () => {
    return (
        <div className="w-full max-w-3xl mx-auto">
            <ChatCore mode="hero" />
        </div>
    );
};

export default HeroChatCard;
