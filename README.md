# OpenStates — Políticos dos EUA

Aplicação fullstack que consome dados públicos de pessoas em cargos políticos nos EUA usando a api [OpenStates API](https://v3.openstates.org/docs), armazena em cache localmente em PostgreSQL e exibe em uma interface web com filtros e scroll infinito.


## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/)
- Uma API Key do OpenStates — crie sua conta em [open.pluralpolicy.com](https://open.pluralpolicy.com/accounts/profile/) e gere o token

---

## Configuração do Ambiente

**1. Clone o repositório:**

```bash
git clone https://github.com/cauapdebiasi/interface-openstates.git
cd interface-openstates
```

**2. Crie os arquivos `.env`:**

Na raiz do **backend** (`backend/.env`):

```env
PORT=3000
DB_NAME=openstates_db
DB_USER=postgres
DB_PASS=postgres
DB_HOST=db
DB_PORT=5432
OPENSTATES_API_KEY=sua_chave_aqui
```

Na raiz do **frontend** (`frontend/.env`):

```env
VITE_API_URL=http://localhost:3000/api/v1
FRONTEND_PORT=5000
```

> Há um `.env.example` na raiz do projeto com todos os valores de referência.

---

## Executando com Docker Compose

Um único comando sobe os 3 containers (banco, backend e frontend):

```bash
docker compose up --build
```

Após a inicialização:

| Serviço      | URL                              |
| ------------ | -------------------------------- |
| **Frontend** | http://localhost:5000             |
| **Backend**  | http://localhost:3000/api/v1      |
| **Banco**    | `localhost:5432` (acesso direto)  |

Para parar:

```bash
docker compose down
```

Para limpar os dados do banco (volume):

```bash
docker compose down -v
```

---

## Executando Localmente (sem Docker)

Caso prefira rodar fora do Docker para desenvolvimento:

**Backend:**

```bash
cd backend
npm install
# Certifique-se de que o PostgreSQL está rodando e o .env aponta para ele
# (DB_HOST=localhost, DB_PORT=5432)
npm run dev
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Testes

**Backend:**

```bash
cd backend
npm test
```

**Frontend:**

```bash
cd frontend
npm test
```

---

## Tecnologias

| Camada       | Stack                                          |
| ------------ | ---------------------------------------------- |
| **Frontend** | React 19, TypeScript, Vite, Mantine UI, React Query |
| **Backend**  | Node.js, Express, TypeScript, Sequelize ORM    |
| **Banco**    | PostgreSQL 16                                  |
| **Infra**    | Docker, Docker Compose, Nginx                  |
| **Testes**   | Vitest                                         |

---

## Arquitetura

O backend funciona como um **cache ativo**: os dados da API externa são sincronizados em background (sob demanda ou por agendamento), e o frontend consome exclusivamente do banco local. Isso evita chamadas desnecessárias à API paga (que possui limite de requisições) e permite filtros e paginação performáticos.

---

## Endpoints da API

Todos os endpoints estão sob o prefixo `/api/v1`.

### Pessoas (`/people`)

| Método | Rota   | Descrição                             |
| ------ | ------ | ------------------------------------- |
| `GET`  | `/`    | Lista pessoas com paginação por cursor |

**Parâmetros de query em `GET /people`:**

| Parâmetro         | Tipo     | Descrição                                |
| ----------------- | -------- | ---------------------------------------- |
| `jurisdiction_id` | `string` | Filtra por ID da jurisdição              |
| `party`           | `string` | Filtra por partido                       |
| `cursor`          | `string` | Cursor para paginação                    |
| `limit`           | `number` | Itens por página (1-50, padrão: 30)      |

**Exemplo de resposta `GET /people`:**

```json
{
  "results": [
    {
      "id": "ocd-person/...",
      "name": "John Doe",
      "role_title": "Senator",
      "party": "Democratic",
      "gender": "male",
      "birth_date": "1960-05-04",
      "death_date": null,
      "jurisdiction_id": "ocd-jurisdiction/...",
      "jurisdiction": {
        "id": "ocd-jurisdiction/...",
        "name": "Texas"
      },
      "image": "https://..."
    }
  ],
  "pagination": {
    "next_cursor": "eyJuYW1lIjoiSm9obiIsImlkIjoiMTIzIn0="
  }
}
```

### Estados (`/states`)

| Método | Rota   | Descrição                               |
| ------ | ------ | --------------------------------------- |
| `GET`  | `/`    | Lista jurisdições (estados) disponíveis |

### Partidos (`/parties`)

| Método | Rota   | Descrição                  |
| ------ | ------ | -------------------------- |
| `GET`  | `/`    | Lista partidos disponíveis |

### Sincronização (`/people`)

| Método | Rota              | Descrição                                    |
| ------ | ----------------- | -------------------------------------------- |
| `POST` | `/sync`           | Dispara sincronização em background          |
| `GET`  | `/sync/schedule`  | Retorna frequência de agendamento atual      |
| `PUT`  | `/sync/schedule`  | Atualiza frequência de agendamento           |

**Frequências de agendamento válidas:** `none`, `hourly`, `daily`, `every2days`, `every3days`, `weekly`
