import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import InternshipList from "./pages/InternshipList";
import AddInternship from "./pages/AddInternship";
import InternshipDetails from "./pages/InternshipDetails";
import ApplyForm from "./pages/ApplyForm";
import Login from "./pages/Login";
import RegisterStudent from "./pages/RegisterStudent";
import RegisterCompany from "./pages/RegisterCompany";
import Profile from "./pages/Profile";
import CompanyApplicantsPage from "./pages/CompanyApplicantsPage";
import StudentInterviewPage from "./pages/StudentInterviewPage";
import CareerChatbot from "./components/CareerChatbot";
import "./App.css";
import SkillGapAnalyzer from "./pages/SkillGapAnalyzer";
import Feed from "./pages/Feed";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCourseManagement from "./pages/AdminCourseManagement";
import AdminRoleManagement from "./pages/AdminRoleManagement";
import RegisterAdmin from "./pages/RegisterAdmin";

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content">
        <div className="container">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/internships" element={<InternshipList />} />
          <Route path="/add" element={<AddInternship />} />
          <Route path="/internship/:id" element={<InternshipDetails />} />
          <Route path="/apply/:id" element={<ApplyForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-student" element={<RegisterStudent />} />
          <Route path="/register-company" element={<RegisterCompany />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route
            path="/company-applicants"
            element={<CompanyApplicantsPage />}
          />
          <Route
            path="/student-interviews"
            element={<StudentInterviewPage />}
          />
          <Route path="/skill-gap-analyzer" element={<SkillGapAnalyzer />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-courses" element={<AdminCourseManagement />} />
          <Route path="/admin-roles" element={<AdminRoleManagement />} />
          <Route path="/register-admin" element={<RegisterAdmin />} />
        </Routes>
        </div>
      </main>
      <CareerChatbot />
    </div>
  );
}

export default App;
