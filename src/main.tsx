import { createRoot } from "react-dom/client";
import "./styles/design-system/index.css";
import "lenis/dist/lenis.css";
import "./styles/base.css";
import "./styles/experience.css";
import "./styles/atmosphere.css";
import "./styles/footer.css";
import "./styles/header.css";
import "./styles/typography.css";
import "./styles/scenes.css";
import "./styles/interface.css";
import "./styles/projects.css";
import "./styles/cursor.css";
import App from "./App.jsx";

const root = document.getElementById("root");
if (!root) throw new Error("#root is missing from index.html");
createRoot(root).render(<App />);
