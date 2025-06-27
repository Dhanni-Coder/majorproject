import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './utils/PrivateRoute';
import ToastProvider from './components/common/ToastProvider';
import ModernNavbar from './components/ModernNavbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import QRLogin from './pages/QRLogin';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import QRCode from './pages/QRCode';
import ManageUsers from './pages/ManageUsers';
import Notices from './pages/Notices';
import EditNotice from './pages/EditNotice';
import ViewStudents from './pages/ViewStudents';
import BranchesModern from './pages/BranchesModern';
import BranchesNew from './pages/BranchesNew';
import BranchDetailsModern from './pages/BranchDetailsModern';
import Attendance from './pages/Attendance';
import NewAttendance from './pages/NewAttendance';
import StudentAttendanceModern from './pages/StudentAttendanceModern';
import IDCardGenerator from './pages/IDCardGenerator';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherSchedule from './pages/TeacherSchedule';
import StudentDashboardModern from './pages/StudentDashboardModern';
import LibraryModern from './pages/LibraryModern';
import AddBook from './pages/AddBook';
import UserActivity from './pages/UserActivity';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="app">
            <ModernNavbar />
            <ToastProvider />
            <main className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/qr-login" element={<QRLogin />} />

              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/qr-code" element={<QRCode />} />
                <Route path="/notices" element={<Notices />} />
                <Route path="/notices/edit/:id" element={<EditNotice />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<PrivateRoute allowedRoles={['admin']} />}>
                <Route path="/manage-users" element={<ManageUsers />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/user-activity" element={<UserActivity />} />
                <Route path="/branches" element={<BranchesNew />} />
                <Route path="/branches/:id" element={<BranchDetailsModern />} />
              </Route>

              {/* Teacher Routes */}
              <Route element={<PrivateRoute allowedRoles={['teacher', 'admin']} />}>
                <Route path="/students" element={<ViewStudents />} />
                <Route path="/take-attendance" element={<Attendance />} />
                <Route path="/new-attendance" element={<NewAttendance />} />
                <Route path="/student-attendance/:studentId" element={<StudentAttendanceModern />} />
                <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                <Route path="/schedule" element={<TeacherSchedule />} />
              </Route>

              {/* Student Routes */}
              <Route element={<PrivateRoute allowedRoles={['student']} />}>
                <Route path="/my-attendance" element={<StudentAttendanceModern />} />
                <Route path="/student-attendance" element={<StudentAttendanceModern />} />
                <Route path="/student-dashboard" element={<StudentDashboardModern />} />
              </Route>

              {/* ID Card Generator - Available only to students */}
              <Route element={<PrivateRoute allowedRoles={['student']} />}>
                <Route path="/id-card" element={<IDCardGenerator />} />
              </Route>

              {/* Library Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/library" element={<LibraryModern />} />
              </Route>

              {/* Add Book Route - Available to admin and teachers */}
              <Route element={<PrivateRoute allowedRoles={['admin', 'teacher']} />}>
                <Route path="/add-book" element={<AddBook />} />
              </Route>
            </Routes>
            </main>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
