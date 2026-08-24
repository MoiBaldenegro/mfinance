import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { iniciarTema } from "./lib/estado-tema.ts";
import { temaPort } from "./adapters/tema-local-storage-adapter.ts";
import "./styles/global.css";

// REQ-17-08: data-theme se fija sobre <html> ANTES del primer render para
// evitar destello de tema claro; sin preferencia válida abre oscuro.
iniciarTema(temaPort);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
