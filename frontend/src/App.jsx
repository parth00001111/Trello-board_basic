import SignupPage from "./pages/SignupPage";
import SigninPage from "./pages/SigninPage"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={ <LandingPage/> } />
        <Route path="/signup" element={ <SignupPage/> } />
        <Route path="/signin" element={ <SigninPage/> } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;