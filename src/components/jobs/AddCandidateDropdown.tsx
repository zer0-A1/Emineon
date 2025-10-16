'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, UserPlus, Users, Search, Brain } from 'lucide-react';

interface AddCandidateDropdownProps {
  onAddExisting: () => void;
  onCreateNew: () => void;
  onFindBestMatches?: () => void;
  className?: string;
  buttonClassName?: string;
}

export function AddCandidateDropdown({ onAddExisting, onCreateNew, onFindBestMatches, className = '', buttonClassName = '' }: AddCandidateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('left');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 288; // w-72 = 18rem = 288px
      const viewportWidth = window.innerWidth;
      const spaceOnRight = viewportWidth - buttonRect.right;
      
      // If there's not enough space on the right, position it to the right of the button
      if (spaceOnRight < dropdownWidth) {
        setDropdownPosition('right');
      } else {
        setDropdownPosition('left');
      }
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        data-test="add-candidate-dropdown"
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 space-x-2 ${buttonClassName}`}
      >
        <UserPlus className="h-4 w-4" />
        <span>Add Candidate</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${
          dropdownPosition === 'right' ? 'right-0' : 'left-0'
        }`}>
          <div className="py-1">
            <button
              data-test="add-existing-candidate"
              onClick={() => {
                onAddExisting();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Add Existing Candidate</div>
                <div className="text-sm text-gray-500">Select from your database</div>
              </div>
            </button>
            
            <button
              data-test="create-new-candidate"
              onClick={() => {
                onCreateNew();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Create New Candidate</div>
                <div className="text-sm text-gray-500">Upload CV, LinkedIn, or manual entry</div>
              </div>
            </button>

            {onFindBestMatches && (
              <button
                data-test="find-best-matches"
                onClick={() => {
                  onFindBestMatches();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Find Best Matches</div>
                  <div className="text-sm text-gray-500">AI-ranked candidates for this role</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 