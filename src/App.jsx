import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SalaVideollamada from "./pages/SalaVideoLlamada";
import Home from "./pages/Home";

function App() {

  return (
    
    
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/videollamada/:id" element={<SalaVideollamada />} />
      </Routes>
    </Router>
     
    
  )
}

export default App
