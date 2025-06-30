import React, { useState } from 'react';
import { format } from 'date-fns';
import { Search, Filter, Star, Archive, Trash2, Download } from 'lucide-react';
import { Conversation } from '../../types';
import { Button } from '../ui/Button';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (id: string) => void;
  onToggleStar: (id: string) => void;
  onExportConversation: (conversation: Conversation) => void;
}

export function ConversationList({ 
  conversations, 
  onSelectConversation, 
  onDeleteConversation,
  onToggleStar,
  onExportConversation
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMood, setFilterMood] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filteredConversations = conversations
    .filter(conv => {
      const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          conv.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          conv.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesMood = filterMood === 'all' || conv.mood === filterMood;
      return matchesSearch && matchesMood && !conv.archived;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'mood':
          return a.mood.localeCompare(b.mood);
        default:
          return 0;
      }
    });

  const moods = [...new Set(conversations.map(c => c.mood))];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Conversations</h2>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <select
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Moods</option>
            {moods.map(mood => (
              <option key={mood} value={mood} className="capitalize">
                {mood}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="mood">Sort by Mood</option>
          </select>
        </div>
      </div>

      {/* Conversation Cards */}
      <div className="divide-y divide-gray-200">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || filterMood !== 'all' ? (
              <div>
                <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>No conversations match your filters</p>
              </div>
            ) : (
              <div>
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Start chatting to see your conversations here</p>
              </div>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {conversation.title}
                    </h3>
                    {conversation.starred && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {conversation.summary}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{format(conversation.updatedAt, 'MMM dd, yyyy')}</span>
                    <span className="capitalize px-2 py-1 bg-gray-100 rounded-full">
                      {conversation.mood}
                    </span>
                    <span>{conversation.messages.length} messages</span>
                  </div>
                  
                  {conversation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {conversation.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {conversation.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{conversation.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(conversation.id);
                    }}
                    className="p-2"
                  >
                    <Star className={`h-4 w-4 ${conversation.starred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportConversation(conversation);
                    }}
                    className="p-2"
                  >
                    <Download className="h-4 w-4 text-gray-400" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conversation.id);
                    }}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}