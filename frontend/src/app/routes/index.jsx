import { createBrowserRouter } from "react-router-dom";
import Login from "@/features/auth/login";
import Register from "@/features/auth/register";
import Dashboard from "@/features/dashboard/Dashboard";
import Documents from "@/features/documents/Documents";
import Trash from "@/features/documents/Trash";
import Verification from "@/features/documents/Verification";
import FolderHierarchy from "@/features/documents/FolderHierarchy";
import Chatbot from "@/features/chatbot/Chatbot";
import RoleManagement from "@/features/roles/RoleManagement";
import OSINTTracker from "@/features/osint-tracker/OSINTTracker";
import Forms from "@/features/forms/Forms";
import Tasks from "@/features/tasks/Tasks";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/", element: <Dashboard /> },
  { path: "/tasks", element: <Tasks /> },
  { path: "/forms", element: <Forms /> },
  { path: "/documents", element: <Documents /> },
  { path: "/folders", element: <FolderHierarchy /> },
  { path: "/trash", element: <Trash /> },
  { path: "/verification", element: <Verification /> },
  { path: "/chatbot", element: <Chatbot /> },
  { path: "/roles", element: <RoleManagement /> },
  { path: "/osint-tracker", element: <OSINTTracker /> },
]);
