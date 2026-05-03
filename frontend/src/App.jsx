import { RouterProvider } from "react-router";
import { Toaster } from "react-hot-toast";
import { router } from "./app.router.jsx";
import { AuthProvider } from "./features/auth/auth.context.jsx";
import { InterviewProvider } from "./features/interview/interview.context.jsx";

function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <RouterProvider router={router} />
      </InterviewProvider>
    </AuthProvider>
  );
}

export default App;
