import { PLAN_STATUS } from "@/domain";
import type { Plan } from "../models/Plan.interface";

export const MOCK_PLANS: readonly Plan[] = Object.freeze([
  Object.freeze({
    billingPeriod: "monthly",
    features: Object.freeze([
      "Hasta 50 reservas al mes",
      "1 profesional o colaborador",
      "Recordatorios básicos por correo",
      "Soporte por correo electrónico",
    ]),
    id: "mock-plan-basic",
    limits: Object.freeze({ maxBookings: 50 }),
    name: "Plan Básico",
    priceInCents: 1500,
    status: PLAN_STATUS.ACTIVE,
  }),
  Object.freeze({
    billingPeriod: "monthly",
    features: Object.freeze([
      "Hasta 250 reservas al mes",
      "Hasta 5 colaboradores",
      "Recordatorios por WhatsApp y correo",
      "Gestión de horarios y descansos",
      "Soporte prioritario",
    ]),
    id: "mock-plan-pro",
    limits: Object.freeze({ maxBookings: 250 }),
    name: "Plan Profesional",
    priceInCents: 2900,
    status: PLAN_STATUS.ACTIVE,
  }),
  Object.freeze({
    billingPeriod: "monthly",
    features: Object.freeze([
      "Reservas mensuales ilimitadas",
      "Colaboradores ilimitados",
      "Reportes analíticos avanzados",
      "Integración de pagos en línea",
      "Soporte dedicado 24/7",
    ]),
    id: "mock-plan-enterprise",
    limits: Object.freeze({ maxBookings: 1000 }),
    name: "Plan Empresarial",
    priceInCents: 4900,
    status: PLAN_STATUS.ACTIVE,
  }),
]);
