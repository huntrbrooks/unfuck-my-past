import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Start Your Journey</h1>
          <p className="text-gray-600">
            Create your account to begin your healing process
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md w-full transition-colors",
                card: "bg-white rounded-lg shadow-xl p-6",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
              }
            }}
          />
      </div>
    </div>
  );
}
