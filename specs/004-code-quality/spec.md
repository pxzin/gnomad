# Feature Specification: Technical Debt & Code Quality Review

**Feature Branch**: `004-code-quality`
**Created**: 2025-12-11
**Status**: Draft
**Input**: User description: "Technical Debt & Code Quality Review - Revisar a codebase atual (src/lib) para: 1. DRY: Identificar duplicações e centralizar em módulos compartilhados 2. Constantes: Extrair magic numbers e strings para arquivos de configuração 3. Consistência: Padronizar nomenclatura, estrutura de arquivos e exports 4. Type Safety: Melhorar tipagem onde estiver usando 'any' ou tipos implícitos. Priorizar mudanças de baixo risco que não alterem comportamento."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Centralizar Constantes e Magic Numbers (Priority: P1)

Como desenvolvedor, quero que todos os valores hardcoded (números mágicos, strings de configuração, cores, tamanhos) estejam centralizados em arquivos de configuração dedicados, para que eu possa alterar comportamentos do sistema modificando apenas um local.

**Why this priority**: Magic numbers espalhados pelo código são a principal fonte de inconsistências e bugs difíceis de rastrear. Centralizá-los reduz drasticamente o risco de valores divergentes e facilita ajustes futuros.

**Independent Test**: Pode ser testado verificando que cada módulo importa constantes de arquivos centralizados ao invés de definir valores inline. O sistema deve funcionar identicamente após a refatoração.

**Acceptance Scenarios**:

1. **Given** um valor numérico usado em múltiplos arquivos (ex: TILE_SIZE), **When** o desenvolvedor precisa alterá-lo, **Then** a mudança é feita em apenas um arquivo de configuração
2. **Given** uma cor usada para renderização (ex: SELECTION_COLOR), **When** o desenvolvedor busca onde está definida, **Then** encontra em um arquivo de constantes centralizado, não inline no código
3. **Given** um timeout ou delay configurável, **When** precisa ser ajustado, **Then** está definido em um arquivo de configuração com nome descritivo

---

### User Story 2 - Eliminar Duplicação de Código (Priority: P2)

Como desenvolvedor, quero que padrões de código repetidos sejam extraídos para funções/módulos reutilizáveis, para reduzir a quantidade de código a manter e garantir comportamento consistente.

**Why this priority**: Código duplicado significa bugs duplicados. Quando uma correção é feita em um lugar, frequentemente é esquecida em outros. DRY reduz superfície de manutenção.

**Independent Test**: Pode ser testado identificando padrões repetidos (ex: iteração sobre entities, conversão de coordenadas) e verificando que existem funções utilitárias reutilizáveis. Funcionalidade permanece inalterada.

**Acceptance Scenarios**:

1. **Given** um padrão de iteração sobre Map de entities usado em múltiplos sistemas, **When** o desenvolvedor precisa modificar o padrão, **Then** a mudança é feita em uma função utilitária única
2. **Given** lógica de conversão de coordenadas (screen-to-tile, tile-to-world), **When** usada em diferentes módulos, **Then** está centralizada em um módulo de utilidades
3. **Given** padrões de criação de Graphics objects no renderer, **When** precisam ser modificados, **Then** existe uma factory function reutilizável

---

### User Story 3 - Padronizar Estrutura e Nomenclatura (Priority: P3)

Como desenvolvedor, quero que todos os arquivos sigam convenções consistentes de nomenclatura, estrutura de exports e organização, para que navegar e entender a codebase seja previsível.

**Why this priority**: Consistência reduz carga cognitiva. Quando padrões são previsíveis, desenvolvedores encontram o que precisam mais rápido e cometem menos erros.

**Independent Test**: Pode ser testado verificando que todos os arquivos seguem as mesmas convenções de naming, export style e organização interna. Nenhuma funcionalidade é alterada.

**Acceptance Scenarios**:

1. **Given** arquivos de componentes ECS (position, velocity, gnome, tile), **When** o desenvolvedor examina a estrutura, **Then** todos seguem o mesmo padrão de exports e organização
2. **Given** arquivos de sistemas (physics, mining, task-assignment), **When** comparados, **Then** seguem estrutura consistente de imports, exports e documentação
3. **Given** nomes de funções e variáveis, **When** analisados across modules, **Then** seguem convenção consistente (camelCase para funções, UPPER_SNAKE_CASE para constantes)

---

### User Story 4 - Melhorar Type Safety (Priority: P4)

