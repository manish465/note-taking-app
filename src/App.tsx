import { useEffect, useState } from "react";
import "./App.css";
import Editor from "./component/Editor";
import GraphView from "./component/GraphView";
import { invoke } from "@tauri-apps/api/core";

interface Node {
  id: string;
  name: string;
  type?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

const links = [
  { source: "note1", target: "note2" },
  { source: "note2", target: "note3" },
  { source: "note1", target: "note4" }
];

function App() {
  const [valutFolderPath, setValutFolderPath] = useState("");
  const [noteFileName, setNoteFileName] = useState<Node[]>([]);

  useEffect(() => {
    setValutFolderPath("D:/Vaults/MyVault");
  }, []);

  useEffect(() => { 
    fetchNotesData();
  }, [valutFolderPath]);

  const mapNotesData = (_data: string[]) => {
    // const responseData = data;
    const responseData = ["note1", "note2", "note3", "note4"];
    setNoteFileName(responseData.map((name) => ({ id: name, name })));
  } 

  const fetchNotesData = () => { 
    invoke<string[]>("get_all_notes", { path: valutFolderPath })
      .then((data) => {
        mapNotesData(data);
      })
      .catch(console.error);
  }

  return (
    <div style={{ display: "flex" }}>
      <GraphView nodes={noteFileName} links={links} />
    </div>
  );
}

export default App;