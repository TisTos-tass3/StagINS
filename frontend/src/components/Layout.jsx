import React from "react";
import Sidebar from "./Sidebar";


export default function Layout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        
        <main className="p-6 bg-gray-100 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
