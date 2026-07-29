import { lazy, Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";

const Coach = lazy(() => import("./pages/Coach"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const GroupDetails = lazy(() => import("./pages/GroupDetails"));
const Groups = lazy(() => import("./pages/Groups"));
const Nutrition = lazy(() => import("./pages/Nutrition"));
const Progress = lazy(() => import("./pages/Progress"));
const Settings = lazy(() => import("./pages/Settings"));
const Workout = lazy(() => import("./pages/Workout"));

function RouteLoading() {
  return (
    <div className="route-loading">
      <LoaderCircle className="spin" size={20} />
      Loading page...
    </div>
  );
}

function PageRoute({ children }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      {children}
    </Suspense>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          index
          element={
            <PageRoute>
              <Dashboard />
            </PageRoute>
          }
        />

        <Route
          path="workout"
          element={
            <PageRoute>
              <Workout />
            </PageRoute>
          }
        />
        <Route
          path="groups"
          element={
            <PageRoute>
              <Groups />
            </PageRoute>
          }
        />
        <Route
          path="groups/:groupId"
          element={
            <PageRoute>
              <GroupDetails />
            </PageRoute>
          }
        />
        <Route
          path="progress"
          element={
            <PageRoute>
              <Progress />
            </PageRoute>
          }
        />
        <Route
          path="nutrition"
          element={
            <PageRoute>
              <Nutrition />
            </PageRoute>
          }
        />
        <Route
          path="coach"
          element={
            <PageRoute>
              <Coach />
            </PageRoute>
          }
        />
        <Route
          path="settings"
          element={
            <PageRoute>
              <Settings />
            </PageRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
