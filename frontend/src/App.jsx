import React from 'react';
import { useAuth } from './AuthContext';
import Login from './apps/Login';
import AdminDashboard from './apps/admin/Dashboard';
import CounselorDashboard from './apps/counselor/Dashboard';
import HODDashboard from './apps/hod/Dashboard';
import FacultyDashboard from './apps/faculty/Dashboard';
import StudentDashboard from './apps/student/Dashboard';

function App() {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Login />;
  }

  // Switch dashboards based on user role
  const role = user.role ? user.role.toUpperCase() : '';

  switch (role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'COUNSELOR':
      return <CounselorDashboard />;
    case 'HOD':
      return <HODDashboard />;
    case 'FACULTY':
      return <FacultyDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    default:
      return <Login />;
  }
}

export default App;

