import "./App.css";
import Editor from "./component/Editor";
import GraphView from "./component/GraphView";

const nodes = [
  { id: "note1" },
  { id: "note2" },
  { id: "note3" },
  { id: "note4" }
];

const links = [
  { source: "note1", target: "note2" },
  { source: "note2", target: "note3" },
  { source: "note1", target: "note4" }
];

function App() {
  return (
    <div style={{ display: "flex" }}>
      <GraphView nodes={nodes} links={links} />
    </div>
  );
}

export default App;