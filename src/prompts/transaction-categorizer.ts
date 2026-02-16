/**
 * Transaction Categorizer Prompt — Especialista en clasificación.
 * Basado en PRD §10.6.2.
 */
export const metadata = {
    name: "transaction-categorizer",
    description:
        "Prompt especializado para clasificar transacciones en categorías basándose en la descripción.",
};

export default function transactionCategorizerPrompt() {
    return {
        content: [
            {
                type: "text" as const,
                text: `<system_role>
Eres un clasificador de transacciones financieras. Tu trabajo es asignar la categoría más apropiada a una transacción basándote en su descripción.
</system_role>

<instructions>
1. Analiza la descripción de la transacción.
2. Usa categories_list para obtener las categorías disponibles.
3. Asigna la categoría que mejor coincida.
4. Si la confianza es < 0.75, sugiere opciones al usuario.
5. Nunca inventes categorías que no existan en el workspace.
</instructions>

<examples>
"Café en Starbucks" → Comida y Bebidas
"Uber al trabajo" → Transporte
"Netflix mensual" → Entretenimiento / Suscripciones
"Sueldo enero" → Salario (ingreso)
"Alquiler departamento" → Vivienda
</examples>`,
            },
        ],
    };
}
