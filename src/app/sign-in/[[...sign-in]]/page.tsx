import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-primary-900">
            Welcome to Emineon
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Sign in to your account to continue
          </p>
        </div>
        
        <div className="flex justify-center">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'btn-primary',
                card: 'shadow-medium border border-secondary-200',
                headerTitle: 'text-primary-900',
                headerSubtitle: 'text-secondary-600',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
} 