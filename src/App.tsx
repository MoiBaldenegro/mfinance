import { ErrorScreen } from "./components/error-screen/ErrorScreen";
import { AppShell } from "./components/shell/AppShell";
import { OnboardingWizard } from "./components/onboarding/OnboardingWizard";
import {
  SnapshotProvider,
  useSnapshot,
} from "./components/shell/SnapshotProvider";
import "./styles/app.css";

/** Pantalla transitoria mientras llega el snapshot por IPC. */
function PantallaCargando() {
  return (
    <div className="app__cargando">
      <p>Cargando tus finanzas…</p>
    </div>
  );
}

/** Conmuta entre cargando, error, onboarding y shell según el estado compartido. */
function Contenido() {
  const { estado, recargar, completarOnboarding } = useSnapshot();
  if (estado.nombre === "cargando") return <PantallaCargando />;
  if (estado.nombre === "error") {
    return <ErrorScreen error={estado.error} reintentar={recargar} />;
  }
  if (estado.nombre === "onboarding") {
    return (
      <div className="app__pagina">
        <OnboardingWizard
          alCompletar={() => void completarOnboarding()}
          alSaltar={() => void completarOnboarding()}
        />
      </div>
    );
  }
  return <AppShell snapshot={estado.snapshot} />;
}

export default function App() {
  return (
    <SnapshotProvider>
      <Contenido />
    </SnapshotProvider>
  );
}