import { useEffect, useRef, type RefObject } from "react";
import type { NullableRef } from "@/types";

/**
 * Da el foco al botón "Seguir conectado" cuando se abre el aviso: es la
 * respuesta más segura para quien no esperaba el aviso (US-38, D-7).
 * @returns {RefObject<NullableRef<HTMLButtonElement>>} Para el botón.
 */
export const useIdleWarningDialogFocus = (): RefObject<
  NullableRef<HTMLButtonElement>
> => {
  const stayConnectedReference = useRef<NullableRef<HTMLButtonElement>>(null);

  useEffect(() => {
    stayConnectedReference.current?.focus();
  }, []);

  return stayConnectedReference;
};
