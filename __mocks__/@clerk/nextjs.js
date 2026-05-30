// Mock @clerk/nextjs for Jest tests
const noop = () => {}

module.exports = {
  useAuth: () => ({
    isSignedIn: false,
    isLoaded: true,
    userId: null,
    sessionId: null,
    signOut: noop,
    getToken: noop,
  }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: false,
    user: null,
  }),
  useClerk: () => ({
    user: null,
    loaded: true,
  }),
  ClerkProvider: ({ children }) => children,
  SignedIn: ({ children }) => null,
  SignedOut: ({ children }) => children,
  RedirectToSignIn: () => null,
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  Protect: ({ children }) => children,
}
