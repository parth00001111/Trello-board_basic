  import SignupPage from "./pages/SignupPage";
  import SigninPage from "./pages/SigninPage"
  import { BrowserRouter, Routes, Route } from "react-router-dom";
  import LandingPage from "./pages/LandingPage";
  import DashBoard from "./pages/DashBoard"

  const App = () => {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={ <LandingPage/> } />
          <Route path="/signup" element={ <SignupPage/> } />
          <Route path="/signin" element={ <SigninPage/> } />
          <Route path="/dashboard" element={ <DashBoard/> } />
        </Routes>
      </BrowserRouter>
    );
  };

  export default App;