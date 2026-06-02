// Mock for @clerk/nextjs
import React from 'react'

export const auth = jest.fn()
export const useAuth = jest.fn().mockReturnValue({ isSignedIn: false })
export const useUser = jest.fn().mockReturnValue({ user: null })
export const useClerk = jest.fn().mockReturnValue({})
export const ClerkProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const SignedIn = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const SignedOut = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const UserButton = () => null
