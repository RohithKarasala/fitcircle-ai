import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";

import Coach from "./pages/Coach";
import Dashboard from "./pages/Dashboard";
import GroupDetails from "./pages/GroupDetails";
import Groups from "./pages/Groups";
import Nutrition from "./pages/Nutrition";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import Workout from "./pages/Workout";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />

        <Route path="workout" element={<Workout />} />
        <Route path="groups" element={<Groups />} />
        <Route
          path="groups/:groupId"
          element={<GroupDetails />}
        />
        <Route path="progress" element={<Progress />} />
        <Route path="nutrition" element={<Nutrition />} />
        <Route path="coach" element={<Coach />} />
        <Route path="settings" element={<Settings />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
