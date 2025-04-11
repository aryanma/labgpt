import { createClient } from "@/utils/supabase/supabaseClient"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export const useAuth = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter()

    const handleSignIn = async () => {
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
        });
        
        if (error) {
            toast.error(error.message)
        } else {
            toast.success("Logged in successfully!")
            router.push("/workspaces")    
        }
    }; 

    const handleSignUp = () => {
        console.log("Sign up")
    }

    const handleForgotPassword = () => {
        console.log("Forgot password")
    }

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/login")
    }

    return {
        email,
        setEmail,
        password,
        setPassword,
        handleSignIn,
        handleSignUp,
        handleForgotPassword,
        handleSignOut
    }
}