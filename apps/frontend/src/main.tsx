import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "react-flow-renderer/dist/style.css";
import { AppProviders } from "./app/providers/AppProviders";
import { router } from "./app/router";
import { GlobalStyle } from "./shared/styles/GlobalStyle";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <GlobalStyle />
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
);
