// Estado compartido de perfiles: permanece montado aunque SnapshotProvider
// cambie a error, para permitir recuperar la sesión sin datos financieros.
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { perfilPort } from '../../adapters/perfil-ipc-adapter.ts';
import type { Perfil } from '../../domain/entities/perfil.ts';
import { cargarPerfiles } from '../../domain/use-cases/cargar-perfiles.ts';
import { PerfilContext } from '../../hooks/use-perfil.ts';
import type { ValorPerfiles } from '../../hooks/use-perfil.ts';
import '../../styles/perfil-provider.css';

export function PerfilProvider({ children }: { readonly children: ReactNode }) {
  const [perfiles, setPerfiles] = useState<readonly Perfil[]>([]);
  const [activo, setActivo] = useState<Perfil | null>(null);
  const [avisoCarga, setAvisoCarga] = useState<string | null>(null);

  const refrescar = useCallback(() => {
    void cargarPerfiles(perfilPort).then((resultado) => {
      if (!resultado.ok) {
        setAvisoCarga(resultado.error.message);
        return;
      }
      setPerfiles(resultado.perfiles);
      setActivo(resultado.activo);
      setAvisoCarga(null);
    });
  }, []);

  useEffect(() => { refrescar(); }, [refrescar]);
  const valor = useMemo<ValorPerfiles>(
    () => ({ perfiles, activo, avisoCarga, fijarActivo: setActivo, refrescar }),
    [perfiles, activo, avisoCarga, refrescar],
  );
  return <PerfilContext.Provider value={valor}>{children}</PerfilContext.Provider>;
}
