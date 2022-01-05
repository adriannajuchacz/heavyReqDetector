import './App.css';
import PeakVSNonPeaks from './components/PeakVSNonPeaks';
import PeakDetection from './components/PeakDetection';
import DataPointsChron from './components/DataPointsChron';
import EndpointDistribution from './components/EndpointDistribution';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";


function App() {
  return (
    <div className="App">
      <Router>
        <div>
          <ul style={{ display: "inline-flex"}}>
            <li style={{"margin-right": "30px"}}>
              <Link to="/">Endpoint distribution</Link>
            </li>
            <li style={{"margin-right": "30px"}}>
              <Link to="/statistics">Peak vs Non-Peak Statistics</Link>
            </li>
            <li style={{"margin-right": "30px"}}>
              <Link to="/peak_detection_sorted">Data Points sorted</Link>
            </li>
            <li style={{"margin-right": "30px"}}>
              <Link to="/peak_detection">Data Points chronogically</Link>
            </li>
          </ul>
          <hr />

          <Switch>
            <Route exact path="/">
              <EndpointDistribution />
            </Route>
            <Route path="/statistics">
              <PeakVSNonPeaks />
            </Route>
            <Route path="/peak_detection_sorted">
              <PeakDetection />
            </Route>
            <Route path="/peak_detection">
              <DataPointsChron />
            </Route>
          </Switch>
        </div>
      </Router>
    </div>

  );
}

export default App;
