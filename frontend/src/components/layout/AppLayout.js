import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ChatbotWidget from '../ui/ChatbotWidget';

export default function AppLayout({ children, title, subtitle, page, chatContext }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title={title} subtitle={subtitle} />
        <div className="page-content">{children}</div>
      </div>
      <ChatbotWidget page={page} context={chatContext} />
    </div>
  );
}
