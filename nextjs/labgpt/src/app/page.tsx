"use client"
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/workspaces");
  }, [router]);

  return (
    <div className="">
      <h1>Hello World</h1>
    </div>
  );
}
