import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Board from "./pages/Board";
import ProtectedRoute from "./auth/ProtectedRoute";
import TaskDetails from "./pages/TaskDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Board />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks/:id"
          element={
            <ProtectedRoute>
              <TaskDetails />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
