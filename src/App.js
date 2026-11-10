import "swiper/swiper.min.css";
import "boxicons/css/boxicons.min.css";
import "./App.scss";

import { BrowserRouter, Route } from "react-router-dom";

import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";

import Routes from "./routes/Routes";
import { AuthProvider } from "./auth/AuthContext";

function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Route
        render={(props) => (
          <>
            <Header {...props} />

            <Routes />

            <Footer />
          </>
        )}
      />
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
