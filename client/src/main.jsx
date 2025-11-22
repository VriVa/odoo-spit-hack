import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'
import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        
        variables: {
          colorPrimary: "#5D4037",
        },
         
      }}
    >
      <App />
    </ClerkProvider> 
)