Como desenvolvedor, quero que o código tenha tipagem explícita e forte onde atualmente usa tipos implícitos, 'any' ou tipos muito genéricos, para que o compilador capture erros antes do runtime.

**Why this priority**: TypeScript só ajuda quando os tipos são precisos. Tipos implícitos ou 'any' anulam os benefícios do sistema de tipos e permitem bugs que poderiam ser capturados em compile-time.

**Independent Test**: Pode ser testado rodando o TypeScript compiler em modo strict e verificando que não há erros ou warnings relacionados a tipos. Comportamento runtime permanece idêntico.

**Acceptance Scenarios**:

1. **Given** uma função que aceita parâmetros sem tipo explícito, **When** refatorada, **Then** todos os parâmetros têm tipos declarados
2. **Given** uso de 'any' no código, **When** revisado, **Then** é substituído por tipos específicos ou genéricos apropriados
3. **Given** retornos de função implícitos, **When** analisados, **Then** têm tipo de retorno explicitamente declarado

---

### Edge Cases

- O que acontece quando uma constante centralizada é usada apenas em um arquivo? Decisão: Ainda centralizar se for um "magic number", manter local se for específico do contexto
- Como lidar com constantes que têm valores diferentes por ambiente? Decisão: Criar estrutura de configuração que suporte valores por ambiente
- O que fazer com código duplicado que tem pequenas variações? Decisão: Parametrizar as variações na função utilitária

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema DEVE manter todos os valores numéricos configuráveis (tamanhos, velocidades, delays) em arquivos de constantes centralizados
- **FR-002**: Sistema DEVE manter todas as cores e valores visuais em arquivos de configuração de tema/visual
- **FR-003**: Código duplicado identificado DEVE ser extraído para módulos utilitários reutilizáveis
- **FR-004**: Todos os arquivos de um mesmo tipo (componentes, sistemas, utils) DEVEM seguir estrutura consistente
- **FR-005**: Todas as funções públicas DEVEM ter tipos de parâmetros e retorno explicitamente declarados
- **FR-006**: Uso de 'any' DEVE ser eliminado ou justificado com comentário explicativo
- **FR-007**: Constantes DEVEM usar UPPER_SNAKE_CASE, funções camelCase, tipos/interfaces PascalCase
- **FR-008**: Cada módulo DEVE exportar de forma consistente (named exports preferencialmente)
- **FR-009**: Refatorações NÃO DEVEM alterar comportamento observável do sistema
- **FR-010**: Todos os testes existentes DEVEM continuar passando após refatorações

### Key Entities

- **Constants Module**: Arquivo centralizado contendo valores numéricos e strings configuráveis, organizados por domínio (rendering, physics, input, etc.)
- **Theme/Visual Config**: Configurações visuais como cores, tamanhos de fonte, espaçamentos
- **Utility Functions**: Funções reutilizáveis extraídas de padrões duplicados (coordinate conversion, entity iteration, etc.)
- **Type Definitions**: Tipos compartilhados que podem ser usados across modules

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos magic numbers identificados estão centralizados em arquivos de configuração
- **SC-002**: Zero ocorrências de 'any' não justificado no código
- **SC-003**: Desenvolvedor consegue alterar qualquer valor configurável modificando apenas um arquivo
- **SC-004**: Todos os arquivos de um mesmo tipo seguem estrutura idêntica (verificável por inspeção)
- **SC-005**: Padrões de código duplicado reduzidos em pelo menos 80% (medido por linhas de código similar)
- **SC-006**: TypeScript compila sem erros em modo strict
- **SC-007**: Todos os testes existentes passam sem modificação
- **SC-008**: Nenhuma alteração de comportamento observável pelo usuário final

## Assumptions

- O código atual em src/lib é o escopo da revisão (não inclui routes, tests, ou configurações de build)
- "Baixo risco" significa refatorações que não alteram lógica de negócio, apenas organização
- Constantes específicas de um único módulo podem permanecer locais se não forem "magic numbers"
- A estrutura de diretórios existente (components, systems, game, etc.) será mantida
- Não serão adicionadas novas dependências externas para esta refatoração

## Out of Scope

- Otimizações de performance (será tratado em feature separada)
- Adição de testes unitários (pode ser feature futura)
- Mudanças na arquitetura geral do sistema
- Refatoração do código do editor (src/lib/editor) - foco no core do jogo
