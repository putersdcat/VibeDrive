import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DriveApp } from "@/drive/ui/DriveApp";
import { PrivacyPage } from "@/drive/ui/PrivacyPage";
import "./styles.css";

const trimmed = window.location.pathname.replace(/\/VibeDrive\/?/, "/");
const Page = trimmed.startsWith("/privacy") ? PrivacyPage : DriveApp;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
