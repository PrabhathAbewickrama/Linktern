import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SkillGapAnalyzer from "./pages/SkillGapAnalyzer";

function App() {
  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/analyze"
          element={
            <div className="p-4 md:p-8 flex justify-center items-start min-h-screen">
              <div className="w-full max-w-4xl">
                <SkillGapAnalyzer />
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;