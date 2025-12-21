# Feature Specification: Background Blocks & Horizon System

**Feature Branch**: `010-background-blocks-horizon`
**Created**: 2025-12-21
**Status**: Draft
**Input**: Backlog item 010 - Sistema de camadas de terreno com background blocks e horizonte

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visual Depth Through Background Layers (Priority: P1)

Como jogador, quando eu minero um bloco de terreno, quero ver uma camada de background por trás que dá profundidade visual ao mundo, para que eu tenha sensação de estar cavando "para dentro" do terreno.

**Why this priority**: Esta é a funcionalidade core da feature - sem backgrounds visíveis, nenhuma outra funcionalidade faz sentido. Proporciona feedback visual imediato que melhora a experiência de jogo.

**Independent Test**: Pode ser testado minerando qualquer bloco e verificando visualmente que um background aparece por trás.

**Acceptance Scenarios**:

1. **Given** um mundo gerado com blocos de terreno, **When** o jogador minera um bloco de dirt, **Then** um background block (mais escuro/dessaturado) é revelado no espaço do bloco removido.
2. **Given** um bloco foreground ainda presente, **When** o jogador olha para o terreno, **Then** o background não é visível (está atrás do foreground).
3. **Given** múltiplos blocos minerados adjacentes, **When** o jogador observa a área escavada, **Then** os backgrounds formam uma superfície visual contínua.

---

### User Story 2 - Horizon Distinguishes Surface from Underground (Priority: P2)

Como jogador, quero que o mundo tenha uma linha de horizonte clara que separa a superfície (com céu) do subterrâneo (com rocha de fundo), para que eu tenha orientação espacial e saiba onde estou no mundo.

**Why this priority**: O horizonte é essencial para futuras mecânicas (escalada, construção) mas a feature P1 funciona sem ele. Adiciona contexto visual importante.

**Independent Test**: Pode ser testado gerando um novo mundo e verificando visualmente a transição entre céu (acima) e caverna (abaixo) na linha do horizonte.

**Acceptance Scenarios**:

1. **Given** um novo mundo gerado, **When** o jogador observa áreas acima do nível do solo, **Then** o background permanente visível é céu (cor clara/azulada).
2. **Given** um novo mundo gerado, **When** o jogador observa áreas abaixo do nível do solo, **Then** o background permanente visível é rocha de caverna (cor escura).
3. **Given** a linha do horizonte, **When** o jogador escava na transição entre superfície e subterrâneo, **Then** a mudança de sky para cave background é visualmente clara.

---

### User Story 3 - Mineable Background Blocks (Priority: P3)

Como jogador, quero poder minerar os background blocks separadamente dos foreground blocks, para ter controle mais fino sobre a construção e permitir futuras mecânicas (como colocação de escadas).

**Why this priority**: Mineração de backgrounds é necessária para features futuras (escadas, construção), mas o jogo funciona sem isso inicialmente.

**Independent Test**: Pode ser testado selecionando um tile sem foreground e executando ação de minerar para remover o background.

**Acceptance Scenarios**:

1. **Given** um tile onde o foreground já foi minerado (apenas background visível), **When** o jogador designa esse tile para mineração, **Then** o background block é marcado como tarefa de mineração.
2. **Given** um gnome com tarefa de minerar background, **When** o gnome completa a mineração, **Then** o background block é removido, revelando o background permanente (sky ou cave).
3. **Given** um tile com foreground presente, **When** o jogador tenta minerar o background, **Then** o sistema minera o foreground primeiro (background não acessível enquanto foreground existir).

---

### Edge Cases

- O que acontece quando o jogador tenta minerar na borda do mundo? O background permanente (sky/cave) não pode ser minerado - apenas blocos de background construídos/naturais.
- Como o sistema lida com save/load? Tanto foreground quanto background grids devem ser persistidos corretamente.
- O que acontece se um bloco de background for destruído e não houver foreground? O background permanente (sky/cave) fica visível.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema DEVE renderizar três camadas visuais em ordem: background permanente (mais ao fundo), background blocks, foreground blocks (mais à frente).
- **FR-002**: Sistema DEVE gerar background blocks automaticamente junto com foreground blocks durante a criação do mundo.
- **FR-003**: Sistema DEVE definir uma linha de horizonte em uma posição Y fixa e configurável durante a geração do mundo.
- **FR-004**: Sistema DEVE exibir céu como background permanente acima do horizonte.
- **FR-005**: Sistema DEVE exibir rocha de caverna como background permanente abaixo do horizonte.
- **FR-006**: Quando um foreground block é minerado, o background block por trás DEVE se tornar visível.
- **FR-007**: Background blocks DEVEM ter aparência visual distinta (mais escura/dessaturada) dos foreground blocks do mesmo tipo.
- **FR-008**: Background blocks DEVEM ser mineráveis quando não há foreground block na frente.
- **FR-009**: Sistema DEVE persistir o estado dos background blocks ao salvar/carregar o jogo.
- **FR-010**: Background permanente (sky/cave) NÃO DEVE ser minerável ou modificável.

### Key Entities

- **Background Block**: Bloco na camada de background que pode ser minerado ou construído. Possui tipo (dirt, stone, etc.) e mesma durabilidade dos foreground blocks correspondentes.
- **Permanent Background**: Camada visual mais profunda que não pode ser modificada. Pode ser Sky (acima do horizonte) ou Cave (abaixo do horizonte).
- **Horizon**: Linha horizontal em posição Y configurável que divide o mundo em zona de superfície (acima) e subterrâneo (abaixo).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos blocos foreground minerados revelam um background visualmente distinto por trás.
- **SC-002**: A transição visual entre céu e caverna é identificável pelo jogador em menos de 2 segundos ao observar o horizonte.
- **SC-003**: Background blocks podem ser minerados com o mesmo fluxo de trabalho dos foreground blocks (sem nova UI necessária).
- **SC-004**: Performance de renderização mantém 60 FPS com até 10.000 tiles visíveis (foreground + background combinados).
- **SC-005**: Save/load preserva corretamente todos os background blocks sem perda de dados.

## Clarifications

### Session 2025-12-21

- Q: Qual a durabilidade dos background blocks comparada aos foreground? → A: Mesma durabilidade que foreground (1:1)
- Q: Como determinar a posição do horizonte? → A: Valor fixo configurável (ex: Y=20)

## Assumptions

- O horizonte é uma linha horizontal em posição Y configurável, fixa após geração do mundo (não dinâmica).
- Background blocks herdam os mesmos tipos de tile que foreground (Dirt, Stone) mas com visual diferenciado.
- Recursos não são dropados ao minerar background blocks (apenas foreground blocks geram recursos).
- A ordem de renderização é fixa: permanent background → background blocks → foreground blocks → entities → UI.
