import { ErrorScreen } from "./components/error-screen/ErrorScreen";
import { PerfilCargaErrorDialog } from "./components/error-screen/PerfilCargaErrorDialog";
import { AppShell } from "./components/shell/AppShell";
import { OnboardingWizard } from "./components/onboarding/OnboardingWizard";
import {
  SnapshotProvider,
  useSnapshot,
} from "./components/shell/SnapshotProvider";
import { PerfilProvider } from "./components/shell/PerfilProvider";
import { AjustesRecuperacion } from "./components/ajustes-recuperacion/AjustesRecuperacion";
import {
  SeccionActivaProvider,
  usarSeccionActiva,
} from "./hooks/use-seccion-activa";
import "./styles/app.css";
import { useEffect, useState } from "react";

/** Pantalla transitoria mientras llega el snapshot por IPC. */
function PantallaCargando() {
  return (
    <div className="app__cargando">
      <p>Cargando tus finanzas…</p>
    </div>
  );
}

/** Conmuta entre cargando, error, onboarding y shell según el estado compartido. */
export function Contenido() {
  const { estado, reintento, completarOnboarding, confirmarRollback, cerrarFalloPerfil } = useSnapshot();
  const { elegir } = usarSeccionActiva();
  const [recuperacionVisible, setRecuperacionVisible] = useState(false);
  useEffect(() => {
    if (estado.nombre === "cargando") setRecuperacionVisible(false);
  }, [estado.nombre]);
  if (estado.nombre === "cargando") return <PantallaCargando />;
  if (estado.nombre === "error") {
    if (recuperacionVisible) return <AjustesRecuperacion />;
    const gestionarPerfiles = () => { elegir("ajustes"); setRecuperacionVisible(true); };
    return (
      <ErrorScreen error={estado.error} reintentar={estado.recuperar ?? reintento}
        alGestionarPerfiles={gestionarPerfiles} alRegresarAjustes={gestionarPerfiles}
        alVolverPerfilAnterior={estado.recuperar} />
    );
  }
  if (estado.nombre === "fallo-perfil") {
    return <PerfilCargaErrorDialog perfilObjetivo={estado.perfilObjetivo}
      motivo={estado.error.message} alVolverPerfilAnterior={confirmarRollback}
      alCerrar={cerrarFalloPerfil} />;
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
    <SeccionActivaProvider>
      <PerfilProvider>
        <SnapshotProvider>
          <Contenido />
        </SnapshotProvider>
      </PerfilProvider>
    </SeccionActivaProvider>
  );
}
