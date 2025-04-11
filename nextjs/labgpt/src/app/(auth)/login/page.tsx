"use client"

import { Button } from "@/core/global/components/ui/button"
import { Input } from "@/core/global/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/global/components/ui/card"
import { Separator } from "@/core/global/components/ui/separator"
import { useAuth } from "@/core/global/hooks/useAuth"

export default function Login() {
    const { 
        email, 
        setEmail, 
        password, 
        setPassword, 
        handleSignIn, 
        handleSignUp, 
        handleForgotPassword 
    } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome 👋</CardTitle>
          <CardDescription className="text-center">Sign in or create an account to start using LabGPT.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
          </div>

          <Button onClick={handleSignIn} className="w-full" variant="default">
            Sign In
          </Button>

          <Button onClick={handleForgotPassword} variant="link" className="w-full text-gray-500 hover:text-gray-700">
            Forgot your password?
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          <Button onClick={handleSignUp} variant="outline" className="w-full">
            Sign Up
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
