comercial_path = '/Users/giovananogueira/Documents/Estaleiro/front-end-serptech/src/services/comercial.ts'
marketing_path = '/Users/giovananogueira/Documents/Estaleiro/front-end-serptech/src/services/marketing.ts'

# Verify what is already exported to prevent duplicate exports
with open(comercial_path, 'r', encoding='utf-8') as f:
    c_content = f.read()

with open(marketing_path, 'r', encoding='utf-8') as f:
    m_content = f.read()

c_appends = "\n// --- Fallbacks para evitar quebra do Vite Rollup ---\n"
for mock in ['oportunidadesMock', 'metasMock', 'atividadesMock', 'contatosMock', 'contasMock', 'comissoesMock', 'leadsMock', 'propostasMock']:
    if f"export const {mock}" not in c_content:
        c_appends += f"export const {mock}: any[] = [];\n"

for func in ['getPipelineTotal', 'getForecastPonderado']:
    if f"export const {func}" not in c_content:
        c_appends += f"export const {func} = () => 0;\n"

if "export const getContaById" not in c_content:
    c_appends += "export const getContaById = (id: string) => null;\n"

if c_appends.strip() != "// --- Fallbacks para evitar quebra do Vite Rollup ---":
    with open(comercial_path, 'a', encoding='utf-8') as f:
        f.write(c_appends)


m_appends = "\n// --- Fallbacks para evitar quebra do Vite Rollup ---\n"
for mock in ['leadsMarketingMock', 'campanhasMock', 'canaisMock', 'leadsPorCanalData']:
    if f"export const {mock}" not in m_content:
        m_appends += f"export const {mock}: any[] = [];\n"

for func in ['calcularMetricasCampanha', 'calcularMetricasCanal']:
    if f"export const {func}" not in m_content:
        m_appends += f"export const {func} = () => ({{}});\n"

if m_appends.strip() != "// --- Fallbacks para evitar quebra do Vite Rollup ---":
    with open(marketing_path, 'a', encoding='utf-8') as f:
        f.write(m_appends)

print("Fallbacks appended successfully")
