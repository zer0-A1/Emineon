import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
          <p className="text-gray-600">
            We&apos;re sorry, but the page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          
          <Link 
            href="/dashboard"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 