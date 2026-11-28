/**
 * Crea el enlace de registro de un pago real, como lo hara el correo de
 * KAN-24 (spec KAN-25 §6). Mientras KAN-24 no exista, es la unica forma de
 * probar el registro del suscriptor en produccion.
 *
 * 1. Pagar un plan en la pagina (/plans) con el correo de prueba.
 * 2. Ejecutar:
 *      npx tsx scripts/create-sign-up-link.ts <correo-del-pago> [url-del-sitio]
 * 3. Abrir el enlace que imprime (vale 7 dias y se puede usar una sola vez).
 *
 * Usa la cuenta de servicio (*firebase-adminsdk*.json en la raiz, ignorada por
 * git) y solo cambia el planCheckout de ese pago: guarda el hash del token y
 * la fecha de vencimiento. El token no se guarda en ningun lado.
 */
import fs from "node:fs";
import path from "node:path";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { CREATE_SIGN_UP_LINK } from "./constants/CreateSignUpLink.constants";
import { SIGN_UP_LINK } from "../functions/src/billing/constants/SubscriberSignUp.constants";
import { createSignUpToken } from "../functions/src/billing/signUpToken";
import { FIRESTORE_COLLECTION } from "../src/constants/firestore/FirestoreCollection.constants";

const readServiceAccount = (): ServiceAccount => {
  const keyFileName = fs
    .readdirSync(process.cwd())
    .find(
      (fileName) =>
        fileName.includes(CREATE_SIGN_UP_LINK.SERVICE_ACCOUNT_FILE_MARKER) &&
        fileName.endsWith(CREATE_SIGN_UP_LINK.SERVICE_ACCOUNT_FILE_EXTENSION),
    );
  if (!keyFileName) {
    throw new Error(
      "No se encontro la cuenta de servicio (*firebase-adminsdk*.json) en la raiz del proyecto.",
    );
  }
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), keyFileName), "utf-8"),
  ) as ServiceAccount;
};

const checkoutEmail = process.argv[2]?.trim().toLowerCase();
const siteUrl = (
  process.argv[3] ?? CREATE_SIGN_UP_LINK.DEFAULT_SITE_URL
).replace(/\/+$/, "");

if (!checkoutEmail) {
  console.error(
    "Uso: npx tsx scripts/create-sign-up-link.ts <correo-del-pago> [url-del-sitio]",
  );
  process.exit(1);
}

const firestore = getFirestore(
  initializeApp({ credential: cert(readServiceAccount()) }),
);

const createSignUpLink = async (): Promise<void> => {
  const checkoutsSnapshot = await firestore
    .collection(FIRESTORE_COLLECTION.PLAN_CHECKOUTS)
    .where("email", "==", checkoutEmail)
    .get();
  // The most recent payment of that email that has no account yet.
  const unusedCheckout = checkoutsSnapshot.docs
    .filter((checkoutSnapshot) => !checkoutSnapshot.data().signUpCompletedAt)
    .sort(
      (firstCheckout, secondCheckout) =>
        (secondCheckout.data().paidAt?.toMillis() ?? 0) -
        (firstCheckout.data().paidAt?.toMillis() ?? 0),
    )[0];

  if (!unusedCheckout) {
    console.error(
      `No hay un pago sin registro para ${checkoutEmail}. Paga un plan en ${siteUrl}/plans con ese correo y vuelve a intentar.`,
    );
    process.exit(1);
  }

  const { signUpToken, signUpTokenHash } = createSignUpToken();
  const signUpLinkExpiresAt = Timestamp.fromMillis(
    Date.now() + SIGN_UP_LINK.VALID_MILLISECONDS,
  );
  await unusedCheckout.ref.update({ signUpLinkExpiresAt, signUpTokenHash });

  console.log(`Pago:      planCheckouts/${unusedCheckout.id}`);
  console.log(`Vence:     ${signUpLinkExpiresAt.toDate().toISOString()}`);
  console.log(
    `Enlace:    ${siteUrl}${CREATE_SIGN_UP_LINK.SIGN_UP_PATH}${signUpToken}`,
  );
};

await createSignUpLink();
