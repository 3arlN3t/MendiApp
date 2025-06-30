import React from 'react';
import { AlertTriangle, Phone, MessageCircle, ExternalLink } from 'lucide-react';
import { EmergencyResource } from '../../types';

interface EmergencyBannerProps {
  resources: EmergencyResource[];
  onClose: () => void;
}

export function EmergencyBanner({ resources, onClose }: EmergencyBannerProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Crisis Support Available
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p className="mb-3">
              I'm concerned about what you've shared. Please know that help is available 24/7.
              You don't have to go through this alone.
            </p>
            
            <div className="space-y-2">
              {resources.map((resource, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900">{resource.name}</h4>
                    <p className="text-xs text-red-700 mt-1">{resource.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {resource.phone && (
                      <a
                        href={`tel:${resource.phone}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        Call
                      </a>
                    )}
                    {resource.text && (
                      <a
                        href={`sms:${resource.text}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <MessageCircle className="h-3 w-3" />
                        Text
                      </a>
                    )}
                    <a
                      href={resource.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Visit
                    </a>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 font-medium">
                🚨 <strong>In immediate danger?</strong> Call 911 or go to your nearest emergency room.
              </p>
            </div>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="rounded-md bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-50 p-1.5"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}