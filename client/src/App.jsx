import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './utils/PrivateRoute';
import Navbar from './components/Navbar';
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
import Branches from './pages/Branches';
import BranchDetails from './pages/BranchDetails';
import Attendance from './pages/Attendance';
import StudentAttendance from './pages/StudentAttendance';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
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
                <Route path="/branches" element={<Branches />} />
                <Route path="/branches/:id" element={<BranchDetails />} />
                <Route path="/notices" element={<Notices />} />
                <Route path="/notices/edit/:id" element={<EditNotice />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<PrivateRoute allowedRoles={['admin']} />}>
                <Route path="/manage-users" element={<ManageUsers />} />
              </Route>

              {/* Teacher Routes */}
              <Route element={<PrivateRoute allowedRoles={['teacher', 'admin']} />}>
                <Route path="/students" element={<ViewStudents />} />
                <Route path="/take-attendance" element={<Attendance />} />
                <Route path="/student-attendance/:studentId" element={<StudentAttendance />} />
              </Route>

              {/* Student Routes */}
              <Route element={<PrivateRoute allowedRoles={['student']} />}>
                <Route path="/my-attendance" element={<StudentAttendance />} />
              </Route>
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
