import { Layout } from '@/components/layout/Layout';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function UnauthorizedPage() {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-large p-8 border border-neutral-200">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">
              Access Denied
            </h1>
            
            <p className="text-neutral-600 mb-6">
              You don&apos;t have permission to access this resource. Please contact your administrator if you believe this is an error.
            </p>
            
            <div className="space-y-3">
              <Link href="/">
                <Button className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Dashboard
                </Button>
              </Link>
              
              <p className="text-sm text-neutral-500">
                Need help? Contact support at{' '}
                <a href="mailto:support@emineon.com" className="text-primary-600 hover:text-primary-700">
                  support@emineon.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 