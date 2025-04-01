import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import ReactCodeMirror, { oneDark } from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";

function Editor() {
  const [content, setContent] = useState("# Hello World");
  const [filePath, setFilePath] = useState("notes/example.md");

  useEffect(() => {
    invoke<string>("read_note", { path: filePath })
      .then((data) => setContent(() => data)) // Functional state update
      .catch(console.error);
  }, [filePath]);

  function saveNote() {
    invoke("save_note", { path: filePath, content })
      .then(() => console.log("Saved"))
      .catch(console.error);
  }

  return (
    <div>
      <ReactCodeMirror
        value={content}
        height="100vh"
        extensions={[markdown()]}
        theme={oneDark}
        onChange={(value) => setContent(value)}
      />
      <button onClick={saveNote}>Save</button>
    </div>
  );
}

export default Editor;
