--
-- PostgreSQL database dump
--

\restrict Rye2wc2UyLjGGkPa0GYjh6ITPrfpDCzGrB1Erp1GzSJzbcJnbXPBrfachHY6UOQ

-- Dumped from database version 14.20 (Debian 14.20-1.pgdg13+1)
-- Dumped by pg_dump version 14.20 (Debian 14.20-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: EstadoDevolucao; Type: TYPE; Schema: public; Owner: carolina
--

CREATE TYPE public."EstadoDevolucao" AS ENUM (
    'PENDENTE',
    'PROCESSADA',
    'CANCELADA'
);


ALTER TYPE public."EstadoDevolucao" OWNER TO carolina;

--
-- Name: EstadoOrcamento; Type: TYPE; Schema: public; Owner: carolina
--

CREATE TYPE public."EstadoOrcamento" AS ENUM (
    'RASCUNHO',
    'ENVIADO',
    'ACEITE',
    'REJEITADO',
    'EXPIRADO'
);


ALTER TYPE public."EstadoOrcamento" OWNER TO carolina;

--
-- Name: EstadoPipeline; Type: TYPE; Schema: public; Owner: carolina
--

CREATE TYPE public."EstadoPipeline" AS ENUM (
    'NOVO',
    'CONTACTADO',
    'REUNIAO',
    'PROPOSTA',
    'NEGOCIACAO',
    'GANHO',
    'PERDIDO'
);


ALTER TYPE public."EstadoPipeline" OWNER TO carolina;

--
-- Name: EstadoReconciliacao; Type: TYPE; Schema: public; Owner: carolina
--

CREATE TYPE public."EstadoReconciliacao" AS ENUM (
    'PENDENTE',
    'EM_REVISAO',
    'APROVADA',
    'COM_PROBLEMAS'
);


ALTER TYPE public."EstadoReconciliacao" OWNER TO carolina;

--
-- Name: EstadoTarefa; Type: TYPE; Schema: public; Owner: carolina
--

CREATE TYPE public."EstadoTarefa" AS ENUM (
    'PENDENTE',
    'EM_PROGRESSO',
    'CONCLUIDA',
    'CANCELADA'
);


ALTER TYPE public."EstadoTarefa" OWNER TO carolina;

--
-- Name: PrioridadeTarefa; Type: TYPE; Schema: public; Owner: carolina
--

CREATE TYPE public."PrioridadeTarefa" AS ENUM (
    'BAIXA',
    'MEDIA',
    'ALTA',
    'URGENTE'
);


ALTER TYPE public."PrioridadeTarefa" OWNER TO carolina;

--
-- Name: SegmentoCliente; Type: TYPE; Schema: public; Owner: carolina
--

CREATE TYPE public."SegmentoCliente" AS ENUM (
    'A',
    'B',
    'C'
);


ALTER TYPE public."SegmentoCliente" OWNER TO carolina;

--
-- Name: TipoAmostra; Type: TYPE; Schema: public; Owner: carolina
--

CREATE TYPE public."TipoAmostra" AS ENUM (
    'AMOSTRA',
    'BRINDE',
    'DEMONSTRACAO'
);


ALTER TYPE public."TipoAmostra" OWNER TO carolina;

--
-- Name: TipoComunicacao; Type: TYPE; Schema: public; Owner: carolina
--

CREATE TYPE public."TipoComunicacao" AS ENUM (
    'TELEFONEMA',
    'EMAIL',
    'VISITA',
    'WHATSAPP',
    'REUNIAO',
    'OUTRO'
);


ALTER TYPE public."TipoComunicacao" OWNER TO carolina;

--
-- Name: TipoDiscrepancia; Type: TYPE; Schema: public; Owner: carolina
--

CREATE TYPE public."TipoDiscrepancia" AS ENUM (
    'VALOR_DIFERENTE',
    'CLIENTE_NAO_EXISTE',
    'VENDA_NAO_EXISTE',
    'VENDA_EXTRA'
);


ALTER TYPE public."TipoDiscrepancia" OWNER TO carolina;

--
-- Name: TipoNotificacao; Type: TYPE; Schema: public; Owner: carolina
--

CREATE TYPE public."TipoNotificacao" AS ENUM (
    'PAGAMENTO_ATRASADO',
    'TAREFA_VENCIDA',
    'TAREFA_HOJE',
    'LEAD_PARADO',
    'CLIENTE_SEM_CONTACTO',
    'FORECAST_ALERT',
    'HEALTH_ALERT'
);


ALTER TYPE public."TipoNotificacao" OWNER TO carolina;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: carolina
--

CREATE TYPE public."UserRole" AS ENUM (
    'MASTERADMIN',
    'ADMIN',
    'SELLER'
);


ALTER TYPE public."UserRole" OWNER TO carolina;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: carolina
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PENDING'
);


ALTER TYPE public."UserStatus" OWNER TO carolina;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AcordoParceria; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."AcordoParceria" (
    id text NOT NULL,
    "clienteId" text NOT NULL,
    "valorAnual" numeric(10,2) NOT NULL,
    ano integer NOT NULL,
    "dataInicio" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dataFim" timestamp(3) without time zone,
    ativo boolean DEFAULT true NOT NULL,
    notas text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AcordoParceria" OWNER TO carolina;

--
-- Name: Amostra; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Amostra" (
    id text NOT NULL,
    "clienteId" text,
    "prospectoId" text,
    "produtoId" text,
    tipo public."TipoAmostra" DEFAULT 'AMOSTRA'::public."TipoAmostra" NOT NULL,
    descricao text,
    quantidade integer DEFAULT 1 NOT NULL,
    "valorEstimado" numeric(10,2),
    "dataEntrega" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notas text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text
);


ALTER TABLE public."Amostra" OWNER TO carolina;

--
-- Name: Campanha; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Campanha" (
    id text NOT NULL,
    titulo text NOT NULL,
    descricao text,
    mes integer NOT NULL,
    ano integer NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text
);


ALTER TABLE public."Campanha" OWNER TO carolina;

--
-- Name: CampanhaProduto; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."CampanhaProduto" (
    id text NOT NULL,
    "campanhaId" text NOT NULL,
    "produtoId" text,
    nome text NOT NULL,
    "precoUnit" numeric(10,2) NOT NULL,
    quantidade integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CampanhaProduto" OWNER TO carolina;

--
-- Name: CampanhaVenda; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."CampanhaVenda" (
    id text NOT NULL,
    "campanhaId" text NOT NULL,
    "vendaId" text NOT NULL,
    quantidade integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CampanhaVenda" OWNER TO carolina;

--
-- Name: Cliente; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Cliente" (
    id text NOT NULL,
    nome text NOT NULL,
    codigo text,
    telefone text,
    email text,
    morada text,
    notas text,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ultimoContacto" timestamp(3) without time zone,
    cidade text,
    "codigoPostal" text,
    latitude double precision,
    longitude double precision,
    "userId" text
);


ALTER TABLE public."Cliente" OWNER TO carolina;

--
-- Name: ClienteHealth; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ClienteHealth" (
    id text NOT NULL,
    "clienteId" text NOT NULL,
    "scoreGeral" integer DEFAULT 50 NOT NULL,
    "scorePagamento" integer DEFAULT 50 NOT NULL,
    "scoreEngajamento" integer DEFAULT 50 NOT NULL,
    "scoreCompras" integer DEFAULT 50 NOT NULL,
    risco text DEFAULT 'MEDIO'::text NOT NULL,
    tendencia text DEFAULT 'ESTAVEL'::text NOT NULL,
    "ultimaAtualizacao" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ClienteHealth" OWNER TO carolina;

--
-- Name: ClienteInsight; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ClienteInsight" (
    id text NOT NULL,
    "clienteId" text NOT NULL,
    insights jsonb NOT NULL,
    provider text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ClienteInsight" OWNER TO carolina;

--
-- Name: ClienteSegmento; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ClienteSegmento" (
    id text NOT NULL,
    "clienteId" text NOT NULL,
    segmento public."SegmentoCliente" DEFAULT 'C'::public."SegmentoCliente" NOT NULL,
    tags text[],
    "potencialMensal" numeric(10,2),
    notas text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ClienteSegmento" OWNER TO carolina;

--
-- Name: Cobranca; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Cobranca" (
    id text NOT NULL,
    "clienteId" text NOT NULL,
    fatura text,
    valor numeric(10,2) NOT NULL,
    "valorSemIva" numeric(10,2),
    comissao numeric(10,2),
    "dataEmissao" timestamp(3) without time zone,
    "dataPago" timestamp(3) without time zone,
    pago boolean DEFAULT false NOT NULL,
    notas text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "dataInicioVencimento" timestamp(3) without time zone,
    "numeroParcelas" integer DEFAULT 1 NOT NULL,
    "vendaId" text
);


ALTER TABLE public."Cobranca" OWNER TO carolina;

--
-- Name: Comunicacao; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Comunicacao" (
    id text NOT NULL,
    "clienteId" text,
    "prospectoId" text,
    tipo public."TipoComunicacao" NOT NULL,
    assunto text,
    notas text,
    "dataContacto" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    duracao integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text
);


ALTER TABLE public."Comunicacao" OWNER TO carolina;

--
-- Name: Configuracao; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Configuracao" (
    id text NOT NULL,
    chave text NOT NULL,
    valor text NOT NULL,
    descricao text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Configuracao" OWNER TO carolina;

--
-- Name: Devolucao; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Devolucao" (
    id text NOT NULL,
    "vendaId" text NOT NULL,
    "dataRegisto" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    motivo text,
    "totalDevolvido" numeric(10,2) NOT NULL,
    "totalSubstituido" numeric(10,2) DEFAULT 0 NOT NULL,
    estado public."EstadoDevolucao" DEFAULT 'PENDENTE'::public."EstadoDevolucao" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Devolucao" OWNER TO carolina;

--
-- Name: ImagemDevolucao; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ImagemDevolucao" (
    id text NOT NULL,
    "devolucaoId" text NOT NULL,
    caminho text NOT NULL,
    "nomeOriginal" text NOT NULL,
    tamanho integer NOT NULL,
    tipo text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ImagemDevolucao" OWNER TO carolina;

--
-- Name: ImpersonationLog; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ImpersonationLog" (
    id text NOT NULL,
    "impersonatorId" text NOT NULL,
    "impersonatedUserId" text NOT NULL,
    "impersonatedEmail" text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endedAt" timestamp(3) without time zone
);


ALTER TABLE public."ImpersonationLog" OWNER TO carolina;

--
-- Name: ItemDevolucao; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ItemDevolucao" (
    id text NOT NULL,
    "devolucaoId" text NOT NULL,
    "itemVendaId" text NOT NULL,
    quantidade numeric(10,2) NOT NULL,
    "valorUnitario" numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    motivo text NOT NULL,
    "substituicaoId" text,
    "qtdSubstituicao" numeric(10,2),
    "precoSubstituicao" numeric(10,2),
    "subtotalSubstituicao" numeric(10,2),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ItemDevolucao" OWNER TO carolina;

--
-- Name: ItemOrcamento; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ItemOrcamento" (
    id text NOT NULL,
    "orcamentoId" text NOT NULL,
    "produtoId" text,
    descricao text NOT NULL,
    quantidade numeric(10,2) NOT NULL,
    "precoUnit" numeric(10,2) NOT NULL,
    desconto numeric(10,2) DEFAULT 0 NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ItemOrcamento" OWNER TO carolina;

--
-- Name: ItemReconciliacao; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ItemReconciliacao" (
    id text NOT NULL,
    "reconciliacaoId" text NOT NULL,
    "codigoClientePdf" text NOT NULL,
    "nomeClientePdf" text NOT NULL,
    "valorBrutoPdf" numeric(10,2) NOT NULL,
    "descontoPdf" numeric(10,2) NOT NULL,
    "valorLiquidoPdf" numeric(10,2) NOT NULL,
    "clienteId" text,
    "vendaId" text,
    "valorSistema" numeric(10,2),
    corresponde boolean DEFAULT false NOT NULL,
    "tipoDiscrepancia" public."TipoDiscrepancia",
    "diferencaValor" numeric(10,2),
    resolvido boolean DEFAULT false NOT NULL,
    "notaResolucao" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ItemReconciliacao" OWNER TO carolina;

--
-- Name: ItemVenda; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ItemVenda" (
    id text NOT NULL,
    "vendaId" text NOT NULL,
    "produtoId" text NOT NULL,
    quantidade numeric(10,2) NOT NULL,
    "precoUnit" numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ItemVenda" OWNER TO carolina;

--
-- Name: MoodEntry; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."MoodEntry" (
    id text NOT NULL,
    date text NOT NULL,
    rating integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text
);


ALTER TABLE public."MoodEntry" OWNER TO carolina;

--
-- Name: Notificacao; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Notificacao" (
    id text NOT NULL,
    tipo public."TipoNotificacao" NOT NULL,
    titulo text NOT NULL,
    mensagem text NOT NULL,
    lida boolean DEFAULT false NOT NULL,
    "clienteId" text,
    "prospectoId" text,
    "tarefaId" text,
    "parcelaId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readAt" timestamp(3) without time zone
);


ALTER TABLE public."Notificacao" OWNER TO carolina;

--
-- Name: ObjetivoAnual; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ObjetivoAnual" (
    id text NOT NULL,
    ano integer NOT NULL,
    objetivo numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ObjetivoAnual" OWNER TO carolina;

--
-- Name: ObjetivoMensal; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ObjetivoMensal" (
    id text NOT NULL,
    mes integer NOT NULL,
    ano integer NOT NULL,
    objetivo numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ObjetivoMensal" OWNER TO carolina;

--
-- Name: ObjetivoTrimestral; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ObjetivoTrimestral" (
    id text NOT NULL,
    trimestre integer NOT NULL,
    ano integer NOT NULL,
    objetivo numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ObjetivoTrimestral" OWNER TO carolina;

--
-- Name: ObjetivoVario; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ObjetivoVario" (
    id text NOT NULL,
    "userId" text,
    titulo text NOT NULL,
    descricao text,
    mes integer NOT NULL,
    ano integer NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ObjetivoVario" OWNER TO carolina;

--
-- Name: ObjetivoVarioProduto; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ObjetivoVarioProduto" (
    id text NOT NULL,
    "objetivoVarioId" text NOT NULL,
    "produtoId" text,
    nome text NOT NULL,
    "precoSemIva" numeric(10,2) NOT NULL,
    quantidade integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ObjetivoVarioProduto" OWNER TO carolina;

--
-- Name: Orcamento; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Orcamento" (
    id text NOT NULL,
    numero text NOT NULL,
    "prospectoId" text,
    "clienteId" text,
    titulo text,
    introducao text,
    condicoes text,
    "validadeDias" integer DEFAULT 30 NOT NULL,
    "dataEmissao" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dataValidade" timestamp(3) without time zone,
    subtotal numeric(10,2) NOT NULL,
    desconto numeric(10,2) DEFAULT 0 NOT NULL,
    iva numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    estado public."EstadoOrcamento" DEFAULT 'RASCUNHO'::public."EstadoOrcamento" NOT NULL,
    notas text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text
);


ALTER TABLE public."Orcamento" OWNER TO carolina;

--
-- Name: Parcela; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Parcela" (
    id text NOT NULL,
    "cobrancaId" text NOT NULL,
    numero integer NOT NULL,
    valor numeric(10,2) NOT NULL,
    "dataVencimento" timestamp(3) without time zone NOT NULL,
    "dataPago" timestamp(3) without time zone,
    pago boolean DEFAULT false NOT NULL,
    notas text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Parcela" OWNER TO carolina;

--
-- Name: PremioAnual; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."PremioAnual" (
    id text NOT NULL,
    minimo numeric(10,2) NOT NULL,
    premio numeric(10,2) NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PremioAnual" OWNER TO carolina;

--
-- Name: PremioMensal; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."PremioMensal" (
    id text NOT NULL,
    minimo numeric(10,2) NOT NULL,
    premio numeric(10,2) NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PremioMensal" OWNER TO carolina;

--
-- Name: PremioTrimestral; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."PremioTrimestral" (
    id text NOT NULL,
    minimo numeric(10,2) NOT NULL,
    premio numeric(10,2) NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PremioTrimestral" OWNER TO carolina;

--
-- Name: PrevisaoVendas; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."PrevisaoVendas" (
    id text NOT NULL,
    mes integer NOT NULL,
    ano integer NOT NULL,
    "previsaoBase" numeric(10,2) NOT NULL,
    "previsaoPipeline" numeric(10,2) NOT NULL,
    "previsaoTotal" numeric(10,2) NOT NULL,
    confianca integer DEFAULT 70 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PrevisaoVendas" OWNER TO carolina;

--
-- Name: Produto; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Produto" (
    id text NOT NULL,
    nome text NOT NULL,
    codigo text,
    categoria text,
    descricao text,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    preco numeric(10,2),
    tipo text
);


ALTER TABLE public."Produto" OWNER TO carolina;

--
-- Name: Prospecto; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Prospecto" (
    id text NOT NULL,
    "nomeEmpresa" text NOT NULL,
    "tipoNegocio" text,
    website text,
    facebook text,
    instagram text,
    "nomeContacto" text,
    "cargoContacto" text,
    telefone text,
    email text,
    morada text,
    cidade text,
    "codigoPostal" text,
    latitude double precision,
    longitude double precision,
    estado public."EstadoPipeline" DEFAULT 'NOVO'::public."EstadoPipeline" NOT NULL,
    "dataUltimoContacto" timestamp(3) without time zone,
    "proximaAccao" text,
    "dataProximaAccao" timestamp(3) without time zone,
    notas text,
    fonte text,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text
);


ALTER TABLE public."Prospecto" OWNER TO carolina;

--
-- Name: ProspectoTactic; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ProspectoTactic" (
    id text NOT NULL,
    "prospectoId" text NOT NULL,
    tactics jsonb NOT NULL,
    provider text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProspectoTactic" OWNER TO carolina;

--
-- Name: ReconciliacaoMensal; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."ReconciliacaoMensal" (
    id text NOT NULL,
    mes integer NOT NULL,
    ano integer NOT NULL,
    "nomeArquivo" text NOT NULL,
    "caminhoArquivo" text NOT NULL,
    "dataInicio" timestamp(3) without time zone,
    "dataFim" timestamp(3) without time zone,
    "totalBrutoPdf" numeric(10,2) NOT NULL,
    "totalDescontosPdf" numeric(10,2) NOT NULL,
    "totalLiquidoPdf" numeric(10,2) NOT NULL,
    "totalSistema" numeric(10,2) NOT NULL,
    diferenca numeric(10,2) DEFAULT 0 NOT NULL,
    "totalItens" integer NOT NULL,
    "itensCorretos" integer DEFAULT 0 NOT NULL,
    "itensComProblema" integer DEFAULT 0 NOT NULL,
    estado public."EstadoReconciliacao" DEFAULT 'PENDENTE'::public."EstadoReconciliacao" NOT NULL,
    notas text,
    "dataUpload" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dataRevisao" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ReconciliacaoMensal" OWNER TO carolina;

--
-- Name: RotaSalva; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."RotaSalva" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    nome text,
    data timestamp without time zone NOT NULL,
    "origemLatitude" double precision NOT NULL,
    "origemLongitude" double precision NOT NULL,
    "origemEndereco" text,
    locais jsonb NOT NULL,
    "distanciaTotal" text,
    "duracaoTotal" text,
    concluida boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT now(),
    "updatedAt" timestamp without time zone DEFAULT now(),
    paragens jsonb,
    "custoPortagens" numeric(10,2),
    "numPortagens" integer,
    "custoCombuistivel" numeric(10,2),
    "consumoMedio" numeric(4,1),
    "precoLitro" numeric(4,3),
    "custoEstacionamento" numeric(10,2),
    "custoTotal" numeric(10,2),
    "custoReal" numeric(10,2),
    "notasCustos" text,
    "userId" text
);


ALTER TABLE public."RotaSalva" OWNER TO carolina;

--
-- Name: Tarefa; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Tarefa" (
    id text NOT NULL,
    titulo text NOT NULL,
    descricao text,
    tipo text,
    prioridade public."PrioridadeTarefa" DEFAULT 'MEDIA'::public."PrioridadeTarefa" NOT NULL,
    estado public."EstadoTarefa" DEFAULT 'PENDENTE'::public."EstadoTarefa" NOT NULL,
    "dataVencimento" timestamp(3) without time zone,
    "dataLembrete" timestamp(3) without time zone,
    "dataConclusao" timestamp(3) without time zone,
    "clienteId" text,
    "prospectoId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text
);


ALTER TABLE public."Tarefa" OWNER TO carolina;

--
-- Name: User; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text NOT NULL,
    password text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    role public."UserRole" DEFAULT 'SELLER'::public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'PENDING'::public."UserStatus" NOT NULL
);


ALTER TABLE public."User" OWNER TO carolina;

--
-- Name: Venda; Type: TABLE; Schema: public; Owner: carolina
--

CREATE TABLE public."Venda" (
    id text NOT NULL,
    "clienteId" text NOT NULL,
    valor1 numeric(10,2),
    valor2 numeric(10,2),
    total numeric(10,2) NOT NULL,
    mes integer NOT NULL,
    ano integer NOT NULL,
    notas text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "objetivoVarioId" text
);


ALTER TABLE public."Venda" OWNER TO carolina;

--
-- Data for Name: AcordoParceria; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."AcordoParceria" (id, "clienteId", "valorAnual", ano, "dataInicio", "dataFim", ativo, notas, "createdAt", "updatedAt") FROM stdin;
cml03os3r000001wlinnw4f91	cmkk41coe000301vjs2ey859r	123.00	2026	2026-01-29 23:54:41.181	2026-01-29 23:54:44.476	f	\N	2026-01-29 23:43:54.179	2026-01-29 23:54:44.481
cml04cmxk00af0115jcml5i2a	cmkd6qsu40002cyntmtwkbs8f	6180.00	2026	2026-01-30 00:02:27.219	\N	t	Oferta de 8% em fatura	2026-01-30 00:02:27.219	2026-01-30 00:02:27.219
\.


--
-- Data for Name: Amostra; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Amostra" (id, "clienteId", "prospectoId", "produtoId", tipo, descricao, quantidade, "valorEstimado", "dataEntrega", notas, "createdAt", "updatedAt", "userId") FROM stdin;
cmky2zvjj005d01zsu2m7wbo8	cmkd6qsw4000xcyntvgwmxu3v	\N	\N	AMOSTRA	Bata L	1	\N	2026-01-28 13:48:59.85		2026-01-28 13:48:59.858	2026-01-28 13:48:59.858	cmkcnpx190000ogntlfp1peol
\.


--
-- Data for Name: Campanha; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Campanha" (id, titulo, descricao, mes, ano, ativo, "createdAt", "updatedAt", "userId") FROM stdin;
cmkylb5gb006m0101754x4jb1	Kit 70 anos	valor 86.39€\nvalor v.p 167.40€	1	2026	t	2026-01-28 22:21:39.035	2026-01-28 22:21:39.035	cmkcnpx190000ogntlfp1peol
cmkyle3f0006n0101ahzcoey1	Kit Limpeza	6+1 livre preço 25.97€  v.p 60.45€\npreço 31,16€  v.p 67.22€	1	2026	t	2026-01-28 22:23:56.364	2026-01-28 22:23:56.364	cmkcnpx190000ogntlfp1peol
cmkylgx36006o01017pg80v6b	Easter Egg  - Ampolas	5+1 peço 31.17€  v.p 72.55€\npreço 37.40€  v.p 85.98€	1	2026	t	2026-01-28 22:26:08.13	2026-01-28 23:10:52.3	cmkcnpx190000ogntlfp1peol
\.


--
-- Data for Name: CampanhaProduto; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."CampanhaProduto" (id, "campanhaId", "produtoId", nome, "precoUnit", quantidade, "createdAt") FROM stdin;
\.


--
-- Data for Name: CampanhaVenda; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."CampanhaVenda" (id, "campanhaId", "vendaId", quantidade, "createdAt") FROM stdin;
cmkylq70q000201x6g5iapjfh	cmkyle3f0006n0101ahzcoey1	cmkom9f8g002d01wma0sakbhs	6	2026-01-28 22:33:20.906
cmkzw54dm001e01w4lkj09wp3	cmkylb5gb006m0101754x4jb1	cmkzw54bj001a01w4ihm1uiaz	1	2026-01-29 20:12:39.658
cmkzw54dm001f01w4xx1pi2dp	cmkylgx36006o01017pg80v6b	cmkzw54bj001a01w4ihm1uiaz	2	2026-01-29 20:12:39.658
\.


--
-- Data for Name: Cliente; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Cliente" (id, nome, codigo, telefone, email, morada, notas, ativo, "createdAt", "updatedAt", "ultimoContacto", cidade, "codigoPostal", latitude, longitude, "userId") FROM stdin;
cmkd6qsuy000fcynt35aeoahl	KRISTELL DA GRAÇA RODRIGUES RIBEIRO	07099	919523013	krystel.rodrigues@gmail.com	Rua de São Cristóvão 10  	\N	t	2026-01-13 22:50:45.274	2026-01-22 21:12:26.521	\N	Caranguejeira	2420-104	39.7435073	-8.7033052	cmkcnpx190000ogntlfp1peol
cmkcnpx5p0019ognt0dfjus98	PAULA SANTANA	16232	932196123	pauladantana1972@gmail.com	Av.Salgado Azenha 14, St.Antonio dos Cavaleiros 2660-327 Loures	\N	t	2026-01-13 13:58:11.485	2026-01-18 19:28:03.713	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkcnpx3c000hogntfv3f1nr9	Pura Beleza	15409	\N	\N	\N	\N	t	2026-01-13 13:58:11.4	2026-01-13 13:58:11.4	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkcnpx4n0010ogntlgsvrd29	IVONE RAMOS	15681	914171212	ramosivone2009@gmail.com	Rua Vitor Cordon 1B  	\N	t	2026-01-13 13:58:11.447	2026-01-22 21:26:14.891	\N	Mafra	2650-539	38.9382739	-9.3303117	cmkcnpx190000ogntlfp1peol
cmkk57s2v000f01vjpcw5edlt	SANDRA LUZ - DEZ STUDIO	3661	\N	\N	\N	\N	t	2026-01-18 19:42:21.414	2026-01-18 19:42:21.414	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkk3ocbv000101vjx115msl5	ANA CRISTINA CHAGAS	10190	934268927	cablumsantana1968@gmail.com	Rua D.Luis de Ataide 90 2520-294 Peniche	\N	t	2026-01-18 18:59:14.922	2026-01-21 08:51:36.78	\N	\N	\N	39.3589461	-9.379595	cmkcnpx190000ogntlfp1peol
cmkcnpx38000fognt09x3o61e	GLAMOUR	15198	969053955	suzimartins2@hotmail.com	Av.Descobertas 84D 2670-457 Loures	\N	t	2026-01-13 13:58:11.396	2026-01-21 08:51:38.678	\N	\N	\N	38.8368131	-9.1570613	cmkcnpx190000ogntlfp1peol
cmkomlf4i002j01wmrnup3tb8	Olga Pimentel	5036	\N	\N	\N	\N	t	2026-01-21 22:59:55.985	2026-01-21 22:59:55.985	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd6qsv7000jcynt6h6r7zv4	NUTRILEIRIA UNIPESSOAL LDA	07400	244814100	\N	\N	\N	t	2026-01-13 22:50:45.283	2026-01-13 22:50:45.283	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd6qsva000kcyntjc5a49nb	SUSANA ISABEL ALMEIDA RODRIGUES PINTO	07487	\N	\N	\N	\N	t	2026-01-13 22:50:45.286	2026-01-13 22:50:45.286	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkk3uyw5000201vjvh49g3fi	ELISABETE COSTA	14190	968922266	\N	Av. Sidónio Pais N20 1050-215 Lisboa	Encerra 2a feira	t	2026-01-18 19:04:24.101	2026-01-21 08:51:55.262	\N	\N	\N	38.7317725	-9.153014	cmkcnpx190000ogntlfp1peol
cmkd6qsvx000vcyntcezpxzo8	SUSANA LOPES CABELEIREIROS LDA	14481	234386136	geral@susanalopes.pt	Rua do Senhor dos Aflitos 3800 Aveiro	\N	t	2026-01-13 22:50:45.309	2026-01-21 08:51:56.132	\N	\N	\N	40.6415652	-8.6422889	cmkcnpx190000ogntlfp1peol
cmkk4k9ba000501vj4ybqtwvg	FILIPA DANIELA PEREIRA	15729	918399208	f.daniela.rei@gmail.com	Av. José Estevão  126 3830-556 Gafanha da Nazaré 	\N	t	2026-01-18 19:24:04.005	2026-01-21 08:51:40.596	\N	\N	\N	40.6360372	-8.6949349	cmkcnpx190000ogntlfp1peol
cmkcnpx3g000jogntg4abd8u8	FISIBELA	16415	968900346	mj.oasisdocorpo@hotmail.com	Largo José Afonso 4H 2720-046 Olival Basto	\N	t	2026-01-13 13:58:11.404	2026-01-21 08:51:42.818	\N	\N	\N	38.7905246	-9.1633122	cmkcnpx190000ogntlfp1peol
cmkd6qsun000acyntg6r2psqb	ANDREIA DORIA ALVES ALFREDO BENTO	05290	964447138	andreia.gui.ab@gmail.com	Av.Gomes Pereira 54B 1500-331 Benfica	\N	t	2026-01-13 22:50:45.263	2026-01-21 08:51:45.011	\N	\N	\N	38.7467621	-9.1978645	cmkcnpx190000ogntlfp1peol
cmkcnpxa3002bogntjck4ynlc	JOANA SIMÕES 	7248	914843517	joana.simoes-@hotmaim.com	Rua Comandante Carvalho Araújo 90C 2680-356 Loures	Encerra 2a feira	t	2026-01-13 13:58:11.643	2026-01-21 08:51:50.396	\N	\N	\N	38.8676337	-9.1832533	cmkcnpx190000ogntlfp1peol
cmkcnpx5x001bognt92v67fth	ANA CAMEIRA	8397	930414238	anacameiraxunga@gmail.com	Rua Vieira da Silva N 17 B- Quinta Nova 2675-214 Odivelas	\N	t	2026-01-13 13:58:11.493	2026-01-21 08:51:54.762	\N	\N	\N	38.80024	-9.1774479	cmkcnpx190000ogntlfp1peol
cmkcnpx4c000wogntmcv0avh1	SETIMA ESSENCIA- CELIA VICENTE	7643	937780807	celiafvicente@gmail.com	Rua Dr.Orlando de Oliveira 9	Encerra 2a feira	t	2026-01-13 13:58:11.436	2026-01-22 21:11:58.671	\N	aveiro	3800-017	40.6382542	-8.6389263	cmkcnpx190000ogntlfp1peol
cmkcnpxd40038ogntjuwfp2oj	SPIRIT DAY SPA- MELISSA	8118	934206786	melissa.l.dias@gmail.com	AV. Magalhães Coutinho 9  	\N	t	2026-01-13 13:58:11.752	2026-01-22 21:27:47.207	\N	Odivelas	2675-654 	38.7918	-9.1934951	cmkcnpx190000ogntlfp1peol
cmkd6qsur000ccyntanbgl2cn	TERESA LEONOR FAIA PEREIRA	06394	965721888	teresa_lp28@hotmail.com	Av.Elias Garcia 20A 	Trabalha só as manhãs \nEncerra 2a feira	t	2026-01-13 22:50:45.267	2026-01-22 21:28:12.782	\N	Lisboa	1000-149	38.7397787	-9.1434886	cmkcnpx190000ogntlfp1peol
cmkcnpx500013ogntjiccf4oy	SILVIA RODRIGUES NETO	5607	917616011	geral@silvanetto.pt	Rua António Leal D'ascençăo 34A  	Compra ampolas e mascaras de cabine	t	2026-01-13 13:58:11.46	2026-01-22 21:30:26.351	\N	Torres Vedras	2560-364	39.086802	-9.2610687	cmkcnpx190000ogntlfp1peol
cmkk41coe000301vjs2ey859r	AGILREQUINTE	14241	916118557	elelageral@gmail.com	Av.Visconde Valongo 10 6270-481 Seia	Cliente start up 2025\nEncerra 2a feira 	t	2026-01-18 19:09:21.901	2026-01-26 15:13:31.613	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd2khtw0003pontk0fsp8w4	Silkare	\N	\N	\N	\N	\N	t	2026-01-13 20:53:52.58	2026-01-13 20:53:52.58	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd2khu20005pontjgu03va8	Isaura	\N	\N	\N	\N	\N	t	2026-01-13 20:53:52.586	2026-01-13 20:53:52.586	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd6qsti0000cynty9veowk8	MARIA TERESA PINHO DUARTE	00036	262832745	\N	\N	\N	t	2026-01-13 22:50:45.222	2026-01-13 22:50:45.222	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd6qstz0001cynts3nac09o	TRINDADE DA COSTA LUIS	00055	262841072	\N	\N	\N	t	2026-01-13 22:50:45.239	2026-01-13 22:50:45.239	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd6qsu40002cyntmtwkbs8f	PAULA GRACA J.SILVA	00148	918721574	\N	\N	\N	t	2026-01-13 22:50:45.244	2026-01-13 22:50:45.244	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd6qsu70003cyntf50v98ro	INSTITUTO DE BELEZA CAB.LDA	00538	219430009	\N	\N	\N	t	2026-01-13 22:50:45.246	2026-01-13 22:50:45.246	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd6qsu90004cyntoujdyvh6	LURDES MARTA-ESTETICA E PERFUMARIA, LDA.	00918	232435916	\N	\N	\N	t	2026-01-13 22:50:45.249	2026-01-13 22:50:45.249	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd6qsug0007cynt78amxldi	LUCIA BATISTA UNIPESSOAL LDA	04166	967916563	\N	\N	\N	t	2026-01-13 22:50:45.256	2026-01-13 22:50:45.256	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd6qsui0008cynt0g8nss02	ANA MARIA MAIA VILAS	04184	239472908	\N	\N	\N	t	2026-01-13 22:50:45.258	2026-01-13 22:50:45.258	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd6qsvz000wcynt9w0ybvrb	CUIDAME CABELEIREIRO E ESTÉTICA, UNIP. LDA	14689	938304159	catia.mariamenina@hotmail.com	Av.da Liberdade 11B 2620-310 Odivelas	\N	t	2026-01-13 22:50:45.311	2026-01-21 08:51:58.535	\N	\N	\N	38.805693	-9.1851782	cmkcnpx190000ogntlfp1peol
cmkd6qsvi000ocyntovbzv27e	LA DONNA - ESTETICA & CABELEIREIRO UNIPESSOAL LDA	09927	918307523	dina.e.dias@gmail.com	AV. Madre Andaluz 6B 2000-210 Santarém 	Encerra 2a feira 	t	2026-01-13 22:50:45.294	2026-01-18 18:54:10.926	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd6qsvc000lcyntxxe35xnx	HELENA CRISTINA F. MATEUS	07542	931103959	\N	\N	\N	t	2026-01-13 22:50:45.288	2026-01-18 18:54:51.907	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkk4mqro000601vjd06qdwnb	Neuza Godinho	15738	910162333	revitilizeyourbodyclinic@gmail.com	Rua da Palmeira 13, S.Bernardo 3810-089 Aveiro	\N	t	2026-01-18 19:25:59.94	2026-01-21 08:51:59.619	\N	\N	\N	40.6187633	-8.6253874	cmkcnpx190000ogntlfp1peol
cmkd6qsw4000xcyntvgwmxu3v	CRISTINA   BRITO	16687	913355305	tijuca.brito@hotmail.com	Rua 25 de Abril Mangualde	\N	t	2026-01-13 22:50:45.316	2026-01-21 08:52:00.171	\N	\N	\N	40.6078794	-7.6842712	cmkcnpx190000ogntlfp1peol
cmkomhy8g002g01wm3kbc57ck	Olivia Almeida	168	968489491	\N	\N	\N	t	2026-01-21 22:57:14.128	2026-01-21 22:57:14.128	\N	Viseu	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd6qsul0009cynts5akpdj7	ANABELA DOMINGUES PEREIRA	04984	919361753	\N	\N	\N	t	2026-01-13 22:50:45.261	2026-01-13 22:50:45.261	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkd6qsv3000hcynt4kn5cdz6	CARLA FERREIRA, SAUDE E BELEZA, UNIPESSOAL LDA	07160	962912651	carlafranco@live.com.pt	Rua Doutor Manuel de Arriaga 4 1o esq. 2770- 451 Loures	\N	t	2026-01-13 22:50:45.279	2026-01-18 18:36:09.913	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkcnpx9j0026ogntdzgxb566	INSTANTES DISTANTES- CARLA RAPOSO	7413	963309349	salasrstetica@hotmail.com	Rua das Grutas- edif.2000, N 381Lj B 0  2485-059 Mira de Aire	Encerra 2a feira\nPaga a PP com 4% desconto 	t	2026-01-13 13:58:11.623	2026-01-18 18:43:53.527	\N	\N	\N	\N	\N	cmkcnpx190000ogntlfp1peol
cmkk3bqum000001vj1s5nbkv2	VITASLIM 	7965	\N	geral@vitaslim.pt	Rua Câmara Pestana, lote 2  	\N	t	2026-01-18 18:49:27.214	2026-01-22 21:24:07.486	\N	Coimbra	3030-163	40.193168	-8.4064936	cmkcnpx190000ogntlfp1peol
cmkk44agl000401vjii42zr9o	ELEGANCIA SEM FRONTEIRAS	15164	925913970	eleganciasemfronteiras@hotmai.com	Rua Comandante Cousteau 22 	\N	t	2026-01-18 19:11:38.997	2026-01-22 21:25:56.897	\N	Lisboa	1990-067	38.7763466	-9.0946503	cmkcnpx190000ogntlfp1peol
\.


--
-- Data for Name: ClienteHealth; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ClienteHealth" (id, "clienteId", "scoreGeral", "scorePagamento", "scoreEngajamento", "scoreCompras", risco, tendencia, "ultimaAtualizacao") FROM stdin;
cmkn85efu000p01yvd9uf7n54	cmkd6qsv3000hcynt4kn5cdz6	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85ego000r01yv4obp0780	cmkcnpx9j0026ogntdzgxb566	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkon045l003301wm0znj1kdn	cmkomlf4i002j01wmrnup3tb8	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85ein000s01yv4m2s39xt	cmkcnpx4c000wogntmcv0avh1	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85bwa000201yvspu5tel7	cmkcnpxd40038ogntjuwfp2oj	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85ejb000u01yvnkzmhvud	cmkd6qsv7000jcynt6h6r7zv4	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85ejg000v01yvn0kifir5	cmkd6qsva000kcyntjc5a49nb	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85elc000w01yvd99jfd75	cmkk3uyw5000201vjvh49g3fi	45	0	50	100	MEDIO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85ed9000n01yvsrqlax0b	cmkd6qsur000ccyntanbgl2cn	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85cqu000601yvl1amczd5	cmkcnpx5p0019ognt0dfjus98	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85eau000m01yv538cqzta	cmkcnpx500013ogntjiccf4oy	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85da7000901yvo7ybq6v7	cmkk41coe000301vjs2ey859r	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85elj000x01yvggns544w	cmkd6qsvx000vcyntcezpxzo8	45	0	50	100	MEDIO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85elv000z01yv02kcg366	cmkd6qsvz000wcynt9w0ybvrb	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85dfw000b01yvv8c3astx	cmkd2khtw0003pontk0fsp8w4	45	0	50	100	MEDIO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85dih000c01yvfbryaa96	cmkd2khu20005pontjgu03va8	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85eo9001301yva1y6ckft	cmkd6qsvi000ocyntovbzv27e	45	0	50	100	MEDIO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85do6000d01yvzaskc2tr	cmkd6qsti0000cynty9veowk8	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85eof001401yvlgec3u1x	cmkd6qsvc000lcyntxxe35xnx	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85dqw000e01yv35rjgim4	cmkd6qstz0001cynts3nac09o	51	14	50	100	MEDIO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85d22000701yvlis0cy82	cmkcnpx3c000hogntfv3f1nr9	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85caq000401yvj24t6bum	cmkcnpx4n0010ogntlgsvrd29	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85drc000f01yv8d2nbmnu	cmkd6qsu40002cyntmtwkbs8f	55	26	50	100	MEDIO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85dcv000a01yvw0u8nkb9	cmkk57s2v000f01vjpcw5edlt	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn6k98m000f01wuqr2dum01	cmkk3ocbv000101vjx115msl5	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85c77000301yvtj4vdmlb	cmkcnpx38000fognt09x3o61e	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85cip000501yvnmand0qf	cmkk4k9ba000501vj4ybqtwvg	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85d7o000801yv1swyfc1b	cmkcnpx3g000jogntg4abd8u8	45	0	50	100	MEDIO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85dtu000g01yve0ywlgek	cmkd6qsu70003cyntf50v98ro	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85dwx000h01yvsxe1ds2k	cmkd6qsu90004cyntoujdyvh6	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85edj000o01yvt67hhg3n	cmkd6qsuy000fcynt35aeoahl	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 19:43:16.24
cmkn85elz001001yvgml855nr	cmkk4mqro000601vjd06qdwnb	45	0	50	100	MEDIO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85e25000i01yvmmb0tshq	cmkd6qsug0007cynt78amxldi	62	42	50	100	MEDIO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85em7001101yvk528jbk7	cmkd6qsw4000xcyntvgwmxu3v	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85eah000l01yvxnaf6u0l	cmkd6qsun000acyntg6r2psqb	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85eg6000q01yvypajsxrz	cmkcnpxa3002bogntjck4ynlc	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkon04q2003v01wmzlv0kvqu	cmkomhy8g002g01wm3kbc57ck	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85e7k000j01yvtw543sdy	cmkd6qsui0008cynt0g8nss02	66	52	50	100	MEDIO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85ej5000t01yvo36horth	cmkcnpx5x001bognt92v67fth	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85emc001201yveqgfp6kb	cmkk3bqum000001vj1s5nbkv2	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85elq000y01yveq66ixxc	cmkk44agl000401vjii42zr9o	85	100	50	100	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
cmkn85e8e000k01yvzp5m7no2	cmkd6qsul0009cynts5akpdj7	70	100	50	50	BAIXO	ESTAVEL	2026-01-30 00:05:16.737
\.


--
-- Data for Name: ClienteInsight; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ClienteInsight" (id, "clienteId", insights, provider, "createdAt", "updatedAt") FROM stdin;
cmkyp56pz002z01xh1219562w	cmkd6qsw4000xcyntvgwmxu3v	{"padraoCompras": {"texto": "Com apenas uma venda registada e sem detalhe dos produtos comprados ('Produtos diferentes comprados: 0'), não é possível identificar um padrão de compras em termos de frequência, preferências de produtos ou valor médio por categoria. A única informação é que a primeira e única transação foi de um valor considerável (1059.24 EUR), o que pode ser interpretado como um investimento inicial ou uma compra de grande volume para abastecimento.", "explicacao": "A falta de dados históricos e de detalhe sobre os produtos impede qualquer análise de padrão. A elevada média por venda (igual ao total gasto) apenas reforça o caráter de compra única e substancial. É crucial recolher mais dados para entender o seu verdadeiro padrão de compra, o que foi adquirido e a necessidade subjacente a essa compra."}, "tendenciaSazonal": {"texto": "Com base na informação fornecida de apenas uma única compra e sem data associada, não é possível identificar qualquer padrão sazonal ou temporal no comportamento de compra de Cristina Brito.", "explicacao": "A análise de tendências sazonais requer múltiplas transações distribuídas ao longo do tempo. A ausência de histórico de compras e de datas impede qualquer inferência sobre quando Cristina tende a comprar mais, quais produtos são mais procurados em certas épocas do ano, ou como a sua frequência de compra varia ao longo do tempo. Serão necessários mais dados e um histórico de compras mais robusto para realizar este tipo de análise."}, "recomendacoesUpsell": [{"razao": "Elevada margem e diferenciação", "produto": "Linhas de Produtos Profissionais Premium ou Especializados", "explicacao": "Assumindo que a compra inicial foi de stock ou equipamento base, Cristina pode estar interessada em expandir a sua oferta de serviços com produtos de maior valor agregado ou de tratamento especializado (ex: anti-idade, reparação capilar avançada, tratamentos de unhas de gel premium). Estes produtos permitem ao profissional oferecer serviços diferenciados e com maior margem."}, {"razao": "Investimento a longo prazo e modernização", "produto": "Equipamento de Estética Avançada ou Aparelhos de Diagnóstico", "explicacao": "Dada a sua capacidade de investimento inicial, equipamentos como aparelhos de radiofrequência, microdermoabrasão, luz pulsada ou sistemas de diagnóstico de pele/cabelo podem ser um upgrade natural. Estes equipamentos são de elevado valor e permitem alargar o leque de serviços da cliente, posicionando o seu negócio como inovador e completo."}, {"razao": "Geração de receita adicional para o salão", "produto": "Produtos de Revenda (Retalho) para Cliente Final", "explicacao": "Muitas marcas profissionais oferecem gamas de produtos que os salões e clínicas podem vender diretamente aos seus clientes finais para utilização em casa. Esta é uma excelente forma de Cristina Brito gerar receita adicional e fidelizar os seus próprios clientes, complementando os serviços prestados no seu espaço."}, {"razao": "Desenvolvimento profissional e novas competências", "produto": "Formação e Workshops Especializados", "explicacao": "A oferta de formação contínua em novas técnicas, utilização de novos equipamentos ou aplicação de produtos específicos pode ser um forte incentivo para um profissional como Cristina. Além de aumentar as suas competências, a formação muitas vezes está ligada à aquisição de novos produtos ou linhas, criando uma oportunidade de upsell indireta."}], "resumoComportamento": {"texto": "Cristina Brito é uma cliente com um perfil de compra de elevado valor inicial, tendo efetuado uma única transação de 1059.24 EUR. Este padrão sugere fortemente que se trata de uma cliente profissional (B2B), possivelmente uma proprietária de salão, clínica de estética ou profissional independente, que realizou uma compra substancial inicial, seja para abertura de negócio, renovação de stock ou aquisição de equipamento.", "explicacao": "A ausência de histórico de compras adicionais após esta transação única de alto valor, combinada com o contexto do setor profissional, indica que a cliente pode ter feito um investimento inicial significativo. O objetivo principal agora é reativar esta cliente e convertê-la num comprador recorrente, compreendendo as suas necessidades iniciais e atuais. O valor gasto é muito elevado para um consumidor final regular e aponta para uma compra para fins profissionais."}, "sugestoesEngagement": [{"texto": "Chamada Telefónica Personalizada de Follow-up Pós-Venda", "explicacao": "Entrar em contacto direto com Cristina Brito para agradecer a sua compra inicial, verificar a satisfação com a aquisição e, crucialmente, tentar perceber qual a necessidade que motivou a compra de alto valor. Esta abordagem pessoal ajuda a construir relacionamento, a recolher dados sobre as suas preferências (que atualmente são desconhecidas) e a identificar futuras oportunidades de venda."}, {"texto": "Envio de Catálogo Digital Completo e Convite para Visita a Showroom (se aplicável)", "explicacao": "Dado que não temos histórico de produtos, é essencial apresentar a Cristina toda a gama de produtos e serviços disponíveis. O catálogo digital é conveniente e o convite para um showroom oferece uma experiência imersiva para conhecer novidades e tirar dúvidas, reforçando o valor da marca e do fornecedor."}, {"texto": "Convite Exclusivo para Webinar ou Workshop de Lançamento de Novos Produtos/Técnicas", "explicacao": "Oferecer valor através de conhecimento e atualização é um excelente engajamento para profissionais. Um webinar ou workshop sobre um novo lançamento de produto, uma técnica inovadora ou um tema relevante para o setor pode atrair Cristina, permitindo-lhe conhecer a oferta da empresa e o seu valor educativo, sem a pressão de uma venda direta inicial."}, {"texto": "Criação de um 'Perfil de Necessidades' para Ofertas Futuras", "explicacao": "Através do contacto pós-venda ou de um breve inquérito, tentar construir um perfil detalhado do negócio de Cristina (tipo de salão/clínica, serviços oferecidos, marcas atuais, áreas de interesse). Esta informação será fundamental para segmentar futuras comunicações e personalizar as recomendações de produtos, garantindo que as ofertas são relevantes para as suas necessidades específicas."}]}	gemini	2026-01-29 00:08:59.207	2026-01-29 00:08:59.207
\.


--
-- Data for Name: ClienteSegmento; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ClienteSegmento" (id, "clienteId", segmento, tags, "potencialMensal", notas, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Cobranca; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Cobranca" (id, "clienteId", fatura, valor, "valorSemIva", comissao, "dataEmissao", "dataPago", pago, notas, "createdAt", "updatedAt", "dataInicioVencimento", "numeroParcelas", "vendaId") FROM stdin;
cmklo2q3f000001vu8oixl6j3	cmkd6qsti0000cynty9veowk8	1995	195.16	158.67	5.55	2026-01-06 00:00:00	2026-01-19 21:18:21.593	t	\N	2026-01-19 21:18:04.443	2026-01-19 21:18:48.245	\N	1	\N
cmklo7o2s000201vue69nmi8z	cmkd6qsti0000cynty9veowk8	106	205.15	166.79	5.84	2026-01-26 00:00:00	\N	f	\N	2026-01-19 21:21:55.108	2026-01-19 21:21:55.108	\N	1	\N
cmklo5wqp000101vul3dn6gnz	cmkd6qsti0000cynty9veowk8	2254	220.07	178.92	6.26	2026-01-21 00:00:00	\N	f	\N	2026-01-19 21:20:33.025	2026-01-19 21:22:13.673	\N	1	\N
cmkloa431000301vugwt2y77u	cmkd6qsti0000cynty9veowk8	1995	397.42	323.11	11.31	2026-02-05 00:00:00	\N	f	\N	2026-01-19 21:23:49.165	2026-01-19 21:23:49.165	\N	1	\N
cmklock14000401vupi0v0kd1	cmkd6qsti0000cynty9veowk8	106	205.15	166.79	5.84	2026-02-25 00:00:00	\N	f	\N	2026-01-19 21:25:43.144	2026-01-19 21:25:43.144	\N	1	\N
cmklonsr5000701vuvstnuvw0	cmkd6qstz0001cynts3nac09o	1602	154.03	125.23	4.38	2026-01-13 00:00:00	2026-01-19 21:34:40.602	t	\N	2026-01-19 21:34:27.665	2026-01-19 21:34:47.105	\N	1	\N
cmklojn2d000501vuwa04ce5v	cmkd6qstz0001cynts3nac09o	2216	201.32	163.67	5.73	2026-01-11 00:00:00	2026-01-19 21:34:46.863	t	\N	2026-01-19 21:31:13.669	2026-01-19 21:34:53.354	\N	1	\N
cmkloq3rj000801vu72v7s6ae	cmkd6qstz0001cynts3nac09o	2130	242.58	197.22	6.90	2026-01-27 00:00:00	\N	f	\N	2026-01-19 21:36:15.247	2026-01-19 21:36:15.247	\N	1	\N
cmklovlgk000901vuh5ban19u	cmkd6qstz0001cynts3nac09o	1726	322.77	262.41	9.18	2026-01-28 00:00:00	\N	f	\N	2026-01-19 21:40:31.46	2026-01-19 21:40:31.46	\N	1	\N
cmkloy7x6000a01vuina5opel	cmkd6qstz0001cynts3nac09o	1923	422.69	343.65	12.03	2026-01-28 00:00:00	\N	f	\N	2026-01-19 21:42:33.882	2026-01-19 21:42:33.882	\N	1	\N
cmklozzc2000b01vu646awqfx	cmkd6qstz0001cynts3nac09o	2216	287.86	234.03	8.19	2026-02-10 00:00:00	\N	f	\N	2026-01-19 21:43:56.066	2026-01-19 21:43:56.066	\N	1	\N
cmklp2bnk000c01vukteegsak	cmkd6qstz0001cynts3nac09o	2130	242.58	197.22	6.90	2026-02-26 00:00:00	\N	f	\N	2026-01-19 21:45:45.344	2026-01-19 21:45:45.344	\N	1	\N
cmklp3kkb000d01vuoh6e4vub	cmkd6qstz0001cynts3nac09o	1923	422.69	343.65	12.03	2026-02-27 00:00:00	\N	f	\N	2026-01-19 21:46:43.547	2026-01-19 21:46:43.547	\N	1	\N
cmklp50js000e01vuo81ekwwm	cmkd6qstz0001cynts3nac09o	2216	287.86	234.03	8.19	2026-03-12 00:00:00	\N	f	\N	2026-01-19 21:47:50.92	2026-01-19 21:47:50.92	\N	1	\N
cmklp7dte000f01vu67xi42ut	cmkd6qstz0001cynts3nac09o	2130	242.58	197.22	6.90	2026-03-28 00:00:00	\N	f	\N	2026-01-19 21:49:41.426	2026-01-19 21:49:41.426	\N	1	\N
cmklp8qly000g01vu37dusl9y	cmkd6qstz0001cynts3nac09o	2216	287.86	234.03	8.19	2026-04-11 00:00:00	\N	f	\N	2026-01-19 21:50:44.662	2026-01-19 21:50:44.662	\N	1	\N
cmklpddg1000i01vue3gq67c9	cmkd6qsu40002cyntmtwkbs8f	1961	300.00	243.90	8.54	2026-01-01 00:00:00	2026-01-19 21:54:24.529	t	\N	2026-01-19 21:54:20.88	2026-01-19 21:54:31.009	\N	1	\N
cmklpfhnt000j01vuycegetbk	cmkd6qsu40002cyntmtwkbs8f	1961	241.28	196.16	6.87	2026-01-29 00:00:00	\N	f	\N	2026-01-19 21:55:59.657	2026-01-19 21:55:59.657	\N	1	\N
cmklpmogm000k01vu92yd4m4y	cmkd6qsu70003cyntf50v98ro	50	75.50	61.38	2.15	2026-01-10 00:00:00	\N	f	\N	2026-01-19 22:01:35.061	2026-01-19 22:01:35.061	\N	1	\N
cmklppn5z000l01vur6qqa76r	cmkd6qsu70003cyntf50v98ro	2234	134.07	109.00	3.82	2026-01-18 00:00:00	\N	f	\N	2026-01-19 22:03:53.351	2026-01-19 22:03:53.351	\N	1	\N
cmklprai2000m01vu0n6yh4hl	cmkd6qsu70003cyntf50v98ro	121	152.98	124.37	4.35	2026-01-26 00:00:00	\N	f	\N	2026-01-19 22:05:10.25	2026-01-19 22:05:10.25	\N	1	\N
cmklptkqi000n01vu84exbznm	cmkd6qsu90004cyntoujdyvh6	100	201.34	163.69	5.73	2026-01-01 00:00:00	2026-01-19 22:07:03.494	t	\N	2026-01-19 22:06:56.826	2026-01-19 22:07:09.966	\N	1	\N
cmklpyfhk000o01vumb9cpkn9	cmkd6qsu90004cyntoujdyvh6	2288	494.44	401.98	14.07	2026-01-01 00:00:00	2026-01-19 22:10:49.078	t	\N	2026-01-19 22:10:43.304	2026-01-19 22:10:55.559	\N	1	\N
cmklq30f4000p01vu73mc1fa3	cmkd6qsu90004cyntoujdyvh6	100	417.48	339.41	11.88	2025-12-26 00:00:00	\N	f	\N	2026-01-19 22:14:17.056	2026-01-19 22:14:17.056	2026-01-25 00:00:00	2	\N
cmklq7qov000s01vu3mwc5q03	cmkd6qsug0007cynt78amxldi	2016	214.30	174.23	6.10	2026-01-10 00:00:00	2026-01-19 22:17:59.632	t	\N	2026-01-19 22:17:57.726	2026-01-19 22:18:06.085	\N	1	\N
cmkqqrg910000010g22cae8vv	cmkd6qsug0007cynt78amxldi	2016	214.30	174.23	6.10	2025-11-11 00:00:00	2026-01-23 10:33:49.02	t	\N	2026-01-23 10:32:08.197	2026-01-23 10:33:48.976	\N	1	\N
cmkqrzr5t0003010glcaicaqm	cmkd6qsug0007cynt78amxldi	\N	809.66	658.26	23.04	2026-01-23 11:06:35.198	\N	f	\N	2026-01-23 11:06:35.201	2026-01-23 11:06:35.201	2026-01-26 00:00:00	3	cmkqrzr5i0002010gssp8fnr2
cmklqitpa000x01vukp402w5s	cmkd6qsun000acyntg6r2psqb	1645	182.76	148.59	5.20	2025-12-21 00:00:00	\N	f	\N	2026-01-19 22:26:34.845	2026-01-19 22:36:54.153	\N	1	\N
cmkr9x8bq004r01zs7bo70eq1	cmkcnpx3g000jogntg4abd8u8	\N	365.52	297.17	10.40	2026-01-23 19:28:30.521	\N	f	\N	2026-01-23 19:28:30.566	2026-01-23 19:28:30.566	2026-01-20 00:00:00	2	cmkk51bwl000701vjn92qbht2
cmkr9ynfc004u01zsaw61f0t9	cmkk4mqro000601vjd06qdwnb	\N	433.97	352.82	12.35	2026-01-23 19:29:36.79	\N	f	\N	2026-01-23 19:29:36.792	2026-01-23 19:30:19.509	\N	1	cmkk53gzd000901vj8dqnoh6v
cmkra0stm004v01zsio2uptl6	cmkk3uyw5000201vjvh49g3fi	\N	891.64	724.91	25.37	2026-01-23 19:31:17.095	\N	f	\N	2026-01-23 19:31:17.098	2026-01-23 19:31:17.098	\N	1	cmkom5zd4002b01wmiex435cb
cmkra23ct004w01zse1go2597	cmkd6qsu40002cyntmtwkbs8f	\N	619.27	503.47	17.62	2026-01-23 19:32:17.402	\N	f	\N	2026-01-23 19:32:17.405	2026-01-23 19:32:17.405	\N	1	cmkk54q48000b01vjjkuezvqx
cmkra307f004x01zso0xmzu6u	cmkd6qstz0001cynts3nac09o	\N	990.79	805.52	28.19	2026-01-23 19:32:59.978	\N	f	\N	2026-01-23 19:32:59.979	2026-01-23 19:32:59.979	\N	1	cmkomeiey002f01wmxri5u1c8
cmklqc5bn000u01vujlx5x1bz	cmkd6qsui0008cynt0g8nss02	1846	336.00	273.17	9.56	2025-11-18 00:00:00	2026-01-22 21:43:36.69	t	\N	2026-01-19 22:21:23.315	2026-01-22 21:43:36.692	2025-12-20 00:00:00	2	\N
cmkqownqt00010104vagdv9g8	cmkd6qsvx000vcyntcezpxzo8	\N	441.57	359.00	12.57	2026-01-23 09:40:11.952	\N	f	\N	2026-01-23 09:40:11.957	2026-01-23 09:40:11.957	\N	1	cmkqownqe00000104lj530grk
cmkqqtbug0001010gmstj1p7o	cmkd6qsug0007cynt78amxldi	1848	168.62	137.09	4.80	2025-10-21 00:00:00	2026-01-23 10:33:44.053	t	\N	2026-01-23 10:33:35.8	2026-01-23 10:33:44.076	\N	1	\N
cmkvauueb00cb01zsx91qvr3h	cmkd6qsvi000ocyntovbzv27e	\N	506.76	412.00	14.42	2026-01-26 15:05:43.521	\N	f	\N	2026-01-26 15:05:43.523	2026-01-26 15:05:43.523	2026-01-27 00:00:00	3	cmkvauue400ca01zs14bdsdix
cmklpa13d000h01vujnhwsqyh	cmkd6qstz0001cynts3nac09o	2130	242.58	197.22	6.90	2026-01-27 00:00:00	2026-01-27 19:56:57.754	t	\N	2026-01-19 21:51:44.905	2026-01-27 19:58:02.045	\N	1	\N
cmky39uyl005e01zs4hbf7vw9	cmkd6qsur000ccyntanbgl2cn	102	225.38	183.24	6.41	2026-01-28 00:00:00	2026-01-28 13:56:54.364	t	\N	2026-01-28 13:56:45.693	2026-01-28 13:56:53.959	\N	1	\N
cmky3chmc005f01zsl608ywr7	cmkd6qsw4000xcyntvgwmxu3v	\N	1302.87	1059.24	37.07	\N	2026-01-28 13:59:03.854	t	\N	2026-01-28 13:58:48.372	2026-01-28 13:59:03.439	\N	1	\N
cmkykzl3u006j01015uadls22	cmkd6qsui0008cynt0g8nss02	\N	310.43	252.38	8.83	2026-01-28 22:12:39.448	\N	f	\N	2026-01-28 22:12:39.45	2026-01-28 22:12:39.45	2026-01-19 00:00:00	2	cmkomjpeu002i01wmz39rhger
cmkzw54bw001b01w4jkbteuwo	cmkd2khtw0003pontk0fsp8w4	\N	452.15	367.60	12.87	2026-01-29 20:12:39.592	\N	f	\N	2026-01-29 20:12:39.595	2026-01-29 20:12:39.595	2026-01-30 00:00:00	2	cmkzw54bj001a01w4ihm1uiaz
\.


--
-- Data for Name: Comunicacao; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Comunicacao" (id, "clienteId", "prospectoId", tipo, assunto, notas, "dataContacto", duracao, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: Configuracao; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Configuracao" (id, chave, valor, descricao, "createdAt", "updatedAt") FROM stdin;
eb560a60-5d38-45bc-8c6e-f154d441fac8	IVA_PERCENTAGEM	23	Percentagem de IVA	2026-01-13 15:25:57.801	2026-01-13 15:25:57.801
277b5453-74cf-41fe-b31d-bd9803a4bfba	COMISSAO_PERCENTAGEM	3.5	Percentagem de comissao	2026-01-13 15:25:57.801	2026-01-13 15:25:57.801
cmkyp4qfe002y01xha0s6rend	ai_provider	gemini	Fornecedor de IA preferido (gemini ou openai)	2026-01-29 00:08:38.089	2026-01-29 00:08:38.089
\.


--
-- Data for Name: Devolucao; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Devolucao" (id, "vendaId", "dataRegisto", motivo, "totalDevolvido", "totalSubstituido", estado, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ImagemDevolucao; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ImagemDevolucao" (id, "devolucaoId", caminho, "nomeOriginal", tamanho, tipo, "createdAt") FROM stdin;
\.


--
-- Data for Name: ImpersonationLog; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ImpersonationLog" (id, "impersonatorId", "impersonatedUserId", "impersonatedEmail", "startedAt", "endedAt") FROM stdin;
cml0odov6000b0106im23c119	masteradmin001	cmkcnpx190000ogntlfp1peol	carolina	2026-01-30 09:23:08.706	\N
\.


--
-- Data for Name: ItemDevolucao; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ItemDevolucao" (id, "devolucaoId", "itemVendaId", quantidade, "valorUnitario", subtotal, motivo, "substituicaoId", "qtdSubstituicao", "precoSubstituicao", "subtotalSubstituicao", "createdAt") FROM stdin;
\.


--
-- Data for Name: ItemOrcamento; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ItemOrcamento" (id, "orcamentoId", "produtoId", descricao, quantidade, "precoUnit", desconto, subtotal, ordem, "createdAt") FROM stdin;
\.


--
-- Data for Name: ItemReconciliacao; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ItemReconciliacao" (id, "reconciliacaoId", "codigoClientePdf", "nomeClientePdf", "valorBrutoPdf", "descontoPdf", "valorLiquidoPdf", "clienteId", "vendaId", "valorSistema", corresponde, "tipoDiscrepancia", "diferencaValor", resolvido, "notaResolucao", "createdAt") FROM stdin;
\.


--
-- Data for Name: ItemVenda; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ItemVenda" (id, "vendaId", "produtoId", quantidade, "precoUnit", subtotal, "createdAt") FROM stdin;
\.


--
-- Data for Name: MoodEntry; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."MoodEntry" (id, date, rating, "createdAt", "userId") FROM stdin;
cml005sqi004001w463btb5ql	2026-01-29	3	2026-01-29 22:05:09.69	cmkcnpx190000ogntlfp1peol
\.


--
-- Data for Name: Notificacao; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Notificacao" (id, tipo, titulo, mensagem, lida, "clienteId", "prospectoId", "tarefaId", "parcelaId", "createdAt", "readAt") FROM stdin;
cmkn6kbsy001601wu1p799svv	PAGAMENTO_ATRASADO	Pagamento em Atraso	ANA MARIA MAIA VILAS - Parcela 1 de 150.18€ vencida em 20/12/2025	f	cmkd6qsui0008cynt0g8nss02	\N	\N	cmklqc5bu000v01vuagrgnzf9	2026-01-20 22:43:24.879	\N
cmkn6kbsy001701wu597h8kbx	PAGAMENTO_ATRASADO	Pagamento em Atraso	ANA MARIA MAIA VILAS - Parcela 2 de 150.18€ vencida em 20/01/2026	f	cmkd6qsui0008cynt0g8nss02	\N	\N	cmklqc5bu000w01vuyk8zlnqr	2026-01-20 22:43:24.879	\N
cmkn6kbsy001801wu8ivo055a	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	GLAMOUR - Nunca contactado	f	cmkcnpx38000fognt09x3o61e	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsy001901wuqmygfcdg	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	Pura Beleza - Nunca contactado	f	cmkcnpx3c000hogntfv3f1nr9	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsy001a01wu3tnqj5h3	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	FISIBELA - Nunca contactado	f	cmkcnpx3g000jogntg4abd8u8	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsy001b01wukd30fk5c	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	SETIMA ESSENCIA- CELIA VICENTE - Nunca contactado	f	cmkcnpx4c000wogntmcv0avh1	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsy001c01wuzmcyrm97	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	IVONE RAMOS - Nunca contactado	f	cmkcnpx4n0010ogntlgsvrd29	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsy001d01wuwn0cd1w8	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	SILVIA RODRIGUES NETO - Nunca contactado	f	cmkcnpx500013ogntjiccf4oy	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsy001e01wuvjppb77k	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	PAULA SANTANA - Nunca contactado	f	cmkcnpx5p0019ognt0dfjus98	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsy001f01wut46378ke	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	ANA CAMEIRA - Nunca contactado	f	cmkcnpx5x001bognt92v67fth	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsy001g01wusko88vim	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	INSTANTES DISTANTES- CARLA RAPOSO - Nunca contactado	f	cmkcnpx9j0026ogntdzgxb566	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsy001h01wugisrmgq8	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	JOANA SIMÕES  - Nunca contactado	f	cmkcnpxa3002bogntjck4ynlc	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsy001i01wuvnd8ao67	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	SPIRIT DAY SPA- MELISSA - Nunca contactado	f	cmkcnpxd40038ogntjuwfp2oj	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsy001j01wu99jzuo8g	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	Silkare - Nunca contactado	f	cmkd2khtw0003pontk0fsp8w4	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsy001k01wutgln1db3	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	Isaura - Nunca contactado	f	cmkd2khu20005pontjgu03va8	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsz001l01wuid3sydut	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	MARIA TERESA PINHO DUARTE - Nunca contactado	f	cmkd6qsti0000cynty9veowk8	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsz001m01wuylgngizi	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	TRINDADE DA COSTA LUIS - Nunca contactado	f	cmkd6qstz0001cynts3nac09o	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsz001n01wuw72181rn	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	PAULA GRACA J.SILVA - Nunca contactado	f	cmkd6qsu40002cyntmtwkbs8f	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsz001o01wuafde6gjn	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	INSTITUTO DE BELEZA CAB.LDA - Nunca contactado	f	cmkd6qsu70003cyntf50v98ro	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsz001p01wutmxyzhns	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	LURDES MARTA-ESTETICA E PERFUMARIA, LDA. - Nunca contactado	f	cmkd6qsu90004cyntoujdyvh6	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsz001q01wul24cq5sy	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	LUCIA BATISTA UNIPESSOAL LDA - Nunca contactado	f	cmkd6qsug0007cynt78amxldi	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkn6kbsz001r01wueqaljwpz	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	ANA MARIA MAIA VILAS - Nunca contactado	f	cmkd6qsui0008cynt0g8nss02	\N	\N	\N	2026-01-20 22:43:24.879	\N
cmkon041d002x01wmb6nyaqen	PAGAMENTO_ATRASADO	Pagamento em Atraso	ANA MARIA MAIA VILAS - Parcela 1 de 150.18€ vencida em 20/12/2025	f	cmkd6qsui0008cynt0g8nss02	\N	\N	cmklqc5bu000v01vuagrgnzf9	2026-01-21 23:11:21.45	\N
cmkon041d002y01wm5dzi46zd	PAGAMENTO_ATRASADO	Pagamento em Atraso	ANA MARIA MAIA VILAS - Parcela 2 de 150.18€ vencida em 20/01/2026	f	cmkd6qsui0008cynt0g8nss02	\N	\N	cmklqc5bu000w01vuyk8zlnqr	2026-01-21 23:11:21.45	\N
cmkqpovlu000z01x7eciynayo	TAREFA_HOJE	Tarefa para Hoje	Contactar ANA CRISTINA CHAGAS - ANA CRISTINA CHAGAS	f	cmkk3ocbv000101vjx115msl5	\N	cmkn6k6k1000001wutm4cjlwp	\N	2026-01-23 10:02:08.414	\N
cmkqpovlu001001x79xt71cd7	TAREFA_HOJE	Tarefa para Hoje	Contactar SPIRIT DAY SPA- MELISSA - SPIRIT DAY SPA- MELISSA	f	cmkcnpxd40038ogntjuwfp2oj	\N	cmkn6k6mz000101wueqel5pf5	\N	2026-01-23 10:02:08.414	\N
cmkqpovlu001101x70r6bikw9	TAREFA_HOJE	Tarefa para Hoje	Contactar GLAMOUR - GLAMOUR	f	cmkcnpx38000fognt09x3o61e	\N	cmkn6k6p9000201wub3robfft	\N	2026-01-23 10:02:08.414	\N
cmkqpovlu001201x7ig9ep7j8	TAREFA_HOJE	Tarefa para Hoje	Contactar IVONE RAMOS - IVONE RAMOS	f	cmkcnpx4n0010ogntlgsvrd29	\N	cmkn6k6s4000301wue65sjmfz	\N	2026-01-23 10:02:08.414	\N
cmkqpovlu001301x75fyvdtsl	TAREFA_HOJE	Tarefa para Hoje	Contactar FILIPA DANIELA PEREIRA - FILIPA DANIELA PEREIRA	f	cmkk4k9ba000501vj4ybqtwvg	\N	cmkn6k6ux000401wuf4tk0k2j	\N	2026-01-23 10:02:08.414	\N
cmkqpovlu001401x744pcac5z	TAREFA_HOJE	Tarefa para Hoje	Contactar PAULA SANTANA - PAULA SANTANA	f	cmkcnpx5p0019ognt0dfjus98	\N	cmkn6k70c000501wu0gyxnzt4	\N	2026-01-23 10:02:08.414	\N
cmkqpovlu001501x7gklck84i	TAREFA_HOJE	Tarefa para Hoje	Contactar Pura Beleza - Pura Beleza	f	cmkcnpx3c000hogntfv3f1nr9	\N	cmkn6k75o000601wuw37v56g4	\N	2026-01-23 10:02:08.414	\N
cmkqpovlu001601x7r0c0qa32	TAREFA_HOJE	Tarefa para Hoje	Contactar FISIBELA - FISIBELA	f	cmkcnpx3g000jogntg4abd8u8	\N	cmkn6k78o000701wu2jut6gq7	\N	2026-01-23 10:02:08.414	\N
cmkqpovlu001701x79hr3s27b	TAREFA_HOJE	Tarefa para Hoje	Contactar AGILREQUINTE - AGILREQUINTE	f	cmkk41coe000301vjs2ey859r	\N	cmkn6k7bu000801wusbu7mkea	\N	2026-01-23 10:02:08.414	\N
cmkqpovlu001801x7ln8dem7d	TAREFA_HOJE	Tarefa para Hoje	Contactar SANDRA LUZ - DEZ STUDIO - SANDRA LUZ - DEZ STUDIO	f	cmkk57s2v000f01vjpcw5edlt	\N	cmkn6k7ek000901wub71fu5qs	\N	2026-01-23 10:02:08.414	\N
cmkqpovlu001901x7bi1hhig4	TAREFA_HOJE	Tarefa para Hoje	Contactar Silkare - Silkare	f	cmkd2khtw0003pontk0fsp8w4	\N	cmkn6k835000a01wuffxtzdjh	\N	2026-01-23 10:02:08.414	\N
cmkqpovlu001a01x7t75k7gbm	TAREFA_HOJE	Tarefa para Hoje	Contactar Isaura - Isaura	f	cmkd2khu20005pontjgu03va8	\N	cmkn6k8c1000b01wubpcafb3m	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001b01x7pn8cbssh	TAREFA_HOJE	Tarefa para Hoje	Contactar MARIA TERESA PINHO DUARTE - MARIA TERESA PINHO DUARTE	f	cmkd6qsti0000cynty9veowk8	\N	cmkn6k8k2000c01wuar8qwit4	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001c01x72u4oilnx	TAREFA_HOJE	Tarefa para Hoje	Contactar TRINDADE DA COSTA LUIS - TRINDADE DA COSTA LUIS	f	cmkd6qstz0001cynts3nac09o	\N	cmkn6k8mv000d01wu7ll68l72	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001d01x7j7dgr5s7	TAREFA_HOJE	Tarefa para Hoje	Contactar PAULA GRACA J.SILVA - PAULA GRACA J.SILVA	f	cmkd6qsu40002cyntmtwkbs8f	\N	cmkn6k931000e01wuc8zqffkt	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001e01x7h0q1zqa2	TAREFA_HOJE	Tarefa para Hoje	Contactar INSTITUTO DE BELEZA CAB.LDA - INSTITUTO DE BELEZA CAB.LDA	f	cmkd6qsu70003cyntf50v98ro	\N	cmkn6k9jw000g01wu5vydxlnq	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001f01x7vc98ieti	TAREFA_HOJE	Tarefa para Hoje	Contactar LURDES MARTA-ESTETICA E PERFUMARIA, LDA. - LURDES MARTA-ESTETICA E PERFUMARIA, LDA.	f	cmkd6qsu90004cyntoujdyvh6	\N	cmkn6k9pk000h01wuj5zwehox	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001g01x7k4w5e0cr	TAREFA_HOJE	Tarefa para Hoje	Contactar LUCIA BATISTA UNIPESSOAL LDA - LUCIA BATISTA UNIPESSOAL LDA	f	cmkd6qsug0007cynt78amxldi	\N	cmkn6k9vo000i01wuw48gtd95	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001h01x73v78zy70	TAREFA_HOJE	Tarefa para Hoje	Contactar ANA MARIA MAIA VILAS - ANA MARIA MAIA VILAS	f	cmkd6qsui0008cynt0g8nss02	\N	cmkn6k9yb000j01wuvira7hfd	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001i01x7r04glfbe	TAREFA_HOJE	Tarefa para Hoje	Contactar ANABELA DOMINGUES PEREIRA - ANABELA DOMINGUES PEREIRA	f	cmkd6qsul0009cynts5akpdj7	\N	cmkn6ka0r000k01wuiqmiexy6	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001j01x7owxjdnuy	TAREFA_HOJE	Tarefa para Hoje	Contactar ANDREIA DORIA ALVES ALFREDO BENTO - ANDREIA DORIA ALVES ALFREDO BENTO	f	cmkd6qsun000acyntg6r2psqb	\N	cmkn6ka3e000l01wugv395edj	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001k01x7s6ijq624	TAREFA_HOJE	Tarefa para Hoje	Contactar SILVIA RODRIGUES NETO - SILVIA RODRIGUES NETO	f	cmkcnpx500013ogntjiccf4oy	\N	cmkn6ka8x000m01wufnw76bw9	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001l01x72gb63rm7	TAREFA_HOJE	Tarefa para Hoje	Contactar TERESA LEONOR FAIA PEREIRA - TERESA LEONOR FAIA PEREIRA	f	cmkd6qsur000ccyntanbgl2cn	\N	cmkn6kabn000o01wugpa6ulf2	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001m01x75225m99b	TAREFA_HOJE	Tarefa para Hoje	Contactar KRISTELL DA GRAÇA RODRIGUES RIBEIRO - KRISTELL DA GRAÇA RODRIGUES RIBEIRO	f	cmkd6qsuy000fcynt35aeoahl	\N	cmkn6kabx000p01wu9ttqgilp	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001n01x7lv3qyi95	TAREFA_HOJE	Tarefa para Hoje	Contactar CARLA FERREIRA, SAUDE E BELEZA, UNIPESSOAL LDA - CARLA FERREIRA, SAUDE E BELEZA, UNIPESSOAL LDA	f	cmkd6qsv3000hcynt4kn5cdz6	\N	cmkn6kaec000q01wuu1n6lyyc	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001o01x7aaehmytb	TAREFA_HOJE	Tarefa para Hoje	Contactar JOANA SIMÕES  - JOANA SIMÕES 	f	cmkcnpxa3002bogntjck4ynlc	\N	cmkn6kai0000r01wujq1jm0i1	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001p01x7yi3q3yfu	TAREFA_HOJE	Tarefa para Hoje	Contactar INSTANTES DISTANTES- CARLA RAPOSO - INSTANTES DISTANTES- CARLA RAPOSO	f	cmkcnpx9j0026ogntdzgxb566	\N	cmkn6kak0000s01wukdw9p6i6	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001q01x7xvi023xl	TAREFA_HOJE	Tarefa para Hoje	Contactar SETIMA ESSENCIA- CELIA VICENTE - SETIMA ESSENCIA- CELIA VICENTE	f	cmkcnpx4c000wogntmcv0avh1	\N	cmkn6kamv000t01wu9uq460bg	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001r01x7su1eazm5	TAREFA_HOJE	Tarefa para Hoje	Contactar ANA CAMEIRA - ANA CAMEIRA	f	cmkcnpx5x001bognt92v67fth	\N	cmkn6kan5000u01wuemov7mxo	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001s01x78iqg0isz	TAREFA_HOJE	Tarefa para Hoje	Contactar NUTRILEIRIA UNIPESSOAL LDA - NUTRILEIRIA UNIPESSOAL LDA	f	cmkd6qsv7000jcynt6h6r7zv4	\N	cmkn6kaq6000v01wuhcz66fw7	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001t01x7ohhuv5cl	TAREFA_HOJE	Tarefa para Hoje	Contactar SUSANA ISABEL ALMEIDA RODRIGUES PINTO - SUSANA ISABEL ALMEIDA RODRIGUES PINTO	f	cmkd6qsva000kcyntjc5a49nb	\N	cmkn6kas8000w01wur0xrxqwm	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001u01x7drbu5rj2	TAREFA_HOJE	Tarefa para Hoje	Contactar ELISABETE COSTA - ELISABETE COSTA	f	cmkk3uyw5000201vjvh49g3fi	\N	cmkn6kasl000x01wur89ou6pl	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001v01x7kh5zqq8z	TAREFA_HOJE	Tarefa para Hoje	Contactar SUSANA LOPES CABELEIREIROS LDA - SUSANA LOPES CABELEIREIROS LDA	f	cmkd6qsvx000vcyntcezpxzo8	\N	cmkn6kasz000y01wu77scnj9n	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001w01x7yf50yyao	TAREFA_HOJE	Tarefa para Hoje	Contactar ELEGANCIA SEM FRONTEIRAS - ELEGANCIA SEM FRONTEIRAS	f	cmkk44agl000401vjii42zr9o	\N	cmkn6kat8000z01wuj4cjs5nf	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001x01x7ucjyxr4s	TAREFA_HOJE	Tarefa para Hoje	Contactar CUIDAME CABELEIREIRO E ESTÉTICA, UNIP. LDA - CUIDAME CABELEIREIRO E ESTÉTICA, UNIP. LDA	f	cmkd6qsvz000wcynt9w0ybvrb	\N	cmkn6kav6001001wu47olxxhd	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001y01x7b1l7lpw3	TAREFA_HOJE	Tarefa para Hoje	Contactar Neuza Godinho - Neuza Godinho	f	cmkk4mqro000601vjd06qdwnb	\N	cmkn6kaxv001101wu3m8tkdxy	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv001z01x761nd793s	TAREFA_HOJE	Tarefa para Hoje	Contactar CRISTINA   BRITO - CRISTINA   BRITO	f	cmkd6qsw4000xcyntvgwmxu3v	\N	cmkn6kay8001201wu7119qq8y	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv002001x7aeviqxh9	TAREFA_HOJE	Tarefa para Hoje	Contactar VITASLIM  - VITASLIM 	f	cmkk3bqum000001vj1s5nbkv2	\N	cmkn6kb3b001301wuszxkziww	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv002101x7vncfhlbt	TAREFA_HOJE	Tarefa para Hoje	Contactar LA DONNA - ESTETICA & CABELEIREIRO UNIPESSOAL LDA - LA DONNA - ESTETICA & CABELEIREIRO UNIPESSOAL LDA	f	cmkd6qsvi000ocyntovbzv27e	\N	cmkn6kb3p001401wu5had913r	\N	2026-01-23 10:02:08.414	\N
cmkqpovlv002201x72k59mxsi	TAREFA_HOJE	Tarefa para Hoje	Contactar HELENA CRISTINA F. MATEUS - HELENA CRISTINA F. MATEUS	f	cmkd6qsvc000lcyntxxe35xnx	\N	cmkn6kb64001501wu1ldkxj17	\N	2026-01-23 10:02:08.414	\N
cmkqtellm000w01xk2q65gxue	LEAD_PARADO	Lead Parado	Bia Lacerda Cabeleireiros - Nunca contactado	f	\N	cmkqsd6h50007010g7dd4jrbf	\N	\N	2026-01-23 11:46:07.347	\N
cmkqvhraw002701w39165p1gw	LEAD_PARADO	Lead Parado	SF Estética Facial Corporal - Nunca contactado	f	\N	cmkquzm86001701w3rub327u9	\N	\N	2026-01-23 12:44:34.026	\N
cmkqybu9g00280121peygesjl	LEAD_PARADO	Lead Parado	Andreia Barbosa Cabeleireiro e Estética - Nunca contactado	f	\N	cmkqwfefv00170121fnelm5ll	\N	\N	2026-01-23 14:03:56.721	\N
cmkslxmy6005n01zsa0e94yg7	PAGAMENTO_ATRASADO	Pagamento em Atraso	FISIBELA - Parcela 1 de 182.76€ vencida em 20/01/2026	f	cmkcnpx3g000jogntg4abd8u8	\N	\N	cmkr9x8bz004s01zs9g3d3tf1	2026-01-24 17:52:31.067	\N
cmkslxmy6005o01zsyq6o44rn	TAREFA_HOJE	Tarefa para Hoje	Contactar Olga Pimentel - Olga Pimentel	f	cmkomlf4i002j01wmrnup3tb8	\N	cmkon0373002m01wm0hm4yo5l	\N	2026-01-24 17:52:31.067	\N
cmkslxmy6005p01zsvzyti3i6	TAREFA_HOJE	Tarefa para Hoje	Contactar Olivia Almeida - Olivia Almeida	f	cmkomhy8g002g01wm3kbc57ck	\N	cmkon0386002n01wm3ziavzuc	\N	2026-01-24 17:52:31.067	\N
cmkslxmy6005q01zsitcxnkbs	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANA CRISTINA CHAGAS - Vencida em 23/01/2026	f	cmkk3ocbv000101vjx115msl5	\N	cmkn6k6k1000001wutm4cjlwp	\N	2026-01-24 17:52:31.067	\N
cmkslxmy6005r01zsaa2q8hhv	TAREFA_VENCIDA	Tarefa Atrasada	Contactar SPIRIT DAY SPA- MELISSA - Vencida em 23/01/2026	f	cmkcnpxd40038ogntjuwfp2oj	\N	cmkn6k6mz000101wueqel5pf5	\N	2026-01-24 17:52:31.067	\N
cmkslxmy6005s01zs3dbmewt4	TAREFA_VENCIDA	Tarefa Atrasada	Contactar GLAMOUR - Vencida em 23/01/2026	f	cmkcnpx38000fognt09x3o61e	\N	cmkn6k6p9000201wub3robfft	\N	2026-01-24 17:52:31.067	\N
cmkslxmy6005t01zsxt74qxtf	TAREFA_VENCIDA	Tarefa Atrasada	Contactar IVONE RAMOS - Vencida em 23/01/2026	f	cmkcnpx4n0010ogntlgsvrd29	\N	cmkn6k6s4000301wue65sjmfz	\N	2026-01-24 17:52:31.067	\N
cmkslxmy6005u01zsplsx8nld	TAREFA_VENCIDA	Tarefa Atrasada	Contactar FILIPA DANIELA PEREIRA - Vencida em 23/01/2026	f	cmkk4k9ba000501vj4ybqtwvg	\N	cmkn6k6ux000401wuf4tk0k2j	\N	2026-01-24 17:52:31.067	\N
cmkslxmy6005v01zss0g0xyxa	TAREFA_VENCIDA	Tarefa Atrasada	Contactar PAULA SANTANA - Vencida em 23/01/2026	f	cmkcnpx5p0019ognt0dfjus98	\N	cmkn6k70c000501wu0gyxnzt4	\N	2026-01-24 17:52:31.067	\N
cmkslxmy6005w01zs1pxw6bqn	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Pura Beleza - Vencida em 23/01/2026	f	cmkcnpx3c000hogntfv3f1nr9	\N	cmkn6k75o000601wuw37v56g4	\N	2026-01-24 17:52:31.067	\N
cmkslxmy6005x01zskio35mfa	TAREFA_VENCIDA	Tarefa Atrasada	Contactar FISIBELA - Vencida em 23/01/2026	f	cmkcnpx3g000jogntg4abd8u8	\N	cmkn6k78o000701wu2jut6gq7	\N	2026-01-24 17:52:31.067	\N
cmkslxmy6005y01zsjht3zeox	TAREFA_VENCIDA	Tarefa Atrasada	Contactar AGILREQUINTE - Vencida em 23/01/2026	f	cmkk41coe000301vjs2ey859r	\N	cmkn6k7bu000801wusbu7mkea	\N	2026-01-24 17:52:31.067	\N
cmkslxmy6005z01zs5ck87y3x	TAREFA_VENCIDA	Tarefa Atrasada	Contactar SANDRA LUZ - DEZ STUDIO - Vencida em 23/01/2026	f	cmkk57s2v000f01vjpcw5edlt	\N	cmkn6k7ek000901wub71fu5qs	\N	2026-01-24 17:52:31.067	\N
cmkslxmy7006001zs83sk373n	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Silkare - Vencida em 23/01/2026	f	cmkd2khtw0003pontk0fsp8w4	\N	cmkn6k835000a01wuffxtzdjh	\N	2026-01-24 17:52:31.067	\N
cmkslxmy7006101zs88f1me7r	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Isaura - Vencida em 23/01/2026	f	cmkd2khu20005pontjgu03va8	\N	cmkn6k8c1000b01wubpcafb3m	\N	2026-01-24 17:52:31.067	\N
cmkslxmy7006201zskj44gx2o	TAREFA_VENCIDA	Tarefa Atrasada	Contactar MARIA TERESA PINHO DUARTE - Vencida em 23/01/2026	f	cmkd6qsti0000cynty9veowk8	\N	cmkn6k8k2000c01wuar8qwit4	\N	2026-01-24 17:52:31.067	\N
cmkslxmy7006301zs02xddj9m	TAREFA_VENCIDA	Tarefa Atrasada	Contactar TRINDADE DA COSTA LUIS - Vencida em 23/01/2026	f	cmkd6qstz0001cynts3nac09o	\N	cmkn6k8mv000d01wu7ll68l72	\N	2026-01-24 17:52:31.067	\N
cmkslxmy7006401zshlx1rty5	TAREFA_VENCIDA	Tarefa Atrasada	Contactar PAULA GRACA J.SILVA - Vencida em 23/01/2026	f	cmkd6qsu40002cyntmtwkbs8f	\N	cmkn6k931000e01wuc8zqffkt	\N	2026-01-24 17:52:31.067	\N
cmkslxmy7006501zshruixtfw	TAREFA_VENCIDA	Tarefa Atrasada	Contactar INSTITUTO DE BELEZA CAB.LDA - Vencida em 23/01/2026	f	cmkd6qsu70003cyntf50v98ro	\N	cmkn6k9jw000g01wu5vydxlnq	\N	2026-01-24 17:52:31.067	\N
cmkslxmy7006601zs49f004g9	TAREFA_VENCIDA	Tarefa Atrasada	Contactar LURDES MARTA-ESTETICA E PERFUMARIA, LDA. - Vencida em 23/01/2026	f	cmkd6qsu90004cyntoujdyvh6	\N	cmkn6k9pk000h01wuj5zwehox	\N	2026-01-24 17:52:31.067	\N
cmkslxmy7006701zsibuxceag	TAREFA_VENCIDA	Tarefa Atrasada	Contactar LUCIA BATISTA UNIPESSOAL LDA - Vencida em 23/01/2026	f	cmkd6qsug0007cynt78amxldi	\N	cmkn6k9vo000i01wuw48gtd95	\N	2026-01-24 17:52:31.067	\N
cmkslxmy7006801zsu2r8rwye	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANA MARIA MAIA VILAS - Vencida em 23/01/2026	f	cmkd6qsui0008cynt0g8nss02	\N	cmkn6k9yb000j01wuvira7hfd	\N	2026-01-24 17:52:31.067	\N
cmkslxmy7006901zsgzgh1cpg	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANABELA DOMINGUES PEREIRA - Vencida em 23/01/2026	f	cmkd6qsul0009cynts5akpdj7	\N	cmkn6ka0r000k01wuiqmiexy6	\N	2026-01-24 17:52:31.067	\N
cmku9rf4s008r01zsbkh199pr	PAGAMENTO_ATRASADO	Pagamento em Atraso	LURDES MARTA-ESTETICA E PERFUMARIA, LDA. - Parcela 1 de 208.74€ vencida em 25/01/2026	f	cmkd6qsu90004cyntoujdyvh6	\N	\N	cmklq30fm000q01vuy1888l47	2026-01-25 21:47:17.972	\N
cmku9rf4s008s01zst5mjygx9	PAGAMENTO_ATRASADO	Pagamento em Atraso	FISIBELA - Parcela 1 de 182.76€ vencida em 20/01/2026	f	cmkcnpx3g000jogntg4abd8u8	\N	\N	cmkr9x8bz004s01zs9g3d3tf1	2026-01-25 21:47:17.972	\N
cmku9rf4s008t01zssd5rx9rk	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANA CRISTINA CHAGAS - Vencida em 23/01/2026	f	cmkk3ocbv000101vjx115msl5	\N	cmkn6k6k1000001wutm4cjlwp	\N	2026-01-25 21:47:17.972	\N
cmku9rf4s008u01zsq2lm6mgy	TAREFA_VENCIDA	Tarefa Atrasada	Contactar SPIRIT DAY SPA- MELISSA - Vencida em 23/01/2026	f	cmkcnpxd40038ogntjuwfp2oj	\N	cmkn6k6mz000101wueqel5pf5	\N	2026-01-25 21:47:17.972	\N
cmku9rf4s008v01zsurhhg2gb	TAREFA_VENCIDA	Tarefa Atrasada	Contactar GLAMOUR - Vencida em 23/01/2026	f	cmkcnpx38000fognt09x3o61e	\N	cmkn6k6p9000201wub3robfft	\N	2026-01-25 21:47:17.972	\N
cmku9rf4s008w01zsfkr895h2	TAREFA_VENCIDA	Tarefa Atrasada	Contactar IVONE RAMOS - Vencida em 23/01/2026	f	cmkcnpx4n0010ogntlgsvrd29	\N	cmkn6k6s4000301wue65sjmfz	\N	2026-01-25 21:47:17.972	\N
cmku9rf4t008x01zs9nip9k3u	TAREFA_VENCIDA	Tarefa Atrasada	Contactar FILIPA DANIELA PEREIRA - Vencida em 23/01/2026	f	cmkk4k9ba000501vj4ybqtwvg	\N	cmkn6k6ux000401wuf4tk0k2j	\N	2026-01-25 21:47:17.972	\N
cmku9rf4t008y01zsjny3ynjb	TAREFA_VENCIDA	Tarefa Atrasada	Contactar PAULA SANTANA - Vencida em 23/01/2026	f	cmkcnpx5p0019ognt0dfjus98	\N	cmkn6k70c000501wu0gyxnzt4	\N	2026-01-25 21:47:17.972	\N
cmku9rf4t008z01zsjbaz3ixf	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Pura Beleza - Vencida em 23/01/2026	f	cmkcnpx3c000hogntfv3f1nr9	\N	cmkn6k75o000601wuw37v56g4	\N	2026-01-25 21:47:17.972	\N
cmku9rf4t009001zst164kpl3	TAREFA_VENCIDA	Tarefa Atrasada	Contactar FISIBELA - Vencida em 23/01/2026	f	cmkcnpx3g000jogntg4abd8u8	\N	cmkn6k78o000701wu2jut6gq7	\N	2026-01-25 21:47:17.972	\N
cmku9rf4t009101zs592gv0w4	TAREFA_VENCIDA	Tarefa Atrasada	Contactar AGILREQUINTE - Vencida em 23/01/2026	f	cmkk41coe000301vjs2ey859r	\N	cmkn6k7bu000801wusbu7mkea	\N	2026-01-25 21:47:17.972	\N
cmku9rf4t009201zszsu2asgx	TAREFA_VENCIDA	Tarefa Atrasada	Contactar SANDRA LUZ - DEZ STUDIO - Vencida em 23/01/2026	f	cmkk57s2v000f01vjpcw5edlt	\N	cmkn6k7ek000901wub71fu5qs	\N	2026-01-25 21:47:17.972	\N
cmku9rf4t009301zsgcen81mk	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Silkare - Vencida em 23/01/2026	f	cmkd2khtw0003pontk0fsp8w4	\N	cmkn6k835000a01wuffxtzdjh	\N	2026-01-25 21:47:17.972	\N
cmku9rf4t009401zsv3xjxzvl	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Isaura - Vencida em 23/01/2026	f	cmkd2khu20005pontjgu03va8	\N	cmkn6k8c1000b01wubpcafb3m	\N	2026-01-25 21:47:17.972	\N
cmku9rf4t009501zsp1yu4jdj	TAREFA_VENCIDA	Tarefa Atrasada	Contactar MARIA TERESA PINHO DUARTE - Vencida em 23/01/2026	f	cmkd6qsti0000cynty9veowk8	\N	cmkn6k8k2000c01wuar8qwit4	\N	2026-01-25 21:47:17.972	\N
cmku9rf4t009601zswwh0x1vi	TAREFA_VENCIDA	Tarefa Atrasada	Contactar TRINDADE DA COSTA LUIS - Vencida em 23/01/2026	f	cmkd6qstz0001cynts3nac09o	\N	cmkn6k8mv000d01wu7ll68l72	\N	2026-01-25 21:47:17.972	\N
cmku9rf4t009701zsvz8a8u4j	TAREFA_VENCIDA	Tarefa Atrasada	Contactar PAULA GRACA J.SILVA - Vencida em 23/01/2026	f	cmkd6qsu40002cyntmtwkbs8f	\N	cmkn6k931000e01wuc8zqffkt	\N	2026-01-25 21:47:17.972	\N
cmku9rf4t009801zssozhotk2	TAREFA_VENCIDA	Tarefa Atrasada	Contactar INSTITUTO DE BELEZA CAB.LDA - Vencida em 23/01/2026	f	cmkd6qsu70003cyntf50v98ro	\N	cmkn6k9jw000g01wu5vydxlnq	\N	2026-01-25 21:47:17.972	\N
cmku9rf4t009901zs4ixvfd49	TAREFA_VENCIDA	Tarefa Atrasada	Contactar LURDES MARTA-ESTETICA E PERFUMARIA, LDA. - Vencida em 23/01/2026	f	cmkd6qsu90004cyntoujdyvh6	\N	cmkn6k9pk000h01wuj5zwehox	\N	2026-01-25 21:47:17.972	\N
cmku9rf4u009a01zs2iaa3da4	TAREFA_VENCIDA	Tarefa Atrasada	Contactar LUCIA BATISTA UNIPESSOAL LDA - Vencida em 23/01/2026	f	cmkd6qsug0007cynt78amxldi	\N	cmkn6k9vo000i01wuw48gtd95	\N	2026-01-25 21:47:17.972	\N
cmku9rf4u009b01zsc9jiaze7	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANA MARIA MAIA VILAS - Vencida em 23/01/2026	f	cmkd6qsui0008cynt0g8nss02	\N	cmkn6k9yb000j01wuvira7hfd	\N	2026-01-25 21:47:17.972	\N
cmku9rf4u009c01zs3bb9f9pe	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANABELA DOMINGUES PEREIRA - Vencida em 23/01/2026	f	cmkd6qsul0009cynts5akpdj7	\N	cmkn6ka0r000k01wuiqmiexy6	\N	2026-01-25 21:47:17.972	\N
cmkv00a0j00bc01zs6mxddoyr	PAGAMENTO_ATRASADO	Pagamento em Atraso	LUCIA BATISTA UNIPESSOAL LDA - Parcela 1 de 269.89€ vencida em 26/01/2026	f	cmkd6qsug0007cynt78amxldi	\N	\N	cmkqrzr640004010gii6lhzas	2026-01-26 10:02:01.198	\N
cmkvb0op800d701zskte1b0cb	LEAD_PARADO	Lead Parado	Bia Lacerda Cabeleireiros - Nunca contactado	f	\N	cmkqsd6h50007010g7dd4jrbf	\N	\N	2026-01-26 15:10:16.072	\N
cmkvb0op900d801zsyexvpf3t	LEAD_PARADO	Lead Parado	SF Estética Facial Corporal - Nunca contactado	f	\N	cmkquzm86001701w3rub327u9	\N	\N	2026-01-26 15:10:16.072	\N
cmkvb0op900d901zs5on4413l	LEAD_PARADO	Lead Parado	Andreia Barbosa Cabeleireiro e Estética - Nunca contactado	f	\N	cmkqwfefv00170121fnelm5ll	\N	\N	2026-01-26 15:10:16.072	\N
cmkvb0op900da01zse8x9ba5d	LEAD_PARADO	Lead Parado	Madalena Neves Estética - Nunca contactado	f	\N	cmkv0f4qv00c701zstd2ufvik	\N	\N	2026-01-26 15:10:16.072	\N
cmkvb0op900db01zs7oe2qn7m	LEAD_PARADO	Lead Parado	!TU Beauty Zone - Nunca contactado	f	\N	cmkv13v1000c801zslp9xij13	\N	\N	2026-01-26 15:10:16.072	\N
cmkvb0op900dc01zs0ol0fpgq	LEAD_PARADO	Lead Parado	Amor Perfeito Beleza e Eventos - Nunca contactado	f	\N	cmkv53pve00c901zsohh83mjz	\N	\N	2026-01-26 15:10:16.072	\N
cmkwb1cyv00fy01zsz98p53do	PAGAMENTO_ATRASADO	Pagamento em Atraso	LURDES MARTA-ESTETICA E PERFUMARIA, LDA. - Parcela 1 de 208.74€ vencida em 25/01/2026	f	cmkd6qsu90004cyntoujdyvh6	\N	\N	cmklq30fm000q01vuy1888l47	2026-01-27 07:58:33.697	\N
cmkwb1cyw00fz01zsnelper63	PAGAMENTO_ATRASADO	Pagamento em Atraso	FISIBELA - Parcela 1 de 182.76€ vencida em 20/01/2026	f	cmkcnpx3g000jogntg4abd8u8	\N	\N	cmkr9x8bz004s01zs9g3d3tf1	2026-01-27 07:58:33.697	\N
cmkwb1cyw00g001zsfka170jt	PAGAMENTO_ATRASADO	Pagamento em Atraso	LA DONNA - ESTETICA & CABELEIREIRO UNIPESSOAL LDA - Parcela 1 de 168.92€ vencida em 27/01/2026	f	cmkd6qsvi000ocyntovbzv27e	\N	\N	cmkvauufi00cc01zsjwthk50l	2026-01-27 07:58:33.697	\N
cmkwb1cyw00g101zsrn737bsc	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkvb0msb00cf01zs725u43ji	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyw00g201zsb2bbgpvr	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkvb2luk00dt01zsseyp6cxx	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyw00g301zsahoxjisv	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANA CRISTINA CHAGAS - Vencida em 23/01/2026	f	cmkk3ocbv000101vjx115msl5	\N	cmkn6k6k1000001wutm4cjlwp	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyw00g401zsmbtk71cu	TAREFA_VENCIDA	Tarefa Atrasada	Contactar SPIRIT DAY SPA- MELISSA - Vencida em 23/01/2026	f	cmkcnpxd40038ogntjuwfp2oj	\N	cmkn6k6mz000101wueqel5pf5	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyw00g501zs3a5yijwl	TAREFA_VENCIDA	Tarefa Atrasada	Contactar GLAMOUR - Vencida em 23/01/2026	f	cmkcnpx38000fognt09x3o61e	\N	cmkn6k6p9000201wub3robfft	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyw00g601zs2xd24tbv	TAREFA_VENCIDA	Tarefa Atrasada	Contactar IVONE RAMOS - Vencida em 23/01/2026	f	cmkcnpx4n0010ogntlgsvrd29	\N	cmkn6k6s4000301wue65sjmfz	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyw00g701zso8as2bqp	TAREFA_VENCIDA	Tarefa Atrasada	Contactar FILIPA DANIELA PEREIRA - Vencida em 23/01/2026	f	cmkk4k9ba000501vj4ybqtwvg	\N	cmkn6k6ux000401wuf4tk0k2j	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyw00g801zswr5r0ft5	TAREFA_VENCIDA	Tarefa Atrasada	Contactar PAULA SANTANA - Vencida em 23/01/2026	f	cmkcnpx5p0019ognt0dfjus98	\N	cmkn6k70c000501wu0gyxnzt4	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyw00g901zs399xukjb	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Pura Beleza - Vencida em 23/01/2026	f	cmkcnpx3c000hogntfv3f1nr9	\N	cmkn6k75o000601wuw37v56g4	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyw00ga01zsfuypiz9l	TAREFA_VENCIDA	Tarefa Atrasada	Contactar FISIBELA - Vencida em 23/01/2026	f	cmkcnpx3g000jogntg4abd8u8	\N	cmkn6k78o000701wu2jut6gq7	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyx00gb01zsl6nnav0a	TAREFA_VENCIDA	Tarefa Atrasada	Contactar AGILREQUINTE - Vencida em 23/01/2026	f	cmkk41coe000301vjs2ey859r	\N	cmkn6k7bu000801wusbu7mkea	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyx00gc01zsknkahkc8	TAREFA_VENCIDA	Tarefa Atrasada	Contactar SANDRA LUZ - DEZ STUDIO - Vencida em 23/01/2026	f	cmkk57s2v000f01vjpcw5edlt	\N	cmkn6k7ek000901wub71fu5qs	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyx00gd01zsvnl5ndfy	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Silkare - Vencida em 23/01/2026	f	cmkd2khtw0003pontk0fsp8w4	\N	cmkn6k835000a01wuffxtzdjh	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyx00ge01zsunnzyo6i	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Isaura - Vencida em 23/01/2026	f	cmkd2khu20005pontjgu03va8	\N	cmkn6k8c1000b01wubpcafb3m	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyx00gf01zsptx2yndl	TAREFA_VENCIDA	Tarefa Atrasada	Contactar MARIA TERESA PINHO DUARTE - Vencida em 23/01/2026	f	cmkd6qsti0000cynty9veowk8	\N	cmkn6k8k2000c01wuar8qwit4	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyx00gg01zsxyxtzu8t	TAREFA_VENCIDA	Tarefa Atrasada	Contactar TRINDADE DA COSTA LUIS - Vencida em 23/01/2026	f	cmkd6qstz0001cynts3nac09o	\N	cmkn6k8mv000d01wu7ll68l72	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyx00gh01zs35i1ogrg	TAREFA_VENCIDA	Tarefa Atrasada	Contactar PAULA GRACA J.SILVA - Vencida em 23/01/2026	f	cmkd6qsu40002cyntmtwkbs8f	\N	cmkn6k931000e01wuc8zqffkt	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyx00gi01zs0pdydk7e	TAREFA_VENCIDA	Tarefa Atrasada	Contactar INSTITUTO DE BELEZA CAB.LDA - Vencida em 23/01/2026	f	cmkd6qsu70003cyntf50v98ro	\N	cmkn6k9jw000g01wu5vydxlnq	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyx00gj01zsiyfck5iy	TAREFA_VENCIDA	Tarefa Atrasada	Contactar LURDES MARTA-ESTETICA E PERFUMARIA, LDA. - Vencida em 23/01/2026	f	cmkd6qsu90004cyntoujdyvh6	\N	cmkn6k9pk000h01wuj5zwehox	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyx00gk01zsecqegwrw	TAREFA_VENCIDA	Tarefa Atrasada	Contactar LUCIA BATISTA UNIPESSOAL LDA - Vencida em 23/01/2026	f	cmkd6qsug0007cynt78amxldi	\N	cmkn6k9vo000i01wuw48gtd95	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyx00gl01zstync29c6	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANA MARIA MAIA VILAS - Vencida em 23/01/2026	f	cmkd6qsui0008cynt0g8nss02	\N	cmkn6k9yb000j01wuvira7hfd	\N	2026-01-27 07:58:33.697	\N
cmkwb1cyx00gm01zscjqix086	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANABELA DOMINGUES PEREIRA - Vencida em 23/01/2026	f	cmkd6qsul0009cynts5akpdj7	\N	cmkn6ka0r000k01wuiqmiexy6	\N	2026-01-27 07:58:33.697	\N
cmkwhe82c00ho01zsw49djsl1	PAGAMENTO_ATRASADO	Pagamento em Atraso	LUCIA BATISTA UNIPESSOAL LDA - Parcela 1 de 269.89€ vencida em 26/01/2026	t	cmkd6qsug0007cynt78amxldi	\N	\N	cmkqrzr640004010gii6lhzas	2026-01-27 10:56:31.568	2026-01-27 19:59:09.965
cmky2v648001201zsw3qushg9	PAGAMENTO_ATRASADO	Pagamento em Atraso	LURDES MARTA-ESTETICA E PERFUMARIA, LDA. - Parcela 1 de 208.74€ vencida em 25/01/2026	f	cmkd6qsu90004cyntoujdyvh6	\N	\N	cmklq30fm000q01vuy1888l47	2026-01-28 13:45:20.256	\N
cmky2v649001301zsxa0idimw	PAGAMENTO_ATRASADO	Pagamento em Atraso	LUCIA BATISTA UNIPESSOAL LDA - Parcela 1 de 269.89€ vencida em 26/01/2026	f	cmkd6qsug0007cynt78amxldi	\N	\N	cmkqrzr640004010gii6lhzas	2026-01-28 13:45:20.256	\N
cmky2v649001401zsmlxatml9	PAGAMENTO_ATRASADO	Pagamento em Atraso	FISIBELA - Parcela 1 de 182.76€ vencida em 20/01/2026	f	cmkcnpx3g000jogntg4abd8u8	\N	\N	cmkr9x8bz004s01zs9g3d3tf1	2026-01-28 13:45:20.256	\N
cmky2v649001501zslir9hggk	PAGAMENTO_ATRASADO	Pagamento em Atraso	LA DONNA - ESTETICA & CABELEIREIRO UNIPESSOAL LDA - Parcela 1 de 168.92€ vencida em 27/01/2026	f	cmkd6qsvi000ocyntovbzv27e	\N	\N	cmkvauufi00cc01zsjwthk50l	2026-01-28 13:45:20.256	\N
cmky2v649001601zsniknwpee	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkwb1a6d00f101zsq97kqnxz	\N	2026-01-28 13:45:20.256	\N
cmky2v649001701zsql7pgja0	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkwhe61x00gy01zsnzjdnzs2	\N	2026-01-28 13:45:20.256	\N
cmky2v649001801zsjaa43t8w	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkwrcsjp00i701zsp5fgvzwb	\N	2026-01-28 13:45:20.256	\N
cmky2v649001901zsuzh0ox7c	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkwrdky000jf01zsfqetst7d	\N	2026-01-28 13:45:20.256	\N
cmky2v649001a01zsic8drd2r	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkwrdq4x00kn01zse3v9i653	\N	2026-01-28 13:45:20.256	\N
cmky2v649001b01zs10gnouz1	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkwvvd8y00lv01zsftlwku59	\N	2026-01-28 13:45:20.256	\N
cmky2v649001c01zstwn4594r	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkx0oxst00n301zs7usv8q35	\N	2026-01-28 13:45:20.256	\N
cmky2v649001d01zss1hvgdhw	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkx0qu5k00ob01zsudovfeo2	\N	2026-01-28 13:45:20.256	\N
cmky2v649001e01zsyzxz1a9g	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkx0vz3y00pj01zshqdcnq6d	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001f01zsddei6z8b	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkx14px400qr01zscc2y8s98	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001g01zsvaxl7sqt	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkx16agt00rz01zsai2hxpg8	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001h01zsalup1d0k	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANA CRISTINA CHAGAS - Vencida em 23/01/2026	f	cmkk3ocbv000101vjx115msl5	\N	cmkn6k6k1000001wutm4cjlwp	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001i01zs1v09apln	TAREFA_VENCIDA	Tarefa Atrasada	Contactar SPIRIT DAY SPA- MELISSA - Vencida em 23/01/2026	f	cmkcnpxd40038ogntjuwfp2oj	\N	cmkn6k6mz000101wueqel5pf5	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001j01zslh0uckml	TAREFA_VENCIDA	Tarefa Atrasada	Contactar GLAMOUR - Vencida em 23/01/2026	f	cmkcnpx38000fognt09x3o61e	\N	cmkn6k6p9000201wub3robfft	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001k01zsvc9vozkg	TAREFA_VENCIDA	Tarefa Atrasada	Contactar IVONE RAMOS - Vencida em 23/01/2026	f	cmkcnpx4n0010ogntlgsvrd29	\N	cmkn6k6s4000301wue65sjmfz	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001l01zsbxgpusbv	TAREFA_VENCIDA	Tarefa Atrasada	Contactar FILIPA DANIELA PEREIRA - Vencida em 23/01/2026	f	cmkk4k9ba000501vj4ybqtwvg	\N	cmkn6k6ux000401wuf4tk0k2j	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001m01zs7m7na8m8	TAREFA_VENCIDA	Tarefa Atrasada	Contactar PAULA SANTANA - Vencida em 23/01/2026	f	cmkcnpx5p0019ognt0dfjus98	\N	cmkn6k70c000501wu0gyxnzt4	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001n01zsd82c5icz	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Pura Beleza - Vencida em 23/01/2026	f	cmkcnpx3c000hogntfv3f1nr9	\N	cmkn6k75o000601wuw37v56g4	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001o01zswwg95x3w	TAREFA_VENCIDA	Tarefa Atrasada	Contactar FISIBELA - Vencida em 23/01/2026	f	cmkcnpx3g000jogntg4abd8u8	\N	cmkn6k78o000701wu2jut6gq7	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001p01zsxypv0uh0	TAREFA_VENCIDA	Tarefa Atrasada	Contactar AGILREQUINTE - Vencida em 23/01/2026	f	cmkk41coe000301vjs2ey859r	\N	cmkn6k7bu000801wusbu7mkea	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001q01zsa8ctfazp	TAREFA_VENCIDA	Tarefa Atrasada	Contactar SANDRA LUZ - DEZ STUDIO - Vencida em 23/01/2026	f	cmkk57s2v000f01vjpcw5edlt	\N	cmkn6k7ek000901wub71fu5qs	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001r01zsh2xr5isi	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Silkare - Vencida em 23/01/2026	f	cmkd2khtw0003pontk0fsp8w4	\N	cmkn6k835000a01wuffxtzdjh	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001s01zsmw0awcck	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Isaura - Vencida em 23/01/2026	f	cmkd2khu20005pontjgu03va8	\N	cmkn6k8c1000b01wubpcafb3m	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001t01zse7umrym6	TAREFA_VENCIDA	Tarefa Atrasada	Contactar MARIA TERESA PINHO DUARTE - Vencida em 23/01/2026	f	cmkd6qsti0000cynty9veowk8	\N	cmkn6k8k2000c01wuar8qwit4	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001u01zsqa3ze2er	TAREFA_VENCIDA	Tarefa Atrasada	Contactar TRINDADE DA COSTA LUIS - Vencida em 23/01/2026	f	cmkd6qstz0001cynts3nac09o	\N	cmkn6k8mv000d01wu7ll68l72	\N	2026-01-28 13:45:20.256	\N
cmky2v64a001v01zs6pa77yy7	TAREFA_VENCIDA	Tarefa Atrasada	Contactar PAULA GRACA J.SILVA - Vencida em 23/01/2026	f	cmkd6qsu40002cyntmtwkbs8f	\N	cmkn6k931000e01wuc8zqffkt	\N	2026-01-28 13:45:20.256	\N
cmky2v64b001w01zs6jrzvu3i	TAREFA_VENCIDA	Tarefa Atrasada	Contactar INSTITUTO DE BELEZA CAB.LDA - Vencida em 23/01/2026	f	cmkd6qsu70003cyntf50v98ro	\N	cmkn6k9jw000g01wu5vydxlnq	\N	2026-01-28 13:45:20.256	\N
cmky2v64b001x01zswfikdpol	TAREFA_VENCIDA	Tarefa Atrasada	Contactar LURDES MARTA-ESTETICA E PERFUMARIA, LDA. - Vencida em 23/01/2026	f	cmkd6qsu90004cyntoujdyvh6	\N	cmkn6k9pk000h01wuj5zwehox	\N	2026-01-28 13:45:20.256	\N
cmky2v64b001y01zs3mfwb33g	TAREFA_VENCIDA	Tarefa Atrasada	Contactar LUCIA BATISTA UNIPESSOAL LDA - Vencida em 23/01/2026	f	cmkd6qsug0007cynt78amxldi	\N	cmkn6k9vo000i01wuw48gtd95	\N	2026-01-28 13:45:20.256	\N
cmky2v64b001z01zsie6sxmf9	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANA MARIA MAIA VILAS - Vencida em 23/01/2026	f	cmkd6qsui0008cynt0g8nss02	\N	cmkn6k9yb000j01wuvira7hfd	\N	2026-01-28 13:45:20.256	\N
cmky2v64b002001zse1vn80gr	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANABELA DOMINGUES PEREIRA - Vencida em 23/01/2026	f	cmkd6qsul0009cynts5akpdj7	\N	cmkn6ka0r000k01wuiqmiexy6	\N	2026-01-28 13:45:20.256	\N
cmky2v64b002101zsnk919qsk	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	GLAMOUR - Nunca contactado	f	cmkcnpx38000fognt09x3o61e	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64b002201zsc9n6e6mt	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	Pura Beleza - Nunca contactado	f	cmkcnpx3c000hogntfv3f1nr9	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64b002301zsnqjw7ib1	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	FISIBELA - Nunca contactado	f	cmkcnpx3g000jogntg4abd8u8	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64b002401zs8q26om4h	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	SETIMA ESSENCIA- CELIA VICENTE - Nunca contactado	f	cmkcnpx4c000wogntmcv0avh1	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64b002501zspchwr661	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	IVONE RAMOS - Nunca contactado	f	cmkcnpx4n0010ogntlgsvrd29	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64b002601zsc86ydclj	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	SILVIA RODRIGUES NETO - Nunca contactado	f	cmkcnpx500013ogntjiccf4oy	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64b002701zsoj5usw2m	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	PAULA SANTANA - Nunca contactado	f	cmkcnpx5p0019ognt0dfjus98	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64b002801zsg5jtq83w	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	ANA CAMEIRA - Nunca contactado	f	cmkcnpx5x001bognt92v67fth	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64c002901zs19km9f4x	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	INSTANTES DISTANTES- CARLA RAPOSO - Nunca contactado	f	cmkcnpx9j0026ogntdzgxb566	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64c002a01zsost7sqp7	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	JOANA SIMÕES  - Nunca contactado	f	cmkcnpxa3002bogntjck4ynlc	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64c002b01zs357je6lx	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	SPIRIT DAY SPA- MELISSA - Nunca contactado	f	cmkcnpxd40038ogntjuwfp2oj	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64c002c01zsf9xnlsro	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	Silkare - Nunca contactado	f	cmkd2khtw0003pontk0fsp8w4	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64c002d01zsjvflfm7r	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	Isaura - Nunca contactado	f	cmkd2khu20005pontjgu03va8	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64f002e01zswepaxn8q	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	MARIA TERESA PINHO DUARTE - Nunca contactado	f	cmkd6qsti0000cynty9veowk8	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64f002f01zsgp522fpo	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	TRINDADE DA COSTA LUIS - Nunca contactado	f	cmkd6qstz0001cynts3nac09o	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64f002g01zsw5w1b12d	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	PAULA GRACA J.SILVA - Nunca contactado	f	cmkd6qsu40002cyntmtwkbs8f	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64f002h01zssr5sw339	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	INSTITUTO DE BELEZA CAB.LDA - Nunca contactado	f	cmkd6qsu70003cyntf50v98ro	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64f002i01zsuxm6s26l	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	LURDES MARTA-ESTETICA E PERFUMARIA, LDA. - Nunca contactado	f	cmkd6qsu90004cyntoujdyvh6	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64f002j01zs1m9hi843	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	LUCIA BATISTA UNIPESSOAL LDA - Nunca contactado	f	cmkd6qsug0007cynt78amxldi	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmky2v64f002k01zswlqx2x0x	CLIENTE_SEM_CONTACTO	Cliente sem Contacto	ANA MARIA MAIA VILAS - Nunca contactado	f	cmkd6qsui0008cynt0g8nss02	\N	\N	\N	2026-01-28 13:45:20.256	\N
cmkyp11sk001a01xh5l92861h	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmky2v0tw000001zsmxdaajz0	\N	2026-01-29 00:05:46.19	\N
cmkyp11sk001b01xhit3cnucv	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmky2v0u9000101zsgchd69c8	\N	2026-01-29 00:05:46.19	\N
cmkyp11sk001c01xh7u4qyh2k	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmky2v0va000201zsn1al74w5	\N	2026-01-29 00:05:46.19	\N
cmkyp11sk001d01xhrw6s95av	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmky2wo09002t01zsmk9ishc3	\N	2026-01-29 00:05:46.19	\N
cmkyp11sk001e01xhb2magv7r	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmky2wo7l002u01zscard7wd9	\N	2026-01-29 00:05:46.19	\N
cmkyp11sk001f01xhegmwrghx	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmky2woa7002v01zsrawwszx9	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001g01xhzzate6cy	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmky2y86s004301zshhfkdupr	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001h01xh14xgig53	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmky2y897004401zst0ueevmo	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001i01xhs45kw846	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmky2y89i004501zsx6w5mse2	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001j01xhlbnl9gy5	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmky3gh4i005g01zsbtm993ps	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001k01xhjl9vp0ci	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmky3gh6e005h01zsxkyely8b	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001l01xhxsq9yizo	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmky3gh79005i01zsoyg4c65c	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001m01xh3yc3fkvo	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmky9ja5g006q01zsdzd81csn	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001n01xhrwthzh0z	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmky9ja7x006r01zse9nynlmk	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001o01xh0kpumgmz	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmky9jaaa006s01zs8dmkdclu	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001p01xhdkwegri2	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkyfzaay008001zsoq5hy1rz	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001q01xhzmxs203w	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkyfzab5008101zsqreop7jc	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001r01xh5tea1bpf	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkyfzabd008201zstcy1qlbd	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001s01xh6uf6i9ok	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkyg7xkh009d01zstgdpxsxz	\N	2026-01-29 00:05:46.19	\N
cmkyp11sl001t01xh3wadok8w	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkyg7xmo009e01zssdtxe5v8	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm001u01xhgpcj9cnl	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkyg7xpo009f01zsxxz84q62	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm001v01xhqtt9xfyy	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkygcjam00an01zsj8cfdtwe	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm001w01xhij07sx7f	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkygcjck00ao01zsrlth9l0a	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm001x01xhg7kkl1i6	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkygcjcu00ap01zs76ymkc4d	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm001y01xhnupidh88	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkyjqd0l00000101rg02k1u9	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm001z01xh3yr57esu	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkyjqd0t00010101p2vw1yye	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm002001xh8gegx30c	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkyjqd3m00020101psssxmbr	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm002101xhput4aa9o	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkyjz5u7001a0101qcwmaa7s	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm002201xhb7m77rt7	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkyjz5wr001b01011snyw04r	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm002301xh5ctzvia6	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkyjz5x1001c01015cg6lmz9	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm002401xhukcbwrsj	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkykq321002n0101o5ze7y6v	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm002501xh8oh2c6j3	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkykq32f002o0101k6dp06es	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm002601xhw7qfi7gu	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkykq34o002p0101cv7a1e92	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm002701xhkoizn18d	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkykq7j4003x0101nlwbudln	\N	2026-01-29 00:05:46.19	\N
cmkyp11sm002801xhtq4aika0	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkykq7jl003y0101ll9hxzgq	\N	2026-01-29 00:05:46.19	\N
cmkyp11so002901xh6lfgio8x	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkykq7js003z0101rz9d4z9n	\N	2026-01-29 00:05:46.19	\N
cmkyp11so002a01xhtz6j8jah	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkykqa8a00570101orq99w8g	\N	2026-01-29 00:05:46.19	\N
cmkyp11so002b01xhw0pll0aa	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkykqa8l005801017hdbwrmc	\N	2026-01-29 00:05:46.19	\N
cmkyp11so002c01xhbwqyu9oe	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkykqa8t005901011t6bn8rq	\N	2026-01-29 00:05:46.19	\N
cmkyp11so002d01xhbpbt7kcu	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkylu3ap000301x64lwr1k27	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002e01xh1exydl0k	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkylu3b0000401x6ylnf52fa	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002f01xh3feyte0h	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkylu3by000501x6v0qdv0r0	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002g01xhi679f8e3	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkymwwza000001wtfazx10sa	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002h01xhh6ex8m09	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkymwx21000101wtyixmciy1	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002i01xhsf2pd6cp	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkymwx2y000201wtw83as9z5	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002j01xhcieberve	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkymyntw001a01wtjc2fq67c	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002k01xhcrjlcr6c	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkymynx4001b01wtiee1v1uq	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002l01xh5yobej6z	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkymynxo001c01wtsqvznjqo	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002m01xhrdoe8keb	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkyn47y3000001zqmi8waylw	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002n01xhfyav5tyl	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkyn480f000101zqf2vitj3a	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002o01xhylqa8yp3	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkyn483e000201zqae3udjh7	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002p01xh1ylvqr18	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkyn5n0t001a01zq1bz0pnkc	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002q01xh9i9q444g	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkyn5n3l001b01zqogpvqe6q	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002r01xhufwuwp3l	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkyn5n63001c01zqqrxoyi9b	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002s01xh2tcskxyh	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkyn5tew002k01zqyz33yue5	\N	2026-01-29 00:05:46.19	\N
cmkyp11sp002t01xhtuzuvp8n	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkyn5tf6002l01zqdj3wx19m	\N	2026-01-29 00:05:46.19	\N
cmkyp11sq002u01xhevvlsgia	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkyn5tfe002m01zq4nsga8ux	\N	2026-01-29 00:05:46.19	\N
cmkyp11sq002v01xhf8v9dvie	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkynjt1u003u01zqmoxw90vn	\N	2026-01-29 00:05:46.19	\N
cmkyp11sq002w01xhaag7le2k	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkynjt4e003v01zqdcrn66em	\N	2026-01-29 00:05:46.19	\N
cmkyp11sq002x01xh4h9mammm	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkynjt4s003w01zq04sw1abc	\N	2026-01-29 00:05:46.19	\N
cmkzfv59n001c01x66plr9prd	LEAD_PARADO	Lead Parado	Estudio 86 - Nunca contactado	f	\N	cmkzeavml000001wt94smfwa6	\N	\N	2026-01-29 12:37:00.391	\N
cmkzfv59n001d01x6i03ckyxe	LEAD_PARADO	Lead Parado	Noemie Flor Estética  - Nunca contactado	f	\N	cmkzes9as000101x6370i8ibf	\N	\N	2026-01-29 12:37:00.391	\N
cmkzl53w0001a01xsonr1to7n	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANA CRISTINA CHAGAS - Vencida em 23/01/2026	f	cmkk3ocbv000101vjx115msl5	\N	cmkn6k6k1000001wutm4cjlwp	\N	2026-01-29 15:04:43.244	\N
cmkzl53w0001b01xsqhqf0fi9	TAREFA_VENCIDA	Tarefa Atrasada	Contactar SPIRIT DAY SPA- MELISSA - Vencida em 23/01/2026	f	cmkcnpxd40038ogntjuwfp2oj	\N	cmkn6k6mz000101wueqel5pf5	\N	2026-01-29 15:04:43.244	\N
cmkzl53w0001c01xsckkevqdv	TAREFA_VENCIDA	Tarefa Atrasada	Contactar GLAMOUR - Vencida em 23/01/2026	f	cmkcnpx38000fognt09x3o61e	\N	cmkn6k6p9000201wub3robfft	\N	2026-01-29 15:04:43.244	\N
cmkzl53w0001d01xss8gz2uec	TAREFA_VENCIDA	Tarefa Atrasada	Contactar IVONE RAMOS - Vencida em 23/01/2026	f	cmkcnpx4n0010ogntlgsvrd29	\N	cmkn6k6s4000301wue65sjmfz	\N	2026-01-29 15:04:43.244	\N
cmkzl53w0001e01xsvoe6sg9h	TAREFA_VENCIDA	Tarefa Atrasada	Contactar FILIPA DANIELA PEREIRA - Vencida em 23/01/2026	f	cmkk4k9ba000501vj4ybqtwvg	\N	cmkn6k6ux000401wuf4tk0k2j	\N	2026-01-29 15:04:43.244	\N
cmkzl53w0001f01xsxemcha75	TAREFA_VENCIDA	Tarefa Atrasada	Contactar PAULA SANTANA - Vencida em 23/01/2026	f	cmkcnpx5p0019ognt0dfjus98	\N	cmkn6k70c000501wu0gyxnzt4	\N	2026-01-29 15:04:43.244	\N
cmkzl53w0001g01xsbun48ms3	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Pura Beleza - Vencida em 23/01/2026	f	cmkcnpx3c000hogntfv3f1nr9	\N	cmkn6k75o000601wuw37v56g4	\N	2026-01-29 15:04:43.244	\N
cmkzl53w0001h01xslpcz3plk	TAREFA_VENCIDA	Tarefa Atrasada	Contactar FISIBELA - Vencida em 23/01/2026	f	cmkcnpx3g000jogntg4abd8u8	\N	cmkn6k78o000701wu2jut6gq7	\N	2026-01-29 15:04:43.244	\N
cmkzl53w0001i01xs9wimcta0	TAREFA_VENCIDA	Tarefa Atrasada	Contactar AGILREQUINTE - Vencida em 23/01/2026	f	cmkk41coe000301vjs2ey859r	\N	cmkn6k7bu000801wusbu7mkea	\N	2026-01-29 15:04:43.244	\N
cmkzl53w1001j01xs5r0b2d0o	TAREFA_VENCIDA	Tarefa Atrasada	Contactar SANDRA LUZ - DEZ STUDIO - Vencida em 23/01/2026	f	cmkk57s2v000f01vjpcw5edlt	\N	cmkn6k7ek000901wub71fu5qs	\N	2026-01-29 15:04:43.244	\N
cmkzl53w1001k01xsvdetuj0w	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Silkare - Vencida em 23/01/2026	f	cmkd2khtw0003pontk0fsp8w4	\N	cmkn6k835000a01wuffxtzdjh	\N	2026-01-29 15:04:43.244	\N
cmkzl53w1001l01xs7i49psqn	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Isaura - Vencida em 23/01/2026	f	cmkd2khu20005pontjgu03va8	\N	cmkn6k8c1000b01wubpcafb3m	\N	2026-01-29 15:04:43.244	\N
cmkzl53w1001m01xscx506866	TAREFA_VENCIDA	Tarefa Atrasada	Contactar MARIA TERESA PINHO DUARTE - Vencida em 23/01/2026	f	cmkd6qsti0000cynty9veowk8	\N	cmkn6k8k2000c01wuar8qwit4	\N	2026-01-29 15:04:43.244	\N
cmkzl53w1001n01xstdzkqa5q	TAREFA_VENCIDA	Tarefa Atrasada	Contactar TRINDADE DA COSTA LUIS - Vencida em 23/01/2026	f	cmkd6qstz0001cynts3nac09o	\N	cmkn6k8mv000d01wu7ll68l72	\N	2026-01-29 15:04:43.244	\N
cmkzl53w1001o01xslcbzxq4k	TAREFA_VENCIDA	Tarefa Atrasada	Contactar PAULA GRACA J.SILVA - Vencida em 23/01/2026	f	cmkd6qsu40002cyntmtwkbs8f	\N	cmkn6k931000e01wuc8zqffkt	\N	2026-01-29 15:04:43.244	\N
cmkzl53w1001p01xsjwg9iff3	TAREFA_VENCIDA	Tarefa Atrasada	Contactar INSTITUTO DE BELEZA CAB.LDA - Vencida em 23/01/2026	f	cmkd6qsu70003cyntf50v98ro	\N	cmkn6k9jw000g01wu5vydxlnq	\N	2026-01-29 15:04:43.244	\N
cmkzl53w1001q01xsbjyb4kom	TAREFA_VENCIDA	Tarefa Atrasada	Contactar LURDES MARTA-ESTETICA E PERFUMARIA, LDA. - Vencida em 23/01/2026	f	cmkd6qsu90004cyntoujdyvh6	\N	cmkn6k9pk000h01wuj5zwehox	\N	2026-01-29 15:04:43.244	\N
cmkzl53w1001r01xsz39qytx0	TAREFA_VENCIDA	Tarefa Atrasada	Contactar LUCIA BATISTA UNIPESSOAL LDA - Vencida em 23/01/2026	f	cmkd6qsug0007cynt78amxldi	\N	cmkn6k9vo000i01wuw48gtd95	\N	2026-01-29 15:04:43.244	\N
cmkzl53w1001s01xsgfnhsniu	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANA MARIA MAIA VILAS - Vencida em 23/01/2026	f	cmkd6qsui0008cynt0g8nss02	\N	cmkn6k9yb000j01wuvira7hfd	\N	2026-01-29 15:04:43.244	\N
cmkzl53w1001t01xsi20fb6in	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANABELA DOMINGUES PEREIRA - Vencida em 23/01/2026	f	cmkd6qsul0009cynts5akpdj7	\N	cmkn6ka0r000k01wuiqmiexy6	\N	2026-01-29 15:04:43.244	\N
cmkzlqucd001a011sdmikgy7a	LEAD_PARADO	Lead Parado	Bia Lacerda Cabeleireiros - Nunca contactado	f	\N	cmkqsd6h50007010g7dd4jrbf	\N	\N	2026-01-29 15:21:37.306	\N
cmkzlqucd001b011sv31ae8bg	LEAD_PARADO	Lead Parado	Andreia Barbosa Cabeleireiro e Estética - Nunca contactado	f	\N	cmkqwfefv00170121fnelm5ll	\N	\N	2026-01-29 15:21:37.306	\N
cmkzlquce001c011s7dv058aa	LEAD_PARADO	Lead Parado	!TU Beauty Zone - Nunca contactado	f	\N	cmkv13v1000c801zslp9xij13	\N	\N	2026-01-29 15:21:37.306	\N
cmkzlquce001d011stth8degk	LEAD_PARADO	Lead Parado	Amor Perfeito Beleza e Eventos - Nunca contactado	f	\N	cmkv53pve00c901zsohh83mjz	\N	\N	2026-01-29 15:21:37.306	\N
cml04azln00540115xea0bvl8	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkyp0uap000001xhpp2pjbxs	\N	2026-01-30 00:01:10.322	\N
cml04azln00550115bmmrorje	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkyp0udo000101xh60xnzay8	\N	2026-01-30 00:01:10.322	\N
cml04azlo00560115mmacdbgm	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkyp0ue7000201xh7q1u57t8	\N	2026-01-30 00:01:10.322	\N
cml04azlo005701158t41vsow	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkyp93bl003001xhqevwtz0e	\N	2026-01-30 00:01:10.322	\N
cml04azlo00580115gwigajbp	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkyp93d9003101xhxp0kn0xi	\N	2026-01-30 00:01:10.322	\N
cml04azlo005901155ue063y7	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkyp93di003201xhn2vflgln	\N	2026-01-30 00:01:10.322	\N
cml04azlo005a01156kyeabe7	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzcabrz000001zih2eor9m6	\N	2026-01-30 00:01:10.322	\N
cml04azlo005b011535fji288	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzcabuj000101zibo6dbgky	\N	2026-01-30 00:01:10.322	\N
cml04azlo005c011511z9opjh	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzcac04000201zijzdex4di	\N	2026-01-30 00:01:10.322	\N
cml04azlp005d0115uvxvglqw	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzcwu2b001a01zikpsytpvf	\N	2026-01-30 00:01:10.322	\N
cml04azlp005e0115qxf0rs61	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzcwu2l001b01ziq9o1t5p2	\N	2026-01-30 00:01:10.322	\N
cml04azlp005f0115w6d22eph	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzcwu2r001c01zigozw6qvm	\N	2026-01-30 00:01:10.322	\N
cml04azlp005g0115ie2ojpc7	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzdgmeq002l01zi9j307uyw	\N	2026-01-30 00:01:10.322	\N
cml04azlp005h0115i3agm21s	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzdgmhn002m01zijouptfwo	\N	2026-01-30 00:01:10.322	\N
cml04azlp005i0115y15x8aj3	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzdgmi7002n01zicvy0gi15	\N	2026-01-30 00:01:10.322	\N
cml04azlp005j0115wkyto2zf	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzfuznr000201x64kjbzgrf	\N	2026-01-30 00:01:10.322	\N
cml04azlq005k0115ioybfnwx	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzfuzvz000301x6fcivjtuy	\N	2026-01-30 00:01:10.322	\N
cml04azlq005l0115xcpxj0bj	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzfuzys000401x6awonrjyh	\N	2026-01-30 00:01:10.322	\N
cml04azlq005m0115ah6sjftb	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzhkhv7000001yg71o4vvah	\N	2026-01-30 00:01:10.322	\N
cml04azlq005n0115wtoiz87r	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzhki0p000101ygbxccwbqu	\N	2026-01-30 00:01:10.322	\N
cml04azlq005o0115fqntojxx	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzhkibv000201ygcwggao0y	\N	2026-01-30 00:01:10.322	\N
cml04aznw005p0115h533iybz	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzhrlcn000001sxin3mfvmi	\N	2026-01-30 00:01:10.322	\N
cml04aznw005q0115rj22jh0r	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzhrld5000101sxpjpntst4	\N	2026-01-30 00:01:10.322	\N
cml04aznw005r0115ud0l24hp	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzhrli7000201sx9ter2uci	\N	2026-01-30 00:01:10.322	\N
cml04aznw005s0115wm95g1i8	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzl4w3g000001xs7gglhnrk	\N	2026-01-30 00:01:10.322	\N
cml04aznw005t01158u8vwjed	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzl4w63000101xsxznqzw5m	\N	2026-01-30 00:01:10.322	\N
cml04aznw005u0115tsreqi62	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzl4w8n000201xsfstt0cof	\N	2026-01-30 00:01:10.322	\N
cml04aznw005v0115daknkiha	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzlqky10000011s3oj6n7sk	\N	2026-01-30 00:01:10.322	\N
cml04aznw005w0115of5pt27a	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzlql0v0001011svv67sly8	\N	2026-01-30 00:01:10.322	\N
cml04aznw005x0115fyur4qh0	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzlql590002011sl4y4bhzp	\N	2026-01-30 00:01:10.322	\N
cml04aznx005y0115uvf2agt3	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzn02sb000001xljtrffvlg	\N	2026-01-30 00:01:10.322	\N
cml04aznx005z0115gwcufkou	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzn02uy000101xlyk7db2si	\N	2026-01-30 00:01:10.322	\N
cml04azo300600115cec5bi06	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzn02xo000201xl7tp2gb23	\N	2026-01-30 00:01:10.322	\N
cml04azo400610115bd6ev650	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzn4c48000001ztffuh7cht	\N	2026-01-30 00:01:10.322	\N
cml04azo400620115e350wzfy	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzn4c9l000101zt0bf6b6lf	\N	2026-01-30 00:01:10.322	\N
cml04azo400630115sdoaybph	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzn4ccb000201zt2c0n6q0p	\N	2026-01-30 00:01:10.322	\N
cml04azo4006401158vmqg70x	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkznau51001a01zticxnu5bh	\N	2026-01-30 00:01:10.322	\N
cml04azo400650115e8yfwiwv	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkznauws001b01ztkz1d3wwh	\N	2026-01-30 00:01:10.322	\N
cml04azo4006601156qsg54fu	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkznauzk001c01ztt9nq9b4v	\N	2026-01-30 00:01:10.322	\N
cml04azo400670115tirm7gto	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkznbhv9002k01ztmm81etp2	\N	2026-01-30 00:01:10.322	\N
cml04azo400680115mdfaapdl	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkznbhy0002l01ztzo6gutj8	\N	2026-01-30 00:01:10.322	\N
cml04azo400690115iq9ubnsf	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkznbhzc002m01ztb0357ne9	\N	2026-01-30 00:01:10.322	\N
cml04azo4006a01158wvngpfh	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkznd7ej003u01zt92ichb10	\N	2026-01-30 00:01:10.322	\N
cml04azo4006b0115xxp42r2f	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkznd7es003v01ztycp5vmxc	\N	2026-01-30 00:01:10.322	\N
cml04azo5006c01153fi7o3pn	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkznd7f5003w01zt65gsys6h	\N	2026-01-30 00:01:10.322	\N
cml04azo5006d0115zvtelrhq	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzneq55005401ztrnuppn38	\N	2026-01-30 00:01:10.322	\N
cml04azo5006e01153isbx7q1	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzneq5h005501ztnmc0tn84	\N	2026-01-30 00:01:10.322	\N
cml04azo5006f0115n88m8uv2	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzneq5s005601zt5b9so113	\N	2026-01-30 00:01:10.322	\N
cml04azo5006g0115fh235z0u	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzpma1x006e01ztnei2k17p	\N	2026-01-30 00:01:10.322	\N
cml04azo5006h01152cgrtrtj	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzpma6v006f01zt2eep86he	\N	2026-01-30 00:01:10.322	\N
cml04azo5006i0115ymfuvlii	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzpmaia006g01zta65va4hd	\N	2026-01-30 00:01:10.322	\N
cml04azo5006j0115by0dex0f	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzpnaay007o01ztwp9e4uvc	\N	2026-01-30 00:01:10.322	\N
cml04azo5006k0115f0ik7zf2	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzpnacb007p01ztty61hk1i	\N	2026-01-30 00:01:10.322	\N
cml04azo5006l0115t1vod9kx	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzpnadq007q01zt0vzq3870	\N	2026-01-30 00:01:10.322	\N
cml04azo6006m011532h7clkb	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzr6o90000001zmea4iudkc	\N	2026-01-30 00:01:10.322	\N
cml04azo6006n0115tefxjmok	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzr6py5000101zmcrjbu6hd	\N	2026-01-30 00:01:10.322	\N
cml04azo7006o0115drefyeyn	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzr6q3m000201zmwa4k7v70	\N	2026-01-30 00:01:10.322	\N
cml04azo7006p0115xpdnttjl	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzurnw2000001vow6ucxpcv	\N	2026-01-30 00:01:10.322	\N
cml04azo7006q0115kyi8wnzs	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzuro6i000101voek6c1nf7	\N	2026-01-30 00:01:10.322	\N
cml04azo7006r01151tsroqx1	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzuroc3000201voififz1nx	\N	2026-01-30 00:01:10.322	\N
cml04azo7006s011521k6bren	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzv9bxv000001w4iw3t48wh	\N	2026-01-30 00:01:10.322	\N
cml04azo7006t0115ok58f9fw	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzv9c0a000101w4l4ukfd4m	\N	2026-01-30 00:01:10.322	\N
cml04azo7006u0115wuas1bpg	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzv9c0g000201w4sj3pjhgc	\N	2026-01-30 00:01:10.322	\N
cml04azo7006v01152z7c8t68	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzw5dhn001g01w4klul4vgy	\N	2026-01-30 00:01:10.322	\N
cml04azo8006w0115v00raa1o	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzw5dhw001h01w4vwmey6u7	\N	2026-01-30 00:01:10.322	\N
cml04azo8006x0115teutukwr	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzw5djk001i01w492m6lnzt	\N	2026-01-30 00:01:10.322	\N
cml04azo8006y0115q2sns3rx	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cmkzxwb2e002q01w42ttxp6uz	\N	2026-01-30 00:01:10.322	\N
cml04azo8006z0115xgdiziyh	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cmkzxwb7c002r01w4lec05lxq	\N	2026-01-30 00:01:10.322	\N
cml04azo900700115qqalteb1	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cmkzxwb80002s01w45t382mkp	\N	2026-01-30 00:01:10.322	\N
cml04azo9007101156hbmrdqg	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cml026y7u000001v9yc9ptyex	\N	2026-01-30 00:01:10.322	\N
cml04azo9007201152rbn0pyp	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cml026ydc000101v9wv3p7fmm	\N	2026-01-30 00:01:10.322	\N
cml04azo900730115ej8bc4oh	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cml026yg3000201v9ajebeo6f	\N	2026-01-30 00:01:10.322	\N
cml04azo900740115ci4e1yf2	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cml027f42001a01v9uudw4jv7	\N	2026-01-30 00:01:10.322	\N
cml04azo900750115pkqogkns	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cml027f4d001b01v90eue5e2c	\N	2026-01-30 00:01:10.322	\N
cml04azo900760115vkr9g31r	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cml027f4i001c01v92fbc9l71	\N	2026-01-30 00:01:10.322	\N
cml04azo9007701150wjrir6l	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cml029tx0002k01v9baej0zeg	\N	2026-01-30 00:01:10.322	\N
cml04azo900780115xmqeo79l	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cml029tzs002l01v9e43bgjr4	\N	2026-01-30 00:01:10.322	\N
cml04azo9007901158d2gchyg	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cml029tzz002m01v9vx4p48um	\N	2026-01-30 00:01:10.322	\N
cml04azo9007a01150jp9hmd0	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cml02aywj003u01v9uqsr3mw4	\N	2026-01-30 00:01:10.322	\N
cml04azoa007b0115azflfdsv	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cml02ayyy003v01v9iytbwbzk	\N	2026-01-30 00:01:10.322	\N
cml04azoa007c0115brg1zxr8	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cml02az1v003w01v9su3uki7f	\N	2026-01-30 00:01:10.322	\N
cml04azqo007d0115bh0fdsxt	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cml02e9pv005401v9csi1k9eu	\N	2026-01-30 00:01:10.322	\N
cml04azqo007e0115fo1veie5	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cml02e9q6005501v9gy40azlt	\N	2026-01-30 00:01:10.322	\N
cml04azqo007f0115utqvlxce	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cml02e9si005601v9d7g2m9mk	\N	2026-01-30 00:01:10.322	\N
cml04azqo007g0115y70hlu6l	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cml02lcta006e01v9s58g73ke	\N	2026-01-30 00:01:10.322	\N
cml04azqo007h0115yuxzi3ll	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cml02lctt006f01v9surectbn	\N	2026-01-30 00:01:10.322	\N
cml04azqp007i0115dyoi3koq	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cml02lcvv006g01v97pz2w2v1	\N	2026-01-30 00:01:10.322	\N
cml04azqp007j0115njuzxugo	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cml02ndt5007o01v9zl279iwy	\N	2026-01-30 00:01:10.322	\N
cml04azqp007k0115gnl9yn5v	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cml02ndvo007p01v9b20pa88h	\N	2026-01-30 00:01:10.322	\N
cml04azqp007l0115caldotns	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cml02ndvw007q01v98823o9ik	\N	2026-01-30 00:01:10.322	\N
cml04azqu007m0115jj5at8kh	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cml043bii00000115ut6l20qn	\N	2026-01-30 00:01:10.322	\N
cml04azqv007n01151mzzmi43	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cml043bo600010115eugrjwxp	\N	2026-01-30 00:01:10.322	\N
cml04azqv007o0115wsb82fhl	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cml043bqx000201158ckifwd7	\N	2026-01-30 00:01:10.322	\N
cml04azqv007p0115w7vzpsk3	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cml043gly001a0115nauubost	\N	2026-01-30 00:01:10.322	\N
cml04azqv007q0115tkmjn91b	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cml043gm5001b0115pubg956g	\N	2026-01-30 00:01:10.322	\N
cml04azqv007r01151zaarbsa	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cml043gmf001c0115izqn0um8	\N	2026-01-30 00:01:10.322	\N
cml04azqv007s01156c4e791e	TAREFA_HOJE	Tarefa para Hoje	Agendar reuniao/demonstracao - Bia Lacerda Cabeleireiros	f	\N	cmkqsd6h50007010g7dd4jrbf	cml0499ss002k0115v4gouhzk	\N	2026-01-30 00:01:10.322	\N
cml04azqv007t01154w43f61i	TAREFA_HOJE	Tarefa para Hoje	Enviar proposta pos-reuniao - Andreia Barbosa Cabeleireiro e Estética	f	\N	cmkqwfefv00170121fnelm5ll	cml0499v7002l0115tqzdx2mp	\N	2026-01-30 00:01:10.322	\N
cml04azqv007u0115ouwymoi8	TAREFA_HOJE	Tarefa para Hoje	Fazer primeiro contacto - Amor Perfeito Beleza e Eventos	f	\N	cmkv53pve00c901zsohh83mjz	cml0499ve002m0115601i33xq	\N	2026-01-30 00:01:10.322	\N
cml12dhj7000k01vagkv6rhvz	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANA CRISTINA CHAGAS - Vencida em 23/01/2026	f	cmkk3ocbv000101vjx115msl5	\N	cmkn6k6k1000001wutm4cjlwp	\N	2026-01-30 15:54:53.82	\N
cml12dhj7000l01vahh4321vz	TAREFA_VENCIDA	Tarefa Atrasada	Contactar SPIRIT DAY SPA- MELISSA - Vencida em 23/01/2026	f	cmkcnpxd40038ogntjuwfp2oj	\N	cmkn6k6mz000101wueqel5pf5	\N	2026-01-30 15:54:53.82	\N
cml12dhj7000m01va2tr32e0z	TAREFA_VENCIDA	Tarefa Atrasada	Contactar GLAMOUR - Vencida em 23/01/2026	f	cmkcnpx38000fognt09x3o61e	\N	cmkn6k6p9000201wub3robfft	\N	2026-01-30 15:54:53.82	\N
cml12dhj7000n01va89sq7gk0	TAREFA_VENCIDA	Tarefa Atrasada	Contactar IVONE RAMOS - Vencida em 23/01/2026	f	cmkcnpx4n0010ogntlgsvrd29	\N	cmkn6k6s4000301wue65sjmfz	\N	2026-01-30 15:54:53.82	\N
cml12dhj7000o01vax41qwix7	TAREFA_VENCIDA	Tarefa Atrasada	Contactar FILIPA DANIELA PEREIRA - Vencida em 23/01/2026	f	cmkk4k9ba000501vj4ybqtwvg	\N	cmkn6k6ux000401wuf4tk0k2j	\N	2026-01-30 15:54:53.82	\N
cml12dhj7000p01va16f1y9ya	TAREFA_VENCIDA	Tarefa Atrasada	Contactar PAULA SANTANA - Vencida em 23/01/2026	f	cmkcnpx5p0019ognt0dfjus98	\N	cmkn6k70c000501wu0gyxnzt4	\N	2026-01-30 15:54:53.82	\N
cml12dhj7000q01va1852hcgp	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Pura Beleza - Vencida em 23/01/2026	f	cmkcnpx3c000hogntfv3f1nr9	\N	cmkn6k75o000601wuw37v56g4	\N	2026-01-30 15:54:53.82	\N
cml12dhj7000r01va4p72o85k	TAREFA_VENCIDA	Tarefa Atrasada	Contactar FISIBELA - Vencida em 23/01/2026	f	cmkcnpx3g000jogntg4abd8u8	\N	cmkn6k78o000701wu2jut6gq7	\N	2026-01-30 15:54:53.82	\N
cml12dhj7000s01va0lywrwpv	TAREFA_VENCIDA	Tarefa Atrasada	Contactar AGILREQUINTE - Vencida em 23/01/2026	f	cmkk41coe000301vjs2ey859r	\N	cmkn6k7bu000801wusbu7mkea	\N	2026-01-30 15:54:53.82	\N
cml12dhj7000t01va1lyho7hh	TAREFA_VENCIDA	Tarefa Atrasada	Contactar SANDRA LUZ - DEZ STUDIO - Vencida em 23/01/2026	f	cmkk57s2v000f01vjpcw5edlt	\N	cmkn6k7ek000901wub71fu5qs	\N	2026-01-30 15:54:53.82	\N
cml12dhj7000u01vav17xm6kc	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Silkare - Vencida em 23/01/2026	f	cmkd2khtw0003pontk0fsp8w4	\N	cmkn6k835000a01wuffxtzdjh	\N	2026-01-30 15:54:53.82	\N
cml12dhj7000v01va3cd6ey5f	TAREFA_VENCIDA	Tarefa Atrasada	Contactar Isaura - Vencida em 23/01/2026	f	cmkd2khu20005pontjgu03va8	\N	cmkn6k8c1000b01wubpcafb3m	\N	2026-01-30 15:54:53.82	\N
cml12dhj8000w01va3nim5pou	TAREFA_VENCIDA	Tarefa Atrasada	Contactar MARIA TERESA PINHO DUARTE - Vencida em 23/01/2026	f	cmkd6qsti0000cynty9veowk8	\N	cmkn6k8k2000c01wuar8qwit4	\N	2026-01-30 15:54:53.82	\N
cml12dhj8000x01va3v797g0q	TAREFA_VENCIDA	Tarefa Atrasada	Contactar TRINDADE DA COSTA LUIS - Vencida em 23/01/2026	f	cmkd6qstz0001cynts3nac09o	\N	cmkn6k8mv000d01wu7ll68l72	\N	2026-01-30 15:54:53.82	\N
cml12dhj8000y01vaiuo512rc	TAREFA_VENCIDA	Tarefa Atrasada	Contactar PAULA GRACA J.SILVA - Vencida em 23/01/2026	f	cmkd6qsu40002cyntmtwkbs8f	\N	cmkn6k931000e01wuc8zqffkt	\N	2026-01-30 15:54:53.82	\N
cml12dhj8000z01vaf5q784vt	TAREFA_VENCIDA	Tarefa Atrasada	Contactar INSTITUTO DE BELEZA CAB.LDA - Vencida em 23/01/2026	f	cmkd6qsu70003cyntf50v98ro	\N	cmkn6k9jw000g01wu5vydxlnq	\N	2026-01-30 15:54:53.82	\N
cml12dhj8001001vatd0hop5n	TAREFA_VENCIDA	Tarefa Atrasada	Contactar LURDES MARTA-ESTETICA E PERFUMARIA, LDA. - Vencida em 23/01/2026	f	cmkd6qsu90004cyntoujdyvh6	\N	cmkn6k9pk000h01wuj5zwehox	\N	2026-01-30 15:54:53.82	\N
cml12dhj8001101vaahzftywh	TAREFA_VENCIDA	Tarefa Atrasada	Contactar LUCIA BATISTA UNIPESSOAL LDA - Vencida em 23/01/2026	f	cmkd6qsug0007cynt78amxldi	\N	cmkn6k9vo000i01wuw48gtd95	\N	2026-01-30 15:54:53.82	\N
cml12dhj8001201vaw3q6yamc	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANA MARIA MAIA VILAS - Vencida em 23/01/2026	f	cmkd6qsui0008cynt0g8nss02	\N	cmkn6k9yb000j01wuvira7hfd	\N	2026-01-30 15:54:53.82	\N
cml12dhj8001301vaxirinivi	TAREFA_VENCIDA	Tarefa Atrasada	Contactar ANABELA DOMINGUES PEREIRA - Vencida em 23/01/2026	f	cmkd6qsul0009cynts5akpdj7	\N	cmkn6ka0r000k01wuiqmiexy6	\N	2026-01-30 15:54:53.82	\N
\.


--
-- Data for Name: ObjetivoAnual; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ObjetivoAnual" (id, ano, objetivo, "createdAt", "updatedAt") FROM stdin;
e7ea61d6-5bef-4c94-84f0-0c0c50e7a24d	2025	173250.00	2026-01-13 15:25:57.821	2026-01-13 15:25:57.821
cmkcz1exz000701mt3es3pw7o	2026	173000.00	2026-01-13 19:15:03.527	2026-01-13 19:16:18.799
\.


--
-- Data for Name: ObjetivoMensal; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ObjetivoMensal" (id, mes, ano, objetivo, "createdAt", "updatedAt") FROM stdin;
cmkcnpxeu003nognt8u9nqdiv	1	2025	11500.00	2026-01-13 13:58:11.814	2026-01-13 13:58:11.814
cmkcnpxex003oogntynd1msxf	2	2025	11000.00	2026-01-13 13:58:11.817	2026-01-13 13:58:11.817
cmkcnpxey003pogntryb7s035	3	2025	14500.00	2026-01-13 13:58:11.818	2026-01-13 13:58:11.818
cmkon6j24006801wm3v5jnkjm	1	2026	11500.00	2026-01-21 23:16:20.86	2026-01-21 23:16:20.86
cmkon6ksr006901wmuy5lcdg7	2	2026	11000.00	2026-01-21 23:16:23.115	2026-01-21 23:16:23.115
cmkon6rwm006a01wmbm7l67bi	3	2026	14500.00	2026-01-21 23:16:32.326	2026-01-21 23:16:32.326
cmkon6zig006b01wmenue2khz	4	2026	17500.00	2026-01-21 23:16:42.184	2026-01-21 23:16:42.184
cmkon75hf006c01wmo89pqiuv	5	2026	16500.00	2026-01-21 23:16:49.923	2026-01-21 23:16:49.923
cmkon7ecl006d01wm1mhcm4ku	6	2026	17000.00	2026-01-21 23:17:01.413	2026-01-21 23:17:01.413
cmkon7ps6006e01wmpk9rljht	7	2026	17000.00	2026-01-21 23:17:16.23	2026-01-21 23:17:16.23
cmkon857o006f01wm6c1ufz10	9	2026	17000.00	2026-01-21 23:17:36.227	2026-01-21 23:17:36.227
cmkon8fp3006g01wmxkhz6yfj	10	2026	17250.00	2026-01-21 23:17:49.815	2026-01-21 23:17:49.815
cmkon8l4h006h01wms9icza5i	11	2026	23000.00	2026-01-21 23:17:56.849	2026-01-21 23:17:56.849
cmkon8rzq006i01wm3xn3bo7d	12	2026	11000.00	2026-01-21 23:18:05.75	2026-01-21 23:18:05.75
\.


--
-- Data for Name: ObjetivoTrimestral; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ObjetivoTrimestral" (id, trimestre, ano, objetivo, "createdAt", "updatedAt") FROM stdin;
cmkcnpxf1003qogntj2dcz42o	1	2025	37000.00	2026-01-13 13:58:11.821	2026-01-13 13:58:11.821
cmkon93b9006j01wmjcpcdqrt	1	2026	37000.00	2026-01-21 23:18:20.42	2026-01-21 23:18:20.42
cmkon9acr006k01wmd5lxbv5e	2	2026	51000.00	2026-01-21 23:18:29.546	2026-01-21 23:18:29.546
cmkon9fiz006l01wm5v5icj8s	3	2026	34000.00	2026-01-21 23:18:36.25	2026-01-21 23:18:36.25
cmkon9nay006m01wmxuso8o8v	4	2026	51000.00	2026-01-21 23:18:46.33	2026-01-21 23:18:46.33
\.


--
-- Data for Name: ObjetivoVario; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ObjetivoVario" (id, "userId", titulo, descricao, mes, ano, ativo, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ObjetivoVarioProduto; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ObjetivoVarioProduto" (id, "objetivoVarioId", "produtoId", nome, "precoSemIva", quantidade, "createdAt") FROM stdin;
\.


--
-- Data for Name: Orcamento; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Orcamento" (id, numero, "prospectoId", "clienteId", titulo, introducao, condicoes, "validadeDias", "dataEmissao", "dataValidade", subtotal, desconto, iva, total, estado, notas, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: Parcela; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Parcela" (id, "cobrancaId", numero, valor, "dataVencimento", "dataPago", pago, notas, "createdAt", "updatedAt") FROM stdin;
cmklqc5bu000v01vuagrgnzf9	cmklqc5bn000u01vujlx5x1bz	1	150.18	2025-12-20 00:00:00	2026-01-22 21:43:30.735	t	\N	2026-01-19 22:21:23.322	2026-01-22 21:43:30.739
cmklqc5bu000w01vuyk8zlnqr	cmklqc5bn000u01vujlx5x1bz	2	150.18	2026-01-20 00:00:00	2026-01-22 21:43:36.67	t	\N	2026-01-19 22:21:23.322	2026-01-22 21:43:36.674
cmklq30fm000q01vuy1888l47	cmklq30f4000p01vu73mc1fa3	1	208.74	2026-02-25 00:00:00	\N	f	\N	2026-01-19 22:14:17.074	2026-01-19 22:14:17.074
cmklq30fm000r01vu3cz5bkvf	cmklq30f4000p01vu73mc1fa3	2	208.74	2026-03-25 00:00:00	\N	f	\N	2026-01-19 22:14:17.074	2026-01-19 22:14:17.074
cmkqrzr640004010gii6lhzas	cmkqrzr5t0003010glcaicaqm	1	269.89	2026-02-26 00:00:00	\N	f	\N	2026-01-23 11:06:35.212	2026-01-23 11:06:35.212
cmkqrzr640005010gjtilxh21	cmkqrzr5t0003010glcaicaqm	2	269.89	2026-03-26 00:00:00	\N	f	\N	2026-01-23 11:06:35.212	2026-01-23 11:06:35.212
cmkqrzr640006010gvrh0kv17	cmkqrzr5t0003010glcaicaqm	3	269.89	2026-04-26 00:00:00	\N	f	\N	2026-01-23 11:06:35.212	2026-01-23 11:06:35.212
cmkr9x8bz004s01zs9g3d3tf1	cmkr9x8bq004r01zs7bo70eq1	1	182.76	2026-02-20 00:00:00	\N	f	\N	2026-01-23 19:28:30.575	2026-01-23 19:28:30.575
cmkr9x8bz004t01zsw181b2cr	cmkr9x8bq004r01zs7bo70eq1	2	182.76	2026-03-20 00:00:00	\N	f	\N	2026-01-23 19:28:30.575	2026-01-23 19:28:30.575
cmkvauufi00cc01zsjwthk50l	cmkvauueb00cb01zsx91qvr3h	1	168.92	2026-02-27 00:00:00	\N	f	\N	2026-01-26 15:05:43.566	2026-01-26 15:05:43.566
cmkvauufi00cd01zsftru6zpb	cmkvauueb00cb01zsx91qvr3h	2	168.92	2026-03-27 00:00:00	\N	f	\N	2026-01-26 15:05:43.566	2026-01-26 15:05:43.566
cmkvauufi00ce01zsqug6naqy	cmkvauueb00cb01zsx91qvr3h	3	168.92	2026-04-27 00:00:00	\N	f	\N	2026-01-26 15:05:43.566	2026-01-26 15:05:43.566
cmkykzl40006k0101f6dsiq3g	cmkykzl3u006j01015uadls22	1	155.21	2026-02-19 00:00:00	\N	f	\N	2026-01-28 22:12:39.455	2026-01-28 22:12:39.455
cmkykzl40006l01014y36c5tk	cmkykzl3u006j01015uadls22	2	155.21	2026-03-19 00:00:00	\N	f	\N	2026-01-28 22:12:39.455	2026-01-28 22:12:39.455
cmkzw54df001c01w4iep8c8ge	cmkzw54bw001b01w4jkbteuwo	1	226.07	2026-03-02 00:00:00	\N	f	\N	2026-01-29 20:12:39.651	2026-01-29 20:12:39.651
cmkzw54df001d01w4libm7ovp	cmkzw54bw001b01w4jkbteuwo	2	226.07	2026-03-30 00:00:00	\N	f	\N	2026-01-29 20:12:39.651	2026-01-29 20:12:39.651
\.


--
-- Data for Name: PremioAnual; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."PremioAnual" (id, minimo, premio, ordem, "createdAt", "updatedAt") FROM stdin;
cmkq0cvza002e01twib2tvcvc	173000.00	1000.00	1	2026-01-22 22:12:58.725	2026-01-22 22:12:58.725
\.


--
-- Data for Name: PremioMensal; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."PremioMensal" (id, minimo, premio, ordem, "createdAt", "updatedAt") FROM stdin;
cmkczafy1000901mtrib3r3os	9270.00	76.00	7	2026-01-13 19:22:04.729	2026-01-13 19:22:04.729
cmkypcn2n004a01xhh5mhn8gf	11330.00	127.00	2	2026-01-29 00:14:46.991	2026-01-29 00:14:46.991
cmkypd0ym004b01xhwdqjbd6i	13390.00	178.00	3	2026-01-29 00:15:04.99	2026-01-29 00:15:04.99
cmkypdi4a004c01xhthd7c181	15450.00	228.00	4	2026-01-29 00:15:27.226	2026-01-29 00:15:27.226
cmkypdtrd004d01xh79uwpp64	17510.00	279.00	5	2026-01-29 00:15:42.313	2026-01-29 00:15:42.313
cmkype4js004e01xh4msxi73f	19570.00	330.00	6	2026-01-29 00:15:56.296	2026-01-29 00:15:56.296
cmkypej8z004f01xh8z7gbabx	21630.00	381.00	7	2026-01-29 00:16:15.347	2026-01-29 00:16:15.347
\.


--
-- Data for Name: PremioTrimestral; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."PremioTrimestral" (id, minimo, premio, ordem, "createdAt", "updatedAt") FROM stdin;
cmkypg0tv004g01xhhwzii8ai	27810.00	228.00	1	2026-01-29 00:17:24.787	2026-01-29 00:17:24.787
cmkypgfes004h01xh3509zg6g	33990.00	381.00	2	2026-01-29 00:17:43.684	2026-01-29 00:17:43.684
cmkypgryl004i01xhnenhnhh6	40170.00	533.00	3	2026-01-29 00:17:59.949	2026-01-29 00:17:59.949
cmkyph5sy004j01xhop10ndct	46350.00	685.00	4	2026-01-29 00:18:17.89	2026-01-29 00:18:17.89
cmkyphl52004k01xh0kphuyhp	52530.00	837.00	5	2026-01-29 00:18:37.766	2026-01-29 00:18:37.766
cmkyphw10004l01xhl7s5zeed	56710.00	990.00	6	2026-01-29 00:18:51.876	2026-01-29 00:18:51.876
cmkypiav3004m01xh9zu9tk2g	64890.00	1142.00	7	2026-01-29 00:19:11.103	2026-01-29 00:19:11.103
\.


--
-- Data for Name: PrevisaoVendas; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."PrevisaoVendas" (id, mes, ano, "previsaoBase", "previsaoPipeline", "previsaoTotal", confianca, "createdAt", "updatedAt") FROM stdin;
cmkn6ka9d000n01wu0b37wn9r	1	2026	28274.14	0.00	18803.79	60	2026-01-20 22:43:22.993	2026-01-30 19:43:16.94
\.


--
-- Data for Name: Produto; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Produto" (id, nome, codigo, categoria, descricao, ativo, "createdAt", "updatedAt", preco, tipo) FROM stdin;
cmkd6qsy2001scynt812gzrvz	NUTRI RESTORE 14 ML	BBF1C500	Ampoules	\N	t	2026-01-13 22:50:45.386	2026-01-13 22:50:45.386	24.06	\N
cmkd6qsx7001dcynt6x58nslv	CLE SOOTHING ROSE TONER 200 ML	BBA1C337	Cleansing System	\N	t	2026-01-13 22:50:45.355	2026-01-13 22:50:45.355	21.06	\N
cmkd6qswk0014cyntepsehvie	DEEP CLEANSING FOAM 200 ML	BBA1C341	Cleansing System	\N	t	2026-01-13 22:50:45.332	2026-01-13 22:50:45.332	20.95	\N
cmkd6qsxe001gcyntxmxux5u9	ACTIVE NIGHT 14 ML	BBF1C315	Ampoules	\N	t	2026-01-13 22:50:45.362	2026-01-13 22:50:45.362	28.32	\N
cmkd6qsxg001hcyntny8ackbo	7 DAYS PERFECT SKIN COLLECTION	BBF1C317	Ampoules	\N	t	2026-01-13 22:50:45.364	2026-01-13 22:50:45.364	19.87	\N
cmkd6qsx9001ecyntjhumox1c	CLE HYALURONIC CLEANSING BALM 150 ML	BBA1C338	Cleansing System	\N	t	2026-01-13 22:50:45.357	2026-01-13 22:50:45.357	34.99	\N
cmkd6qsy4001tcyntll4p83rj	AMP WHITE COLLECTION 7X2 ML	BBF1C310	Ampoules	\N	t	2026-01-13 22:50:45.388	2026-01-13 22:50:45.388	16.07	\N
cmkd6qsyv0026cynttsb2fj2a	PURIFYING CREAM 50 ML	BBS5C103	Skinovage	\N	t	2026-01-13 22:50:45.415	2026-01-13 22:50:45.415	40.65	\N
cmkd6qszr002mcynt91poi0o6	HSR LIFTING OVERNIGHT MASK 50 ML	BBB8C82	HSR	\N	t	2026-01-13 22:50:45.447	2026-01-13 22:50:45.447	65.14	\N
fff6462f-e62a-4b91-a300-0ec817dbb162	REGENERATION THE CURE BODY CREAM 200 ML	BBE1C8105	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	61.88	Venda Público
b47563b8-b461-4fca-881d-890b19ee1d3d	LIFTING REJUVENATION AMPOULE SERUM CONCENTRATE 14 ML	BBE1C8201	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	34.50	Venda Público
9c5124b1-a1d1-4d4d-93c3-e1b499e9f155	LIFTING COLLAGEN-PEPTIDE BOOSTER CREAM RICH 50 ML	BBE1C8203	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	78.18	Venda Público
2e83eebe-43f4-4590-a85d-0e90ab080f53	LIFTING INSTANT LIFT EFFECT CREAM 50 ML	BBE1C8204	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	78.18	Venda Público
fdc5e129-25a2-4ecc-a563-38f345079ee8	LIFTING DUAL EYE SOLUTION 30 ML	BBE1C8205	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	55.36	Venda Público
685c0884-b055-4d52-9a21-787beca0ea77	DB HID CRYO PLUMPING MASK	BBE1C8305	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	8.20	Venda Público
56eb0d9d-86d3-4fe9-853e-5279d5c5bbc0	RESURFACE RADIANCE AMPOULE SERUM CONCENTRATE 14 ML	BBE1C8401	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	34.50	Venda Público
c24e06d0-e5f7-473b-9156-37eafb1a9ae0	RESURFACE REFINING RADIANCE SERUM 30 ML	BBE1C8402	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	55.36	Venda Público
ef0ede48-6f3d-47db-be14-14ab3101671f	RESURFACE RENEWAL TONER 200 ML	BBE1C8403	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	26.02	Venda Público
a54a23b6-ee28-48cb-81bb-5847a8e8365e	RESURFACE RENEWAL EYE ZONE PATCH 5 PCS	BBE1C8405	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	32.54	Venda Público
eb46a3ac-5c48-4a38-8853-38b2f45ed870	RESURFACE EXFOLIATING PEEL PADS 40 PCS	BBE1C8406	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	32.54	Venda Público
cf0f3889-dad7-485a-b8f4-a9cb155d51cc	RESURFACE EXFOLIATING ANTIOXIDANT GEL 50 ML	BBE1C8407	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	74.92	Venda Público
e3d9b21f-cc96-4d39-a21e-b76afa6b77c4	RESURFACE ENZYME MICRO PEEL BALM 75 ML	BBE1C8408	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	29.28	Venda Público
13d11765-3102-49d8-affd-d4fa352816a7	RESURFACE PORE REFINING SERUM 30 ML	BBE1C8409	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	39.06	Venda Público
fc66e7a7-2a52-416b-b8f9-ea846da59374	RESURFACE DARK SPOT CORRECTING CONCENTRATE 30 ML	BBE1C8410	Dr. Babor	\N	t	2026-01-29 19:06:51.117	2026-01-29 19:06:51.117	46.44	Venda Público
546d08b8-6fdc-4b6e-8aa7-0a04257f9bf0	DOC PRO BALANCING OINTMENT CLEANSER 150 ML	BBE1C9004	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	23.10	Venda Público
2e827f11-9111-4236-8954-b6d8512dc14e	DOC PRO VITAMIN B CALMING SERUM 30 ML	BBE1C9008	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	59.72	Venda Público
bac78892-9198-46f0-addc-243e49efd80e	DOC PRO DERMA CONTROL SERUM 30 ML	BBE1C9009	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	59.72	Venda Público
cmkd6qt3w004gcynty9p8gh2h	DOC PRO RETINOL REFINING SERUM 30 ML	BBE1C9010	Dr. Babor Pro	\N	t	2026-01-13 22:50:45.596	2026-01-13 22:50:45.596	76.33	Venda Público
cmkd6qt3z004hcyntloz0xlzy	DOC PRO VITAMIN C-20 SERUM 30 ML	BBE1C9011	Dr. Babor Pro	\N	t	2026-01-13 22:50:45.598	2026-01-13 22:50:45.598	76.33	Venda Público
57ec76ee-9a31-4e4a-9181-41d61e6504ed	DOC PRO SENSITIVE EMUGEL 50 ML	BBE1C9013	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	53.08	Venda Público
780dce88-94b9-47b8-8708-d54b19067c1e	DOC PRO DERMA CONTROL EMULSION 50 ML	BBE1C9014	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	59.72	Venda Público
a6c222ac-6aae-49e7-818f-b2cb9577f67f	DOC PRO ANTIOX. BALM SPF50+ 50 ML	BBE1C9016	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	29.84	Venda Público
601f4561-f43a-4d0f-8da6-17571ccb922e	DOC PRO SKIN TONE BAL EYE CREAM 15 ML	BBE1C9017	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	43.12	Venda Público
3e03c413-96d4-4d1f-bbde-82ad82c7d7a6	DOC PRO SKIN TONE BALANCING CREAM 50 ML	BBE1C9018	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	66.37	Venda Público
662fad79-ce74-4ac5-903f-8ee0fb0ea943	DOC PRO VITAMIN B CALMING SHEET MASK (3 ST)	BBE1C9019	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	23.19	Venda Público
dddedb3a-968e-4013-8c4b-84b24a77c267	CP SPA ENERGIZING ELIXIER 50 ML	BBE5I215	Babor SPA	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	13.33	Profissional
52050110-78d7-464f-8c62-fc6c1a2a1802	BABOR SPA BODY BRUSH	BBE5PM005	Babor SPA	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	21.22	Profissional
d69b9da5-2042-4086-92d5-ec298873d78d	DOC CLEAN RE-FILL DEEP CLEANSING PADS (20 ST)	BBE1C1011	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	7.36	Venda Público
cmkd6qsyf001zcyntx502n15k	SKINOVAGE BALANCING CREAM RICH	BBS3C103	Skinovage	\N	t	2026-01-13 22:50:45.399	2026-01-13 22:50:45.399	41.95	\N
cmkd6qsx3001ccynt9afx3et0	PERFECT GLOW 14 ML	BBA1C336	Cleansing System	\N	t	2026-01-13 22:50:45.351	2026-01-13 22:50:45.351	24.14	\N
cmkd6qsxc001fcyntfmz56qsq	CLE PHYTO HY-OL BOOSTER CALMING 100 ML	BBA1C339	Cleansing System	\N	t	2026-01-13 22:50:45.36	2026-01-13 22:50:45.36	16.55	\N
cmkd6qt07002ucyntk5v3osej	REGENERATION THE CURE GEL CREAM 50 ML	BBE1C8103	Dr. Babor	\N	t	2026-01-13 22:50:45.463	2026-01-13 22:50:45.463	74.92	Venda Público
cmkd6qt05002tcynt51pqqk0u	REGENERATION ECM REPAIR SERUM 30 ML	BBE1C8102	Dr. Babor	\N	t	2026-01-13 22:50:45.461	2026-01-13 22:50:45.461	42.32	Venda Público
cmkd6qt0a002vcynt55truni5	DOC REGENERATION THE CURE CREAM 50 ML	BBE1C8107	Dr. Babor	\N	t	2026-01-13 22:50:45.465	2026-01-13 22:50:45.465	79.65	Venda Público
cmkd6qt0c002wcyntxkd8up5m	LIFTING DERMA FILLER SERUM 30 ML	BBE1C8200	Dr. Babor	\N	t	2026-01-13 22:50:45.468	2026-01-13 22:50:45.468	65.14	Venda Público
cmkd6qt0e002xcynttb0gii9g	LIFTING COLLAGEN-PEPTIDE BOOSTER CREAM 50 ML	BBE1C8202	Dr. Babor	\N	t	2026-01-13 22:50:45.47	2026-01-13 22:50:45.47	74.92	Venda Público
cmkd6qt0g002ycyntowl4mn25	HYDRATION 10D HYALURONIC AMPOULE SERUM 14 ML	BBE1C8301	Dr. Babor	\N	t	2026-01-13 22:50:45.472	2026-01-13 22:50:45.472	29.28	Venda Público
cmkd6qt0j002zcyntw82bene9	HYDRATION HYDRO FILLER SERUM 30 ML	BBE1C8302	Dr. Babor	\N	t	2026-01-13 22:50:45.475	2026-01-13 22:50:45.475	52.10	Venda Público
cmkd6qt0l0030cyntf4ykaoyi	HYDRATION HYDRO REPLENISHING GEL CREAM 50 ML	BBE1C8303	Dr. Babor	\N	t	2026-01-13 22:50:45.477	2026-01-13 22:50:45.477	55.36	Venda Público
cmkd6qt0n0031cynte41wtshq	RESURFACE REFINING CLEANSING OIL BALM 150 ML	BBE1C8400	Dr. Babor	\N	t	2026-01-13 22:50:45.479	2026-01-13 22:50:45.479	32.54	Venda Público
cmkd6qt0p0032cyntvjhojai0	RESURFACE RENEWAL CREAM 50 ML	BBE1C8404	Dr. Babor	\N	t	2026-01-13 22:50:45.481	2026-01-13 22:50:45.481	78.18	Venda Público
cmkd6qt0r0033cyntyurun0qs	SENSITIVE SOOTHING CREAM CLEANSER 150 ML	BBE1C8500	Dr. Babor	\N	t	2026-01-13 22:50:45.483	2026-01-13 22:50:45.483	19.50	Venda Público
41f61de3-02a6-4bc4-9dde-10229b8fa510	SENSITIVE INSTANT SOOTHING AMPOULE SERUM 14 ML	BBE1C8501	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	34.50	Venda Público
af10f3d9-e49c-4525-8c51-d90db4490f22	DB SENSITIVE SOOTHING CREAM 50 ML	BBE1C8502	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	49.76	Venda Público
cmkd6qt0t0034cyntug9xei63	SENSITIVE INSTANT RELIEF LOTION 150 ML	BBE1C8503	Dr. Babor	\N	t	2026-01-13 22:50:45.485	2026-01-13 22:50:45.485	32.54	Venda Público
d643ea9d-f6ea-4146-9550-399f92e4c923	SENSITIVE ANTI-REDNESS SERUM 30 ML	BBE1C8504	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	45.58	Venda Público
ee27654f-9967-41d3-8c5b-dcfe36f710d4	SENSITIVE ANTI-REDNESS CREAM 50 ML	BBE1C8505	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	48.84	Venda Público
9682d09d-89e7-4113-b447-97c0bc1d3653	DB SENSITIVE SOOTHING CREAM RICH 50 ML	BBE1C8506	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	53.08	Venda Público
cmkd6qt3m004ccynt2dbni9xs	DOC PRO EXO YOUTH SERUM 30 ML	BBE1C9000	Dr. Babor Pro	\N	t	2026-01-13 22:50:45.586	2026-01-13 22:50:45.586	79.65	Venda Público
8c9288e1-a1b6-4572-bca0-19e1fdce407c	DB SENSITIVE ITCH RELIEF SERUM 30 ML	BBE1C8507	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	59.72	Venda Público
8a8f61dd-5f00-4a60-ac26-f938a77ece47	CLARIFYING EXFOLIATING TONER 200 ML	BBE1C8601	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	26.02	Venda Público
cmkd6qt0v0035cyntqnzppv7e	CLARIFYING IMPURITY SOS SPOT TREATMENT 15 ML	BBE1C8602	Dr. Babor	\N	t	2026-01-13 22:50:45.487	2026-01-13 22:50:45.487	19.50	Venda Público
c200b66c-2af9-445f-b56d-fe6002b57f02	DB MB HERBAL BALANCING TONER	BBE1C6000	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	19.20	Venda Público
cmkd6qt3p004dcynt5xt2w5jv	DOC PRO EXO YOUTH CREAM 50 ML	BBE1C9001	Dr. Babor Pro	\N	t	2026-01-13 22:50:45.589	2026-01-13 22:50:45.589	79.65	Venda Público
b45fd22b-1321-4b66-bd66-d907d19f8d6b	TESTER MEN CALM AFTER SHAVE SERUM 50 ML	BBC3PT102	Babor For Men	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	4.00	Promo
3051b932-96f0-43cc-94de-aab780797619	CP BODY GROUNDING SOUL & BODY MASSAGE OIL	BBE6I105	Body Cabin	\N	t	2026-01-30 08:07:02.923	2026-01-30 08:07:02.923	40.18	\N
7d014bc8-b410-47a3-b41b-f2887e46571e	SAMPLE HSR LIFTING CREAM	BBB8PA75	HSR	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	1.73	Promo
ecb062e0-e926-41a6-9ca1-d68b698335f5	SAMPLE HSR LIFTING EYE CREAM	BBB8PA77	HSR	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	1.73	Promo
c34285f3-7490-42ef-87b5-fb154f6e18ee	TESTER HSR LIFT NECK & DECOLLETE CREAM 50 ML	BBB8PT73	HSR	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	22.88	Promo
b942194a-a0dd-43be-9d3a-66ac8c9ab55f	TESTER HSR LIFTING CREAM 50 ML	BBB8PT75	HSR	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	23.92	Promo
caa19736-dce1-4fd6-85c6-cc54164bedd9	TESTER HSR LIFTING CREAM RICH 50 M	BBB8PT76	HSR	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	23.92	Promo
a10a8cd8-865f-46f5-baf1-2c57cff560e1	TESTER HSR LIFTING EYE CREAM	BBB8PT77	HSR	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	22.71	Promo
5f472c0f-2150-4dfa-b580-42bb008125c7	TESTER HSR LIFTING SERUM 30 ML	BBB8PT78	HSR	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	27.04	Promo
e7590f96-832d-4bc5-833f-812bd1c32ada	DEKOFAC HSR LIFT GIFT SET (2 ST)	BBB8PD006	HSR	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	51.62	Promo
77f81d43-c174-4aad-bd37-21ed048c909e	SAMPLE SEACREATION THE CREAM 3 ML	BBC9PA020	Sea Creation	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	16.76	Promo
6250ad43-3499-4751-9304-349e8c19ff83	SAMPLE SEACREATION THE CREAM RICH 3 ML	BBC9PA021	Sea Creation	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	16.76	Promo
8477132b-c502-488f-87b8-738eacb340d5	SAMPLE SEACREATION THE EYE CREAM 3 ML	BBC9PA023	Sea Creation	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	16.76	Promo
1fb4c56c-b966-486a-a432-cddb3e0460c0	TESTER SEACREATION CREAM RICH 50ML	BBC9PT011	Sea Creation	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	112.02	Promo
c576e0fd-1222-42d1-a86e-d1966512f056	CROSS PROMO SUN CREAM SPF 30 ML	BBC1PT40	Anti-Age Suncare	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	3.24	Promo
55925170-380a-461a-b3c8-56d507a0a273	TESTER DISPLAY AGE ID BASE	BBAGPE009	Maquilhagem	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	573.25	Promo
1a6a3f92-8cc2-4725-a3b7-40e7c0dfd05d	CP PERFECT GLOW 24X2 ML	BBF1I301	Ampoules	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	58.04	Profissional
7b32df1a-28db-4a38-a6af-215fdce23e8b	CP ALGAE VITALIZER 24X2 ML	BBF1I309	Ampoules	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	58.04	Profissional
11fc5779-fa75-4d30-9ce9-4f2a27fe6b68	CP LIFT EXPRESS 24X2 ML	BBF1I303	Ampoules	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	63.42	Profissional
035779ee-81ff-492e-adc6-a0cbd9b42ec7	CP COLLAGEN BOOSTER 24X2 ML	BBF1I304	Ampoules	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	63.42	Profissional
f530388b-ec6d-40be-84ec-d82e372ee0c9	CP MULTI VITAMIN 24X2 ML	BBF1I307	Ampoules	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	59.25	Profissional
66c2201c-526a-4a21-ab7b-07a20eb930d6	CP ACTIVE PURIFYIER 24X2 ML	BBF1I308	Ampoules	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	48.69	Profissional
906fa3d4-4726-4142-b08d-0113718a0eb1	TESTER MEN ENERG. FACE & EYE GEL 50 ML	BBC3PT100	Babor For Men	\N	t	2026-01-29 19:33:00.953	2026-01-29 19:33:00.953	5.00	Promo
9de0edbe-70f4-4ab2-8e75-ef4acddc1438	CP BODY GROUNDING SOUL & BODY CREAM	BBE6I106	Body Cabin	\N	t	2026-01-30 08:07:02.923	2026-01-30 08:07:02.923	62.24	\N
c3c96186-e19e-4ccb-b3b2-06371404c063	CP BODY GROUNDING SOUL & ROOM ELIXIR	BBE6I107	Body Cabin	\N	t	2026-01-30 08:07:02.923	2026-01-30 08:07:02.923	20.02	\N
cmkd6qt4l004pcyntznycbii6	GLOW SENSE SPF50 50 ML	SKVC002	Skinvisibles	\N	t	2026-01-13 22:50:45.621	2026-01-13 22:50:45.621	17.50	Venda Público
cmkd6qswb0010cyntuv7l9tzn	PHYTO HY-OL BOOSTER HYDRATING 100 ML	BBA1C301	Cleansing System	\N	t	2026-01-13 22:50:45.323	2026-01-21 10:16:09.521	16.24	Venda Público
b59ee9fa-7136-4cdf-9e24-1d335e8e6b13	PHYTO HY-OL BOOSTER CALMING 100 ML	BBA1C302	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	29.15	\N
cc037066-0134-4e7f-afd1-2ced7877f296	HY-OL & PHYTO BOOSTER HYDRATING SET (2PCS)	BBA1C305	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	54.80	\N
c00a50f8-a227-4cba-8e81-02449ceda6d7	HY-OL & PHYTO BOOSTER CALMING SET (2PCS)	BBA1C306	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	54.80	\N
06c7dc76-70a0-4142-85d2-f3949ff3afcf	HY-OL CLEANSER & PHYTO BOOSTER BALANCING SET (2PCS)	BBA1C307	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	54.80	\N
5cd0ce44-23e9-4763-9d5b-8c87ccaeaf7d	HY-OL CLEANSER & PHYTO REACTIVATING SET (2PCS)	BBA1C308	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	54.80	\N
d1dbcc92-53ea-4ea7-ab2e-6ec429ed8ce3	DEEP CLEANSING FOAM 200 ML	BBA1C310	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	36.90	\N
8f2f6a52-8285-4679-b6c4-e6b9a8b16a4d	HYALURONIC CLEANSING BALM 150 ML	BBA1C313	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	61.60	\N
5654b395-fb4d-49d3-ac19-45549c41498d	SOOTHING ROSE TONER 200 ML	BBA1C316	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	37.10	\N
cmkd6qswd0011cyntlqksi501	PHYTO HY-OL BOOSTER BALANCING 100 ML	BBA1C303	Cleansing System	\N	t	2026-01-13 22:50:45.325	2026-01-21 10:16:09.521	16.24	Venda Público
cmkd6qswg0012cyntw0mttnkp	PHYTO HY-OL BOOSTER REACTIVATING 100 ML	BBA1C304	Cleansing System	\N	t	2026-01-13 22:50:45.328	2026-01-21 10:16:09.521	16.24	Venda Público
cmkd6qswi0013cyntfi5mcmzh	CLEAN GENTLE CLEANSING CREAM 100 ML	BBA1C309	Cleansing System	\N	t	2026-01-13 22:50:45.33	2026-01-21 10:16:09.521	13.75	Venda Público
cmkd6qswm0015cyntct6mps38	REFINING ENZYME & VITAMIN C CLEANSER 40 GR	BBA1C311	Cleansing System	\N	t	2026-01-13 22:50:45.334	2026-01-21 10:16:09.521	20.56	Venda Público
cmkd6qswp0016cyntakjgpghx	GEL & TONIC CLEANSER 200 ML	BBA1C312	Cleansing System	\N	t	2026-01-13 22:50:45.337	2026-01-21 10:16:09.521	17.15	Venda Público
cmkd6qswr0017cyntv9ojmzjq	NATURAL CLEANSING BAR REFILL 65 GR	BBA1C314	Cleansing System	\N	t	2026-01-13 22:50:45.339	2026-01-21 10:16:09.521	17.07	Venda Público
cmkd6qswu0018cynt081qkr69	EYE & HEAVY MAKE UP REMOVER 100 ML	BBA1C315	Cleansing System	\N	t	2026-01-13 22:50:45.342	2026-01-21 10:16:09.521	13.75	Venda Público
cmkd6qsww0019cynt19y6j0kc	GENTLE PEELING CREAM 50 ML	BBA1C317	Cleansing System	\N	t	2026-01-13 22:50:45.344	2026-01-21 10:16:09.521	15.82	Venda Público
cmkd6qswy001acyntm1e8a307	CLARIFYING PEELING CREAM 50 ML	BBA1C318	Cleansing System	\N	t	2026-01-13 22:50:45.346	2026-01-21 10:16:09.521	15.82	Venda Público
c1bde0e0-aeb6-4c87-ae3a-2f2f8977e6e3	CP HY-OL CLEANSER 500 ML	BBA1I300	Cleansing System	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.42	Profissional
86f98772-82db-4572-a909-897bfb774d91	CP PHYTO HY-OL BOOSTER HYDRATING 100 ML	BBA1I301	Cleansing System	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	14.48	Profissional
b2d7b5d5-2ffe-4ca3-9c51-4c26eb18567a	CP PHYTO HY-OL BOOSTER CALMING 100 ML	BBA1I302	Cleansing System	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	14.48	Profissional
72e9fdd8-8373-47a3-8b90-5214f327464a	CP EXP SP THERMAL TONING SPRAY 200 ML	BBA1I319	Expert Specialists	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.11	Profissional
47c98f74-2caf-4e0e-8adb-53c3eaf43626	CP EXP SPECIALIST TONIC 15% 500 ML	BBA1I320	Expert Specialists	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.48	Profissional
62d7755f-7fa8-43f1-bca0-1eec43123a02	CP EXP SP ENZYME PEELING 100 GR	BBA1I321	Expert Specialists	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	24.64	Profissional
a99c9e85-f692-44ad-a717-d1ddcc17f783	CP EXP LACTIC CLAY MASK 500 GR	BBA1I323	Expert Specialists	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	29.51	Profissional
cmkd6qsx1001bcynto3ogr1zn	NATURAL CLEANSING BAR + CAN 65 GR	BBA1C327	Cleansing System	\N	t	2026-01-13 22:50:45.349	2026-01-21 10:16:09.521	20.56	Venda Público
cmkd6qsxh001icyntv1xagbce	HYDRA PLUS 7X2 ML	BBF1C300	Ampoules	\N	t	2026-01-13 22:50:45.365	2026-01-21 10:16:09.521	15.39	Venda Público
cmkd6qszh002icyntz28kxdo5	HSR LIFTING CREAM RICH 50 ML	BBB8C76	HSR	\N	t	2026-01-13 22:50:45.437	2026-01-21 10:16:09.521	69.91	Venda Público
cmkd6qszk002jcynte3jmj5iv	HSR LIFTING EYE CREAM 30 ML	BBB8C77	HSR	\N	t	2026-01-13 22:50:45.44	2026-01-21 10:16:09.521	54.22	Venda Público
cmkd6qszm002kcyntw7o3mzjp	HSR LIFTING SERUM 30 ML	BBB8C78	HSR	\N	t	2026-01-13 22:50:45.442	2026-01-21 10:16:09.521	81.36	Venda Público
cmkd6qszp002lcyntyb2icitq	HSR LIFTING NECK & DECOLLETE CREAM 50 ML	BBB8C80	HSR	\N	t	2026-01-13 22:50:45.445	2026-01-21 10:16:09.521	61.03	Venda Público
cmkd6qt03002scynt4zm4bg5b	REGENERATION REBALANCING TONER 200 ML	BBE1C8101	Dr. Babor	\N	t	2026-01-13 22:50:45.459	2026-01-13 22:50:45.459	22.76	Venda Público
c0f4c3d5-34d2-43b5-86a4-61fe9c4f52df	DB MB AWAKENING EYE CREAM	BBE1C6002	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	21.06	Venda Público
38df44d6-5e17-4786-a744-d724b0812ef0	DB MB RENEWAL OVERNIGHT MASK	BBE1C6003	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	21.06	Venda Público
14a3c77b-693f-438f-afe4-0de4389f2132	DB MOISTURE GLOW CREAM 50 ML	BBE1C6004	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	28.30	Venda Público
a0fd9d79-5c50-43a1-a58a-8abfdd629c79	DB MB STRESS DEF MUSHROOM CREAM 50 ML	BBE1C6005	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	35.15	Venda Público
df28d985-251c-4afe-ac19-3a07698a35fd	DOC PC DE-STRESS & REPAIR LOTION 150 ML	BBE1C223	Dr. Babor	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	21.25	Venda Público
2e78deef-394c-4e76-a734-9bd06e2610eb	DOC CLEAN DEEP CLEANSING PADS 20ST	BBE1C1002	Dr. Babor	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	18.57	Venda Público
9b5f18f0-0b74-4482-9f6a-2abdbdf5c3a4	DOC CLEAN HERBAL BALANCING TONER 200 ML	BBE1C1012	Dr. Babor	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	15.93	Venda Público
cmkd6qt4i004ocyntn00rq2qc	AQUA SENSE HYALURONIC SPF50 50 ML	SKVC001	Skinvisibles	\N	t	2026-01-13 22:50:45.618	2026-01-13 22:50:45.618	17.50	Venda Público
cmkd6qsw9000zcyntvf9zrp49	HY-OL CLEANSER 200 ML	BBA1C300	Cleansing System	\N	t	2026-01-13 22:50:45.321	2026-01-21 10:16:09.521	18.18	Venda Público
cmkd6qszf002hcynt6juaas1a	HSR LIFTING CREAM 50 ML	BBB8C75	HSR	\N	t	2026-01-13 22:50:45.435	2026-01-21 10:16:09.521	66.44	Venda Público
181db390-fae8-4e53-985c-f277ea584b65	CLARIFYING DAILY BLEMISH CONTROL CLEANSING GEL 150 ML	BBE1C8600	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	26.02	Venda Público
ec6fa591-dd73-4c6c-9b75-c5e35d40e695	DB MB MOISTURE GLOW SERUM	BBE1C6001	Dr. Babor	\N	t	2026-01-29 19:07:10.117	2026-01-29 19:07:10.117	28.30	Venda Público
0c878b2f-c15b-4039-a6d6-0ec7dc187fe0	HSR LIFTING FOAM MASK 75ML	BBB8C81	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	59.45	\N
7701b8b9-4363-4717-90f4-0d00fc991bd7	HSR SHEET MASK FACE + NECK/DEC (20 PCS)	BBB8I53	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
73271bef-3a11-4822-92c5-9c410a53358c	PW HSR LIFTING EYE CREAM 50 ML	BBB8I66	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
667e6c7a-cae1-4ee6-8f3a-126bdc925f0e	HIGH PROT.SUN STICK SPF 50 8 G	BBC1C42*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	31.25	\N
59399aaa-66c4-4743-a3d2-261ca2e389a4	AFTER SUN REPAIR LOTION 200 ML	BBC1C48*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	33.15	\N
54fba7c0-eb12-49ba-8614-4b8b0e7eef54	MEN ENERGIZING FACE & EYE GEL 50 ML	BBC3C100*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	65.55	\N
32177cb9-bece-41ad-86e4-8b199f9ac0eb	MEN ENERGIZING HAIR & BODY SHAMPOO 200 ML	BBC3C103*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	29.25	\N
dbe803c8-fa29-41b2-af9a-f225d4b7793f	MEN TRAVEL SET (4 PCS)	BBC3C104*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	43.95	\N
1375bab9-89db-4455-b51c-0f7342eaed38	MEN INSTANT ENERGY AMPOULE CONCENT. 14 ML	BBC3C105*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	43.95	\N
06b36b3f-cf63-4553-b3ac-a9c33a0085d5	BM DYNAMIC FACE MOISTURIZER 50 ML	BBC3C57*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	54.30	\N
32e703ba-fb3a-4d70-98f1-32d783374040	HSR CP LIFTING CREAM RICH	BBB8I76	HSR	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	116.73	Profissional
def679c1-3f9b-437d-94a3-d04960a5c2c2	HSR CP LIFTING EYE CREAM	BBB8I77	HSR	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.20	Profissional
42b7d0c2-eead-4f09-99d8-ed7fe43edb98	CP SC EYE-MASSAGE SPATULA SET (2PCS)	BBC9PM004	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
29d9206c-b8e7-44d5-9545-7bd321acda11	ESSENTIAL CARE PURE CREAM INTENSE 50 ML	BBD10C01	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	29.75	\N
1e60bfab-22b7-4361-9bdd-d228db735d3b	ESSENTIAL CARE MOIST BALANC. CREAM 50 ML	BBD10C02	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	41.70	\N
e798c910-86c7-4b00-8544-a213d3895444	ESSENTIAL CARE PURE CREAM 50 ML	BBD10C03	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	29.75	\N
c5ea68c2-b366-49d8-bb38-ad62d217c24b	ESSENTIAL CARE MOISTURE SERUM 30 ML	BBD10C04	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	28.90	\N
5deedc8c-6fe8-44c8-aad1-0d7330a9b94e	ESSENTIAL CARE LIP BALM (12 PC)	BBD10C05*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
7abf5184-ea94-4302-a14f-e4cc9217f0de	SPA STOP CELLULITE WRAP (5x2 unid)	BBD1I16	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
10717222-282a-4cb9-9e7c-4ae6679f8d93	CP COMFORT CREAM MASK 200ML	BBD1I17	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
bb365dc2-389a-4e1c-a7b6-0a63ab7318d8	HSR CP LIFTING SERUM	BBB8I78	HSR	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	34.27	Profissional
66cfcd12-d107-48a9-ad22-32dde63b04d3	DB RC GLOW BOOSTER BI-PHASE AMPOULE 14X1ML	BBE1C100*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	64.80	\N
9ae974d7-c5f3-440a-ae97-216f58f9184f	DOC CLEAN AWAKENING EYE CREAM 15 ML	BBE1C1000	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	37.05	\N
508831c6-0eda-4bfb-8e3a-b9e62334a739	DOC CLEAN CLAY MULTI-CLEANSER 50 ML	BBE1C1001	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	24.75	\N
7b0fd3b6-f26e-4322-9040-865862001db8	HSR CP LIFTING CREAM MASK	BBB8I79	HSR	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	55.52	Profissional
dcb57298-4b6a-4a80-9945-a668e45f1ddf	DOC CLEAN PHYTO CBD 24H CREAM 50 ML	BBE1C1003	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	61.35	\N
bb15d069-dd42-4f62-a3f1-8bf9af5e2b51	DOC CLEAN PHYTO CBD SERUM 30 ML	BBE1C1004	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	61.35	\N
480a62a6-c9c9-457e-879e-f2db203c0c40	DOC CLEAN MOISTURE GLOW SERUM 30 ML	BBE1C1005	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	49.85	\N
6cb8cc37-b629-4fa8-916d-41c3ed87e869	DOC CLEAN MOISTURE GLOW GEL-CREAM 50 ML	BBE1C1006	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	49.85	\N
5e59990c-a124-41d0-9c05-80724f2705f1	DOC CLEAN RENEWAL OVERN MASK  75 ML	BBE1C1007	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	37.05	\N
5350c906-feb7-447f-b16e-7a15de6aca7e	DOC CLEAN REVIVAL CREAM RICH 50 ML	BBE1C1008	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	62.60	\N
7e19526a-d0be-4157-8284-1f1ba9a8716e	DOC CLEAN OIL-FREE CREAM	BBE1C1009	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	49.85	\N
246ada78-0394-4afe-970b-e021ab9e77fc	DB RC PORE REFINER 50ML	BBE1C101	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	81.05	\N
4d16d7f4-6fdd-49e1-a72d-6537f91523e8	DOC CLEAN RE-FILL DEEP CLEANSING PADS (20 ST)	BBE1C1011*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	28.55	\N
4a9ef247-9d5c-485f-81a5-c327fe99101f	SEACREATION THE TREATMENT SET (6 PCS)	BBC9I025	Sea Creation	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	112.22	Profissional
a7f25ae4-0ff8-4d5d-95cf-2565ca8a68a2	DOC CLEAN BB CREAM LIGHT SPF 20  40 ML	BBE1C1013	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	37.10	\N
9a569eb5-da48-43c8-b21c-c1bda6524d2f	DOC CLEAN BB CREAM MEDIUM SPF 20  40 ML	BBE1C1014	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	37.10	\N
081fbde5-af27-4666-9c43-a8fa0a95f5c8	DB RC REBALANCING LIQUID 200 ML	BBE1C105	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.35	\N
5823577e-d131-425d-8b19-dc440875b01e	DOC RC COUPEROSE CREAM 50 ML	BBE1C110	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	81.05	\N
c513abe9-d0f7-4d02-8628-deed0a70d91d	DOC HYDRO BIO-CELLULOSE MASK (1 ST)	BBE1C1102	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.60	\N
f02a306d-af48-4cf6-9094-3ad3d974651e	DOC NS CREAM COATED CALMING MASK (1 ST)	BBE1C1103	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.60	\N
cmkd6qszv002ocyntvtox7gth	SEACREATION THE CREAM RICH 50 ML	BBC9C021	Sea Creation	\N	t	2026-01-13 22:50:45.451	2026-01-21 10:16:09.521	296.08	Venda Público
cmkd6qszx002pcyntzmeae8a1	SEACREATION THE SERUM 30 ML	BBC9C022	Sea Creation	\N	t	2026-01-13 22:50:45.453	2026-01-21 10:16:09.521	147.90	Venda Público
091bea10-1bf4-48f6-9339-7aa5ccd74137	TESTER HY-OL CLEANSER 200 ML	BBA1PT300	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	7.70	Promo
34200b19-9a98-406f-8617-a38768644563	COLLAGEN BIOMATRIX 10 PCS	BBD1I03	Expert Specialists	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	121.72	Profissional
9353c4a2-40ff-4d1c-a6b7-044e843677ac	FIRMING ALGAE MASK PEEL OFF 30	BBD1I05	Expert Specialists	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	89.50	Profissional
579cce77-5274-4033-b8ed-70da42b7a172	FOILE THER.MODELAGE 0.35X100M	BBD1I12	Expert Specialists	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.28	Profissional
7e182fb3-0643-44bc-b31b-561b3917b322	GAZE THERMO MODELAGE 0.29X100M	BBD1I13	Expert Specialists	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	73.81	Profissional
7158f0a6-3998-4f01-aad2-fdb82fa0c8b9	TESTER CLE PHYTO HY-OL BOOSTER HYDRATING 100 ML	BBA1PT301	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	7.70	Promo
8e0f7cef-7c10-4bd5-84e3-d10068db17b7	TESTER CLE PHYTO HY-OL BOOSTER CALMING 100 ML	BBA1PT302	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	7.70	Promo
898d3cfe-d340-4d81-a6c5-51bcd0810b06	TESTER CLE PHYTO HY-OL BOOSTER BALANCING 100 ML	BBA1PT303	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	7.70	Promo
0838c91a-d9f6-4562-87e9-09385edae662	HSR CP LIFTING CREAM	BBB8I75	HSR	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	25.37	Profissional
dfebcd38-c55f-406c-9690-647b230473e3	DOC TIGHTENING MASK (1 ST)	BBE1C1104	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.60	\N
ebd36ff7-6a84-4777-8e2b-907be8fe2f51	DOC RC COUPEROSE SERUM 50 ML	BBE1C111	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	78.75	\N
52f021e5-9973-436f-b569-ad2f6da77ffe	DB RC A16 BOOSTER CONCENTRATE 30 ML	BBE1C113	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	127.40	\N
085ac79a-af5b-43bc-b80e-b2fb333f15ac	DB RC AGE SPOT CORRECTOR 50 ML	BBE1C115	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	63.65	\N
9ca7fc59-8540-444a-989e-bb990412e5e3	DB RC AGE SPOT PROTECTOR SPF 30 50 ML	BBE1C116	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	57.85	\N
2f6b89f3-d1c7-4f11-bd25-41021cdfe486	DOC ENZYME PEEL BALM 75 ML	BBE1C117	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	49.75	\N
da0d023c-3264-4568-be8d-4385f8a8e48d	DOC RC PEELING PADS (60 ST)	BBE1C118	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	52.05	\N
b9f21a5b-cb22-412c-8cb2-1a4803d56c4f	DB RC DETOX VITAMIN CREAM 50 ML	BBE1C119	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	115.50	\N
75bf1675-4903-4bbb-94de-2d2674ec0198	DOC RC 3D CELLULITE FLUID	BBE1C120	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	69.70	\N
849618e7-7eb9-407c-b212-8ca052426ac3	DB ULTIMATE REPAIR CLEANSER 200 ML	BBE1C200	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	44.10	\N
4fce293c-ba82-462b-981c-a11daef883b4	DB RC ULTIMATE ECM REPAIR SERUM 50 ML	BBE1C2004	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	115.85	\N
585470ae-f000-4548-a171-7454d21fcfe8	DB ULTIMATE REPAIR GEL-CREAM 50 ML	BBE1C202	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	130.10	\N
55796bee-14fa-4735-98cc-01510a8c6189	DB ULTIMATE REPAIR MASK 50 ML	BBE1C203	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	75.25	\N
7fffd5d5-7ec7-4a25-adb9-8bcecbec1e47	DB ULTIMATE CALMING SERUM 30 ML	BBE1C205	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	100.85	\N
81dbc3a9-da1d-4c3a-a6f5-d4b93ee8ad59	DB ULTIMATE BODY FORMING CREAM 200 ML	BBE1C207	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	94.25	\N
41a47234-a8f4-4292-a12f-5109727fdfaa	DB ULTIMATE REPAIR CREAM 50 ML	BBE1C210	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	132.10	\N
d5b9e299-94e5-4341-adf7-56b91b41c2e8	DOC PC BODY PROTECTOR SPF 30	BBE1C224	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	52.05	\N
6d444bce-3339-4fff-8d7c-2a93aa63104e	DOC RC AHA BHA TONER 200 ML	BBE1C3000	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	40.85	\N
80a20222-5013-4134-9775-142322cbb6a4	DOC RC RETINOL SMOOTHING TONER 200 ML	BBE1C3001	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	40.85	\N
bf7a41a6-9391-44c3-a2ca-51644baa06ec	DOC RC TRIPLE PRO-RETINOL CREAM 50 ML	BBE1C3002	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	140.20	\N
0bac45ec-f439-4350-82a8-bdb286da24ca	DOC TRIPLE PRO-RETINOL RE EYE PATCH (5ST)	BBE1C3003	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	66.65	\N
aa361fd4-2940-4fcf-903e-f36dbb72c9cb	DOC BLEMISH REDUCING CREAM 50 ML	BBE1C303	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	98.30	\N
7b933f86-a837-48e6-be96-1e4808e8fa35	DOC BLEMISH REDUCING  DUO 4 ML	BBE1C304	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	38.15	\N
c6868f82-8535-400e-88a2-952a4f10e330	DO SOS DE-BLEMISH KIT 59 ML	BBE1C306	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	98.45	\N
f64369c4-2e66-42e9-8213-a92a6b4a1815	DOC RC REFINE DETOX LIPO CLEANSER 100 ML	BBE1C31	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	52.30	\N
c11a152b-6ca1-4be5-ad1e-85042177b7b6	DB NEURO SENSITIVE CALMING CLEANSER 150 ML	BBE1C510	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.60	\N
3c975bda-8084-4871-8648-f7977f2b163f	DB NEURO SENSITIVE CALMING CREAM 50 ML	BBE1C511	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	81.05	\N
a42985c5-9477-40da-ba98-494691f6a1e3	DOC NEURO INTENSIVE CREAM RICH 50 ML	BBE1C513	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	86.85	\N
90b0301a-be83-4982-b540-f60b56d39fcc	DB LIF C COLLAGEN BOOSTER CREAM 50 ML	BBE1C700	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	130.10	\N
15dff1b1-971a-4c9e-9028-139d6b3ff3cc	DB LIF C COLLAGEN BOOST INFUSION 4X7 ML	BBE1C701	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	139.00	\N
2174a249-0dfd-4749-9253-dde082964282	DB LIF C FIRMING LIP BOOSTER 15 ML	BBE1C706	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	57.85	\N
2a2ed83f-2ad3-45e5-b1d3-ef2ea8910d60	DB LIF C DUAL EYE SOLUCION (DAY+NIGHT) 2X15 ML	BBE1C707	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	87.05	\N
4086666c-154d-416d-b11a-0abd93555051	DB LIF COLLAGEN BOOSTER CREAM RICH 50ML	BBE1C714	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	139.00	\N
38e878bd-da75-4c9b-8ff8-907deb4e923a	DOC FACE INSTANT LIFT EFFECT CREAM 50 ML	BBE1C718	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	133.20	\N
42cbb6c0-b090-4914-9666-6e811f201866	DOC LC COLLAGEN -PEPTIDE SERUM 30ML	BBE1C719	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	105.15	\N
02ab8145-2fe5-44ba-9d06-5c4a089b9aa0	DB HC HYALURON INFUSION 30 ML	BBE1C800	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	86.85	\N
8d08bcb2-dd83-48da-aeee-3ff4ff7fbb00	DB HC HYALURON CREAM 50 ML	BBE1C801	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	86.85	\N
c8a1d553-3306-495d-8e55-c9d9e05ff9fa	DB HC 3D-HYDRO GEL FACE MASK	BBE1C802*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	56.45	\N
7a22deed-17ee-4081-9bfa-254f95f7ce17	PRO EGF GROWTH FACTOR CONCENTRATE 30 ML	BBE1C906	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	147.65	\N
b9dc6862-bd38-4003-b0e2-df11911a5908	PRO AG MICROSILVER CONCENTRATE 30 ML	BBE1C908	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	102.95	\N
cmkd6qt47004kcynt0kmctk9c	PRO CE CERAMIDE CONCENTRATE	BBE1C904	Pro Concentrates	\N	t	2026-01-13 22:50:45.607	2026-01-21 10:16:09.521	28.69	Venda Público
57e93082-4f27-47f2-af02-5fdd7c0eac6e	PRO NIC SKIN ACTIVATOR 75 ML	BBE1C914*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	39.60	\N
88912595-efd7-42e8-8f81-ed135a17a349	TESTER CLE PHYTO HY-OL BOOSTER REACTIVATING 100ML	BBA1PT304	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	8.00	Promo
cmkd6qt44004jcyntpj8a4luq	PRO HA HYALU. ACID CONCENTRATE	BBE1C902	Pro Concentrates	\N	t	2026-01-13 22:50:45.604	2026-01-21 10:16:09.521	57.93	Venda Público
f59c6e4a-dea5-4212-97d1-fa1b1aa5c2bc	TESTER GENTLE CLEANSING CREAM 100 ML	BBA1PT309	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	6.66	Promo
ac3dde62-9f59-431d-b2bb-b57390ed4eeb	TESTER CLE DEEP CLEANSING FOAM 200 ML	BBA1PT310	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	9.98	Promo
c74b2153-b846-444b-948c-eaefa524d7c6	TESTER CLE ENZYME & VITAMIN C CLEANSER 40 GR	BBA1PT311	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	9.98	Promo
9c32481c-6414-4caa-bd59-6b4a5544a3ab	TESTER CLE GEL & TONIC CLEANSER 200 ML	BBA1PT312	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	8.32	Promo
f46faadc-af56-4edf-a7de-cd3b5d9dc728	TESTER HYALURONIC CLEANS.BALM 150 ML	BBA1PT313	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	16.64	Promo
06c1662e-19f1-4c15-b722-8ea5f5b924ef	TESTER CLE EYE & MAKE UP REM. 100 ML	BBA1PT315	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	6.66	Promo
7d1584dd-65bf-40a5-a5ac-00ca1c09f67a	TESTER CLE SOOTHING ROSE TONER 200 ML	BBA1PT316	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	9.98	Promo
434ce0d8-b2b2-4328-956a-443a3000fb49	TESTER CLE GENTLE PEELING CREAM 50 ML	BBA1PT317	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	7.70	Promo
a7272947-f965-47e8-8523-f5bfe1863b54	PRO POST AHA PEEL KIT TREATMENT (4 PCS)	BBE1C922*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	54.25	\N
39c3cd05-484e-4e89-a491-c976c0c21afe	PRO RETINOL EYE CREAM 15ML	BBE1C930	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	78.95	\N
a6803811-fde3-4839-b35c-271b944cb052	DECO FOLDING BOXES CLEANSING 011 SET	BBA1PD300	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	17.68	Promo
cfaddf0d-44bc-40ac-86b0-980ed5f2f1bc	POSTERSET CLEANSING RELAUNCH NL/FR (3 PCS)	BBA1PP300	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	37.44	Promo
f9781764-60cc-4832-8787-641f7ef6f2b4	CP DOC CLEAN MULTITONER 100 ML	BBE1I1010*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
ab62a78d-e1ec-460f-812d-218359c05163	CP DB RC REBALANCING LIQUID 500 ML	BBE1I105	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
b727baa5-ee40-4f62-8525-45b7b6033c03	CP SET DOCTOR BABOR REFINE CELLULAR	BBE1I107*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
b8273670-148a-4537-90fe-4fa268600d82	PW DB RC A16 BOOSTER CONCENTRATE 30 ML	BBE1I108	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
92c315f7-b75a-4996-846c-e3fca9b3a888	CP DB RC COUPEROSE SERUM 30 ML	BBE1I111	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
cdf142e5-df07-4a86-b1f4-3ad585cfb960	CP DOC RC ULT. PEELING LIQUID 200ML	BBE1I112	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
eb5ec5e8-e05e-4355-a3b8-6cb6d9fd19f5	CP DOC RC ULT. PEELING MASK 200ML	BBE1I114	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
75a80be4-1585-42c5-894e-8b8fd00db097	PW DOC ENZYME PEEL BALM 75 ML	BBE1I117	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
a0735b48-9c40-4ae2-b15d-bb4f0957fd9f	CP DOC DETOX VITA. CREAM WORLD	BBE1I119	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
97d217a4-8fbb-4049-ab51-b8ad0f68cf09	DB CP ULTIMATE REPAIR CLEANSER 200 ML	BBE1I200	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
da109cbe-74d0-4254-a1da-a070a510725d	DB CP ULTIMATE ECM REPAIR SERUM 48 ML	BBE1I2004	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
5107238f-64a3-48ae-bea8-05a9a472e3c3	DB CP ULTIMATE REPAIR MASK 200 ML	BBE1I203	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
6780bee4-4798-4abc-9c85-baaf07c4151a	DB CP ULTIMATE REP CALMING SERUM 30 ML	BBE1I205	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
03d830b6-0af5-4e54-bfb5-98aff6ebe834	DB CP TECH ULTIMATE TONIC 200 ML	BBE1I209	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
678959fa-f65d-4478-9869-e61489327c2e	DB CP ULTIMATE REPAIR CREAM 200 ML	BBE1I210	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
cc1fb7a5-869c-4e47-8539-717c3ef189c8	CP DOC PC PROTECTING BALM SPF50 150 ML	BBE1I220	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
14427eca-2ccd-419e-80b5-7a69e61e00fb	CP DB GLOW BOOSTER BI-PHASE AMP 24 X 1ML	BBE1I27	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
7d78c6f5-a1d9-4022-b0d5-7e35ba376199	CP DB YOUTH CONTROL BI-PHASE AMP 24 X 1ML	BBE1I29*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
ef980ad6-0528-44e2-b492-30944fcac366	CP DOC RC TRIPLE PRO-RETINOL CREAM 200ML	BBE1I3002	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
1fcb7259-7d59-489e-a6c3-50c6bb5cc93c	PW DOC BLEMISH REDUCING CREAM 50 ML	BBE1I303	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
e5604fd6-2ab8-4312-883d-2485b0130494	PW DOC PURITY STOP BLEMISH FLUID 30 ML	BBE1I305	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
0689b0e7-49f9-4fef-8afd-7ae6b200bea0	PW DOC RC DETOX LIPO CLEANSER 100 ML	BBE1I31	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
af18841a-9870-4dd6-8c3e-9a20ab0afce9	CP DB NEURO SENSITIVE CALMING CLEANSER 150 ML	BBE1I510	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
c6764b97-faff-45c1-a6ba-c44f25b25057	CP DB NEURO SENSITIVE CALMING CREAM RICH 50 ML	BBE1I513	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
64999064-6af9-4aa5-9559-4cb3146197bc	CP DB COLLAGEN BOOSTER CREAM 200 ML	BBE1I700	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
c017217e-0259-4067-a504-5d5065ef78dd	CP DB COLLAGEN BOOST INFUSION 30 ML	BBE1I701	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
9661b82a-6b8d-4179-be5b-d3908d8f6721	CP DB BTX-LIFT SERUM 30 ML	BBE1I708*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
b102eb04-3b6f-49fc-a056-2187714df1e8	CP DB LIF C COLLAGEN BOOSTER TREAT KIT (4)	BBE1I712*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
24fef0e2-a97a-4c4a-bcdd-f7ad2ad2f67c	CP DB LIF C RECONTOURING TREAT KIT (5)	BBE1I713*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
f98c3620-2e74-497c-8392-ad7c56768ebe	PW DB LIF COLLAGEN BOOSTER CREAM RICH 200 ML	BBE1I714	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
7c882bec-5ae6-4d6f-b601-4d48e9ced975	CP LC SILVER FOIL FACE MASK (10 PCS)	BBE1I717	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
bb9fef84-eb8b-4c67-a6fa-dc6573bdadc9	CP DOC FACE INSTANT LIFT EFFECT CREAM 50 ML	BBE1I718	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
6df7fa55-8564-4189-9e42-c3e5cc2127a4	PW DB HC HYALURON INFUSION 30 ML	BBE1I800	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
24d3a59a-6dd3-45d2-be4e-eae2d66bb936	CP PRO C VITAMIN C CONCENTRATE 30 ML	BBE1I900	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
bcee130c-b6e0-4c99-b946-b7c1c3e36efb	CP PRO HA HYALURONIC ACID CONCENTRATE 50 ML	BBE1I902	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
6191f308-2c41-4e15-8db6-60d7d22314a4	CP PRO FR FERULIC ACID CONCENTRATE 30 ML	BBE1I903	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
1819f71f-0cf3-4496-ac3d-480e55e69019	CP PRO CE CERAMIDE CONCENTRATE 30 ML	BBE1I904	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
d68efb90-da1a-4b90-a077-40026cc9810e	CP PRO BG BETA GLUCAN CONCENTRATE 30 ML	BBE1I905	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
2bfaec05-1775-4f10-b673-7a658dabea69	CP PRO AG MICROSILVER CONCENTRATE 30 ML	BBE1I908	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
0098b09a-0750-4be8-a921-2240c0199067	CP DOC CLEAN AWAKENING EYE CREAM 15 ML	BBE1I1000	Dr. Babor	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.20	Profissional
dd13fdc2-ebd2-4971-9230-a9617a51f5e0	CP DOC CLEAN CLAY MULTI-CLEANSER 100 ML	BBE1I1001	Dr. Babor	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	14.56	Profissional
f443e1f8-bbb3-42e4-8aea-a487a4cc56c3	CP DOC CLEAN DEEP CLEANSING PADS 20ST	BBE1I1002	Dr. Babor	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.64	Profissional
766a63a5-3e9b-4762-9817-fd4143b13e79	CP PRO EGF GROWTH FACTOR CONCENTRATE 30 ML	BBE1I906	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	20.57	Profissional
c662b756-db1b-4bf2-b33d-df4d0785484f	CP PRO BA BOSWELLIA ACID CONCENTRATE	BBE1I907	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	13.51	Profissional
5eb25c39-080a-474f-a4d9-98ab9291acfb	CP PRO CERAMIDE CREAM	BBE1I910	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	34.88	Profissional
9f8e0ba3-846b-44d4-8a28-b2bfdcbe40ef	CP PRO LMS LIPID CREAM	BBE1I911	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	34.88	Profissional
616c36f9-c05a-4f91-b8dc-a359933d883b	SAMPLE HY-OL & PHYTOACTIVE REACT 5 ML	BBA1PA333	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	1.69	Promo
f2455756-883a-4aae-8e6e-5bfaa1e9e5a5	SAMPLE ENZYME CLEANSER+ROSE TONING ESSENCE 6 ML	BBA1PA227A	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	1.69	Promo
1673a883-e876-49f0-9839-6f930accc4de	TESTER CLE NATURE CLEANSING BAR 65 GR	BBA1PT327	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	9.98	Promo
31c71c7c-1b00-4313-a159-e1af6b27cf2a	CP PRO EGF CREAM MASK 200 ML	BBE1I915	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
63a2be06-d136-49f3-afdb-74fa69bfdff1	CP PRO AHA PEELING 20% PH 2.7 100 ML	BBE1I919*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
82e832e5-9af5-4a63-9cd1-a9124c7fdc07	DOC RC AHA BHA TONER 50ML	BBE1PB3000	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.35	\N
1a5c39e0-edcb-4d49-9db5-47fa3ff927a4	INTENSE BALANCING FLUID 14 ML	BBF1C010*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.00	\N
cbd7ab33-b767-46bc-a1e5-f997a0a073ec	CP AYURVEDA OIL SOYA 5L	BBE5I100	Babor SPA	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	50.06	Profissional
f88fdd03-9877-4310-852d-fd2cfcbd2c1c	CP AYURVEDA OIL ALMOND 5L	BBE5I101	Babor SPA	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	108.22	Profissional
f0e63633-6690-47cb-8b4e-b1ef10f19d43	CP SALT PEELING & BATH 5KG	BBE5I102	Babor SPA	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	79.52	Profissional
d0c63990-eefb-4484-890e-37c635f12f9b	CP ALGAE POWDER 2KG	BBE5I103	Babor SPA	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	246.85	Profissional
126ac832-25ec-4c90-98ce-3818c57a21fa	CP SHAPING THERMO LOTION 500ML	BBE5I010	Babor SPA	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	45.64	Profissional
4f715966-4f25-4e4d-8803-4dbb949f001a	SPA ENERGIZING HAND & BODY WASH 200 ML	BBE5C210	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	26.60	\N
0e92f789-d353-4462-80b2-973abd587559	CP SPA ENERGIZING FEET SMOOTHING BALM 500 ML	BBE5I214	Babor SPA	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	34.80	Profissional
c01cd7a9-48f9-4eb3-947d-f0b5c2468543	CP SHAPING FOOT BATH 500ML	BBE5I032	Babor SPA	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	22.90	Profissional
fa903667-b5b1-4de8-98d6-d97777f19665	SPA ENERGIZING FEET SMOOTHING BALM 150 ML	BBE5C214	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	28.20	\N
693cdecf-4aa1-4334-9523-42d59219bc9c	CP SHAPING MILK BATH 500ML	BBE5I011*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
f5f8fb2a-d4ac-4ab5-be2c-88a343a79eb5	CP SPA SHAPING PEELING CREAM 500 ML	BBE5I111	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
c74ba5c3-3ffa-4eca-9bdf-e3bde4048db9	CP SPA SHAPING BODY FIRMING CREAM 500 ML	BBE5I116	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
8ad06c83-ddb0-4340-9c44-f60b3d5a70c9	CP SPA SHAPING ELIXIR 50 ML	BBE5I117	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
36003f17-aa33-4662-a868-21287faef3ba	CP SPA SHAPING MASSAGE & BATH OIL 500 ML	BBE5I118	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
beca0d67-fa09-49c8-b8f4-ddb27542f7ee	CP ENERGIZING MASSAGE & BATH OIL 500 ML	BBE5I201*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
a678d57d-8d8a-4793-8e01-36333ca7c9b0	CP SPA ENERGIZING BODY PACK 500 ML	BBE5I202*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
b5756daa-4ed9-40ed-a8d5-6c33ce3a57f5	CP SPA ENERGIZING HAND & BODY WASH 500 ML	BBE5I210	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
ae3586cc-d023-4754-ae90-fa42c9b4fa12	CP SPA ENERGIZING BODY REFRESHING CREAM 500 ML	BBE5I216	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
2b3150de-f955-46f4-aac5-2e22954fae0b	CP SPA ENERGIZING MASSAGE & BODY OIL 500 ML	BBE5I217	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
8f72be7a-aa40-44ac-aa35-f12bf18bf3a1	PROMO FLUID MULTIVITAMIN 14 ML	BBF1C024*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
deb75751-6450-4dd6-a25e-868d2b544e96	ALGAE VITALIZER 7X2ML	BBF1C036*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
af2cf0a1-d1e4-4612-8e59-f2e0aecae2d6	PERFECT GLOW 7X2ML	BBF1C037*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
f9cbebcf-88ea-4c6a-a45b-100fdca63447	CP PRO AHA PEELING 10% PH 3.5 100 ML	BBE1I916	Expert Specialists	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	84.20	Profissional
980cbcfc-4466-4d84-a1e1-ef0f00c9c7cc	10ER NEEDLING CALMING MASK FACE (10 PCS)	BBE1I925	Expert Specialists	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.56	Profissional
7ff86e3f-973e-4ff9-ae35-66a84fb958cc	CP PRO-ATP CELL ENERGY 30 ML	BBE1I926	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	21.37	Profissional
965d4a9e-a0ab-4cc8-934b-f53b8f5519b0	CP PRO RETINOL CONCENTRATE A 30 ML	BBE1I929	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	19.39	Profissional
52d7925b-0573-413b-8e29-c5e6ae99eb67	CP PRO LIFT EFFECT MASK	BBE1I917	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	46.34	Profissional
1f7469ff-4f46-4e6e-8be5-24619823b657	CP PRO AHA PEELING 20% PH 3.0	BBE1I918	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	83.32	Profissional
db67a422-d8e5-4446-930d-257b316bd770	CP PRO AHA PEELING 30% PH 2.7	BBE1I920	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	83.32	Profissional
74b4a190-3767-417e-9a5b-5cf4324c380a	CP PRO AHA CLEANSING LOTION	BBE1I923	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.65	Profissional
b32b14d6-7271-4c35-8fe2-b439ca3b5125	CP PRO BHA CLEANSING GEL	BBE1I924	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.65	Profissional
2201f32f-f2e1-4ce2-a161-474de2895fa1	CP PRO RETINOL EYE CREAM 30 ML	BBE1I930	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	23.14	Profissional
f8c76481-3058-4205-af7d-1c8836f6ece4	CP SPA ENERGIZING HAND & MANI CREAM 200 ML	BBE5I213	Babor SPA	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	18.37	Profissional
cmkd6qt3r004ecyntt9fdjvxf	DOC PRO LONGEVITY SERUM 30 ML	BBE1C9002	Dr. Babor Pro	\N	t	2026-01-13 22:50:45.591	2026-01-13 22:50:45.591	79.65	Venda Público
cmkd6qt3t004fcyntgvsx4qfs	DOC PRO HYALURONIC ACID PLUMP.SERUM 50 ML	BBE1C9003	Dr. Babor Pro	\N	t	2026-01-13 22:50:45.593	2026-01-13 22:50:45.593	59.72	Venda Público
bd499438-6b0d-45d8-a9f8-9850ab13c945	DOC PRO ENERGY ACTIVAT ESSENCE 100 ML	BBE1C9005	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	26.51	Venda Público
efaefde3-dc8d-4981-828b-6edab97e0d71	DOC PRO OV.ACID PEEL PH4 L-ON 50 ML	BBE1C9006	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	53.08	Venda Público
7e79fd11-8fe4-4fae-9154-903b71e9ac2b	DOC PRO BARRIE RESIL TON SPRAY 100 ML	BBE1C9007	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	21.87	Venda Público
e906203d-04f5-43e1-a444-dd897ae7fe06	TESTER CLE OIL INF CLEAN WIPES (25 ST)	BBA1PT342	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	8.00	Promo
d6269a63-7c95-414f-b41a-c9716112c502	SAMPLE CLE OIL INF CLEAN WIPES	BBA1PA342	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	0.40	Promo
2bf040d1-4fce-43c3-b581-5d1a3e183978	DOC RC RETINOL SMOOTHING TONER SMALL SIZE	BBE1PB3001	Miniaturas	\N	t	2026-01-21 10:16:09.521	2026-01-29 19:32:12.149	5.20	Promo
86c4b377-05a2-4bc7-bf44-772e1a66b51a	AMPOULE CONCENTRATES GIFT SET 7X2 ML	BBF1C043*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
343baa97-a3bb-453b-9bdf-d8d309460d4b	AMPOULE CONCENT PRECIOUS COLLECTION 14 ML	BBF1C101	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	63.65	\N
3751c051-8bb3-4e2f-8c32-2e7383f256a0	POWER SERUM AMPOULES + HYALURONIC ACID 14ML	BBF1C203	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	47.05	\N
412c77dd-6504-4f2a-92f6-9cb15ef561f4	POWER SERUM AMPOULES + CERAMIDE 14ML	BBF1C204	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	59.05	\N
fa74514c-cbf6-49d2-b6dd-a66db2c5219d	AMP WHITE COLLECTION 7X2 ML	BBF1C310*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	31.20	\N
980c8c99-1d28-4839-8523-a04c1ec61dd7	CP COLLAGEN BOOSTER 24X2 ML	BBF1I029*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
cf94a1f8-a658-4e36-84bc-fb0053af5237	CP PERFECT GLOW 48ML	BBF1I037*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
bc8d619d-8ef4-4ac2-8c4a-97ced190b9f5	CP LIFT EXPRESS 24X2 ML	BBF1I038*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
186a30be-4750-449a-8c2a-b9378376e2ab	CP POLLUTION PROTECT 24X2 ML	BBF1I046*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
63084d2a-1a19-4bec-a5fd-bf99a5695370	CP 3D FIRMING 24X2 ML	BBF1I302	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
a8a57f4f-b27f-4ece-9bf9-3ef2b6398991	REVERSIVE EAU DE PARFUM 50 ML	BBG1C017*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	82.00	\N
e00542ec-736d-4fbc-899d-95b83e7c6f8a	REVERSIVE COCOONING LINEN	BBG1I002*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
180959ff-fd42-4615-9a73-646c242b5b6b	REVERSIVE TREATMENT SET (5 PCS)	BBG1I016*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
5e1586ae-5dde-4a9f-b77d-22771dc29e4a	MOISTURIZING CREAM 50ML	BBS1C012*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	81.20	\N
c17f0f8c-a29c-4739-b8da-75a338e590f1	CP MOISTURIZING CREAM 50ML	BBS1I012*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
53c63fe8-a628-4861-bd61-cb3777aac23e	CP MOISTURIZING CREAM RICH 200ML	BBS1I013*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
d7369b6c-c911-45be-9aed-6c667ca1a524	CP MOISTURIZING FOAM MASK 75ML	BBS1I015*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
1b132af7-91b7-4dd7-8004-8b2a521f9171	CP CALMING CREAM RICH 200ML	BBS2I013*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
e6a8a45e-b186-4e51-b32a-5365f5686465	POWER SERUM AMPOULES + RETINOL 0,3%  14ML	BBF1C201	Ampoules	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	20.00	Profissional
b506e5bc-da1c-4d02-abd9-cdee55de9c50	POWER SERUM AMPOULES + BETA GLUCAN 14ML	BBF1C202	Ampoules	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	20.00	Profissional
d3a196dd-79ae-4c0a-a553-82289861b02b	POWER SERUM AMPOULES + PEPTIDES	BBF1C205	Ampoules	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	20.00	Profissional
07112348-c87b-4cdf-92bd-4936f733a40d	SKINOVAGE BALANCING CREAM RICH 50 ML	BBS3C101	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	79.75	\N
45d217bf-2df0-41ae-8015-7dd7df4b3174	CP BALANCING CREAM RICH 200ML	BBS3I013*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
2e7b9254-9274-45d1-a96e-9ee9acc29e04	CP BALANCING MASK 200ML	BBS3I015*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
3f5963be-62e6-4f71-88c9-09cb80f656ce	STRESS CONTROL  7X2 ML	BBF1C045*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.35	\N
76976adb-51a9-42e7-8a6c-aab3b7c66dc7	POWER SERUM AMPOULES + VITAMIN C 20% 14ML	BBF1C200	Ampoules	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	20.00	Profissional
8cff6cda-6bd5-4700-9a6b-5733d891ad8d	PURIFYING CREAM RICH 50ML	BBS4C0013*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	84.10	\N
cmkd6qsxm001kcynthj31vhax	ALGAE VITALIZER 7X2 ML	BBF1C309	Ampoules	\N	t	2026-01-13 22:50:45.37	2026-01-21 10:16:09.521	21.90	Venda Público
cmkd6qsxo001lcyntss3wmorr	3D FIRMING 7X2 ML	BBF1C302	Ampoules	\N	t	2026-01-13 22:50:45.372	2026-01-21 10:16:09.521	25.70	Venda Público
cmkd6qsxr001mcynt7zkmu57s	LIFT EXPRESS 7X2 ML	BBF1C303	Ampoules	\N	t	2026-01-13 22:50:45.375	2026-01-21 10:16:09.521	27.80	Venda Público
cmkd6qsxt001ncyntarwgvmiu	COLLAGEN BOOSTER 7X2 ML	BBF1C304	Ampoules	\N	t	2026-01-13 22:50:45.377	2026-01-21 10:16:09.521	27.80	Venda Público
cmkd6qsxu001ocynt10bykvmy	SOS CALMING 7X2 ML	BBF1C305	Ampoules	\N	t	2026-01-13 22:50:45.378	2026-01-21 10:16:09.521	22.31	Venda Público
cmkd6qsxw001pcynt9d73geul	ACTIVE PURIFYIER 7X2 ML	BBF1C308	Ampoules	\N	t	2026-01-13 22:50:45.38	2026-01-21 10:16:09.521	18.55	Venda Público
cmkd6qsxy001qcyntv76vea6a	ACTIVE NIGHT 7X2 ML	BBF1C306	Ampoules	\N	t	2026-01-13 22:50:45.382	2026-01-21 10:16:09.521	27.80	Venda Público
cmkd6qsy0001rcyntfy2926af	MULTI VITAMIN 7X2 ML	BBF1C307	Ampoules	\N	t	2026-01-13 22:50:45.384	2026-01-21 10:16:09.521	18.92	Venda Público
cmkd6qsy5001ucynt6tsrhjid	SKINOVAGE CALMING CREAM	BBS2C100	Skinovage	\N	t	2026-01-13 22:50:45.389	2026-01-21 10:16:09.521	43.09	Venda Público
cmkd6qsy8001vcyntmfmcao48	SKINOVAGE CALMING CREAM RICH	BBS2C101	Skinovage	\N	t	2026-01-13 22:50:45.392	2026-01-21 10:16:09.521	44.47	Venda Público
cmkd6qsy9001wcyntktg2zai3	SKINOVAGE CALMING SERUM	BBS2C102	Skinovage	\N	t	2026-01-13 22:50:45.393	2026-01-21 10:16:09.521	43.09	Venda Público
cmkd6qsyb001xcyntqm6egxsq	SKINOVAGE BALANCING CREAM	BBS3C100	Skinovage	\N	t	2026-01-13 22:50:45.395	2026-01-21 10:16:09.521	43.09	Venda Público
cmkd6qsyd001ycynt02pxhuwz	SKINOVAGE BALANCING SERUM	BBS3C102	Skinovage	\N	t	2026-01-13 22:50:45.397	2026-01-21 10:16:09.521	43.09	Venda Público
31d10c82-fdc0-4b4b-86da-3ce5b165610a	SAMPLE AMP NUTRI RESTORE	BBF1PA500	Ampoules	\N	t	2026-01-29 19:31:42.255	2026-01-29 19:31:42.255	2.18	Promo
cmkd6qsxj001jcyntg089ebp3	PERFECT GLOW 7X2 ML	BBF1C301	Ampoules	\N	t	2026-01-13 22:50:45.367	2026-01-21 10:16:09.521	21.90	Venda Público
c2ce2a76-ea17-42fa-84ee-9e3036acab5b	DECO FACTISE CEVIN P AMP	BBF1PD400	Ampoules	\N	t	2026-01-29 19:31:42.255	2026-01-29 19:31:42.255	5.00	Promo
48ea19b2-d4f7-429b-acfe-62c5fc31a811	SAMPLE AMP HYDRA PLUS 2 ML	BBF1PA300	Ampoules	\N	t	2026-01-29 19:31:42.255	2026-01-29 19:31:42.255	1.87	Promo
4f78cbd7-4798-4d5d-8778-e530cd763603	SAMPLE AMP COLLAGEN BOOSTER GLOW 2 ML	BBF1PA304	Ampoules	\N	t	2026-01-29 19:31:42.255	2026-01-29 19:31:42.255	1.87	Promo
404ce1e3-94b3-42ba-b3b5-11375977a4ce	DEKOFACTISEN HANNA S PROMO AMP	BBF1PD600	Ampoules	\N	t	2026-01-29 19:31:42.255	2026-01-29 19:31:42.255	5.00	Promo
1de0f9f1-2028-4fd3-81e9-e0ca1d69fddf	AMPULLEN DISPLAY BASIS MODUL 2ER	BBF1PE004	Ampoules	\N	t	2026-01-29 19:31:42.255	2026-01-29 19:31:42.255	19.99	Promo
4cdfad96-72d2-425e-ab3a-08b32aa0ad7c	AMPOULE CP DISPLAY 2016	BBF1PE005	Ampoules	\N	t	2026-01-29 19:31:42.255	2026-01-29 19:31:42.255	114.22	Promo
ccfac6f2-8b2e-4b46-bed3-a6e2cc664507	DISPLAY AMPOULES PROMO 2024	BBF1PE400	Ampoules	\N	t	2026-01-29 19:31:42.255	2026-01-29 19:31:42.255	43.00	Promo
d917b48b-d5bf-481d-b50a-610a24bd8b1a	TESTER POWER SERUM AMPOULES + BETA GLUCAN 30 ML	BBF1PT202	Ampoules	\N	t	2026-01-29 19:31:42.255	2026-01-29 19:31:42.255	33.31	Promo
1f4ba10e-3426-4b2f-84b2-bc5e4524b718	CP HYDRA PLUS 24X2 ML	BBF1I300	Ampoules	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	53.37	Profissional
a06de697-593e-42fc-9aa1-0debf77e5115	POLLUTION PROTECT 7X2 ML	BBF1C046*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.60	\N
aafbe6a1-8b61-4b7d-ad3e-88534b65a727	SKINOVAGE VITALIZING CREAM 50 ML	BBS4C100	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	77.30	\N
ae390a8f-433c-46a5-8e75-3d484c391d6f	SKINOVAGE PURIFYING CREAM 50 ML	BBS5C100	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	72.95	\N
1ef64e87-0f58-4cb7-8262-252fbbdebf73	CP SKINOVAGE PURIFYING CREAM 50 ML	BBS5I100	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
85a3a001-b533-4497-9816-4ef4a386350f	CP ARGAN CREAM 200ML	BBS6I010*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	\N	\N
cmkd6qsyh0020cynt2ui14ay0	SKINOVAGE VITALIZING CREAM RICH 50 ML	BBS4C101	Skinovage	\N	t	2026-01-13 22:50:45.401	2026-01-21 10:16:09.521	44.47	Venda Público
80c844dc-bbb8-405d-940a-0e333308fc44	LIPID BALANCING CREAM 50ML	BBS8C010*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	81.85	\N
e3e45284-47f6-4d03-9fb6-b631e7a6795f	BB CREAM 01	BBS8C018*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	81.85	\N
ad950b7a-23c9-40a7-b52d-edfa7ad49fdf	DOC AHA CLEANSING LOTION SMALL 20 ML	BBZPB008	Miniaturas	\N	t	2026-01-21 10:16:09.521	2026-01-29 19:32:43.618	5.34	Promo
eb265320-72b4-42fd-b164-4df570b9ee24	AMP CONCENTRATE SMALL (3X2) 6 ML	BBZPB010	Miniaturas	\N	t	2026-01-21 10:16:09.521	2026-01-29 19:33:20.219	5.28	Promo
55878c22-2d9e-454b-8e22-0a8d0b69bf47	Creamy Comp FDT SPF50 01 light	BBMKC103	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.97	\N
382f39a3-58d4-470c-84ca-18547a394c6b	Creamy Comp FDT SPF50 02 medi.	BBMKC104	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.97	\N
cmkd6qsyr0024cyntc9v1uy42	SKINOVAGE PURIFYING CREAM RICH	BBS5C101	Skinovage	\N	t	2026-01-13 22:50:45.411	2026-01-21 10:16:09.521	38.78	Venda Público
cmkd6qsyk0021cyntxtd7m2hi	SKINOVAGE VITALIZING EYE CREAM 15 ML	BBS4C102	Skinovage	\N	t	2026-01-13 22:50:45.404	2026-01-21 10:16:09.521	29.87	Venda Público
6d5d080f-1276-41c3-96c9-c48d93ee405d	Collagen Deluxe FDT 02 ivory	BBMKC108	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	58.45	\N
03dc99ef-9b98-4020-9c95-a921069b4c90	Collagen Deluxe FDT 03 natural	BBMKC109	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	58.45	\N
54826f13-b1df-468e-86ae-f0199f2c5cc3	Collagen Deluxe FDT 04 almond	BBMKC110	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	58.45	\N
3e4c9205-3f94-42b2-9e44-ae7009031827	Collagen Deluxe FDT 05 sunny	BBMKC111	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	58.45	\N
cmkd6qsym0022cyntoahxxlyu	SKINOVAGE VITALIZING SERUM	BBS4C103	Skinovage	\N	t	2026-01-13 22:50:45.406	2026-01-21 10:16:09.521	43.09	Venda Público
cmkd6qsyo0023cynt9i41dc3y	SKINOVAGE VITALIZING MASK	BBS4C104	Skinovage	\N	t	2026-01-13 22:50:45.408	2026-01-21 10:16:09.521	22.74	Venda Público
cmkd6qsyt0025cynt945bi3jb	SKINOVAGE PURIFYING MASK	BBS5C102	Skinovage	\N	t	2026-01-13 22:50:45.413	2026-01-21 10:16:09.521	22.74	Venda Público
cmkd6qsz5002ccynt7zlx5xdz	CLASSICS COMPLEX C CREAM	BBS6C100	Classics	\N	t	2026-01-13 22:50:45.425	2026-01-21 10:16:09.521	43.09	Venda Público
cmkd6qsz7002dcynt2zvt647l	CLASSICS MIMICAL CONTROL	BBS6C101	Classics	\N	t	2026-01-13 22:50:45.427	2026-01-21 10:16:09.521	43.83	Venda Público
14ac8917-4701-48dc-8650-33cf87f4410b	CP SE LIP& EYE CARE CREAM 15ML	BBS6I005	Expert Specialists	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.37	Profissional
d9236b07-ec97-49f1-8218-f3b671eb32be	CP CLASSICS COMFORT CREAM MASK 200 ML	BBS6I103	Classics	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	20.58	Profissional
c17ff6c1-ef40-4f55-989d-28c9e505dd60	CP SKINOVAGE VITALIZING CREAM	BBS4I100	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	18.42	Profissional
aa69c755-57ec-4b22-9755-a23a90b1da19	CP SKINOVAGE VITALIZING CREAM RICH	BBS4I101	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	75.18	Profissional
1b471cce-a51b-4ae7-8559-dd3992b07685	CP SKINOVAGE VITALIZING EYE CREAM	BBS4I102	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	28.39	Profissional
99f98b46-727e-45b9-ba46-87c83d9dd130	CP SKINOVAGE VITALIZING MASK	BBS4I104	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	41.44	Profissional
7f99afc9-73c3-460b-bae7-6f707dbac46b	CP SKINOVAGE PURIFYING MASK	BBS5I102	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	29.15	Profissional
09a0223c-be40-4370-a15f-cc212ed9208d	CP CLASSICS COMPLEX C CREAM	BBS6I100	Classics	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	74.90	Profissional
cmkd6qsz9002ecyntf0m6uhs5	CLASSICS ARGAN CREAM	BBS6C102	Classics	\N	t	2026-01-13 22:50:45.429	2026-01-21 10:16:09.521	43.09	Venda Público
cmkd6qszb002fcyntl530v6v7	THERMAL SPRAY	BBS6C104	Classics	\N	t	2026-01-13 22:50:45.431	2026-01-21 10:16:09.521	7.26	Venda Público
cmkd6qszd002gcyntdol7z7k9	REJUVENATING FACE OIL	BBS6C105	Classics	\N	t	2026-01-13 22:50:45.433	2026-01-21 10:16:09.521	30.53	Venda Público
cmkd6qsyw0027cynt8ijig2w5	SKINOVAGE MOISTURIZING CREAM	BBS8C100	Skinovage	\N	t	2026-01-13 22:50:45.416	2026-01-21 10:16:09.521	43.09	Venda Público
cmkd6qsyy0028cynt8ter1nil	SKINOVAGE MOIST+ LIPID CREAM 50 ML	BBS8C101	Skinovage	\N	t	2026-01-13 22:50:45.418	2026-01-21 10:16:09.521	44.47	Venda Público
cmkd6qsz00029cyntqqs8tyl1	SKINOVAGE MOISTURIZING SERUM	BBS8C102	Skinovage	\N	t	2026-01-13 22:50:45.42	2026-01-21 10:16:09.521	43.09	Venda Público
cmkd6qsz2002acyntl8uavslv	SK. MOIST. EYE GEL-CREAM	BBS8C103	Skinovage	\N	t	2026-01-13 22:50:45.422	2026-01-21 10:16:09.521	29.87	Venda Público
cmkd6qsz3002bcyntkipvb322	SKINOVAGE MOIST FOAM MASK	BBS8C104	Skinovage	\N	t	2026-01-13 22:50:45.423	2026-01-21 10:16:09.521	24.14	Venda Público
00c0a0e0-32e1-47e6-ace5-7d29e5e8e39b	DOC PRO HYDRATION RECOV.OINTMENT 50 ML	BBE1C9015	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	29.84	Venda Público
fd8bcdae-c4af-43f7-b8d6-8a634de465b1	CP BODY AGATHIST SOUL & ROOM ELIXIR	BBE6I201	Body Cabin	\N	t	2026-01-30 08:07:02.923	2026-01-30 08:07:02.923	20.02	\N
781b6a3e-d2c5-4b5a-8523-5b2979e34963	DOC PRO RICH MENO CREAM MASK 50 ML	BBE1C9020	Dr. Babor Pro	\N	t	2026-01-29 19:07:29.018	2026-01-29 19:07:29.018	46.44	Venda Público
cmkd6qt41004icyntakvtiury	PRO C VITAMIN C CONCENTRATE	BBE1C900	Pro Concentrates	\N	t	2026-01-13 22:50:45.601	2026-01-21 10:16:09.521	74.68	Venda Público
a54bba36-8127-4e59-8687-e652d67513ea	PRO PM PHYTO MOSS CREAM 50 ML	BBE1C912	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	25.42	Venda Público
484e5e5e-eccf-4380-b28c-b262fffdec0a	PRO EGF CREAM MASK 75 ML	BBE1C915	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	22.24	Venda Público
e14a5e98-4b6b-4fa9-83ce-8a501d080d88	PRO AHA CLEANSING LOTION	BBE1C923	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	13.76	Venda Público
d57fd7c1-a0fe-4581-8a98-5d69cd611e34	SMALL SIZE POWER SERUM AMPOULES-HA/C/P 6 ML	BBF1PT210	Ampoules	\N	t	2026-01-29 19:31:42.255	2026-01-29 19:31:42.255	7.57	Promo
cbb8287b-212e-4780-bb2c-121c7d55db85	TESTER NUTRI RESTORE	BBF1PT500	Ampoules	\N	t	2026-01-29 19:31:42.255	2026-01-29 19:31:42.255	16.94	Promo
6df023ea-ccbd-47bd-8575-c26ec8a7a51c	SAMPLE PERFECT GLOW 2 ML	BBF1PA316	Ampoules	\N	t	2026-01-29 19:31:42.255	2026-01-29 19:31:42.255	2.18	Promo
df42e4d9-2973-49cb-9bac-5de86e97d799	DOC CLEAN MOIST GLOW CR SMALL 15 ML	BBZPB005	Miniaturas	\N	t	2026-01-21 10:16:09.521	2026-01-29 19:32:43.618	7.80	Promo
9309049f-8d2d-4541-9743-05792cd5e883	Hydra Liquid FDT 01 alabaster	BBMKC121	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	51.77	\N
e96625cf-1a7a-42d4-bd30-0a1701addf2b	Hydra Liquid FDT 02 banana	BBMKC122	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	51.77	\N
cd93efa7-13fd-4f3c-8623-9495c1047e40	Hydra Liquid FDT 03 peach vanilla	BBMKC123	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	51.77	\N
7bef4a36-f567-405f-8e73-a10372884fc4	Hydra Liquid FDT 10 clay	BBMKC130	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	51.77	\N
2f2a58aa-9538-4873-9080-fe2e0545467a	Hydra Liquid Foundation 11 tan	BBMKC131	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	51.77	\N
6224324c-c9f3-4411-b674-062b81e077f7	Hydra Liquid FDT 12 cinnamon	BBMKC132	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	51.77	\N
44820b20-cf44-4adf-a6b8-6ba227711e13	Hydra Liquid FDT 13 sand	BBMKC133	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	51.77	\N
c645ea17-8e5e-405c-8a06-203b3da0d560	Hydra Liquid FDT 14 honey	BBMKC134	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	51.77	\N
9dc4fd16-1a3b-4a1f-9049-3a54f2e7f000	Hydra Liquid FDT 15 terra	BBMKC135	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	51.77	\N
42ed354e-738f-492f-834a-ca24ff3e8ba6	Shaping Powder Duo	BBMKC155	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	38.46	\N
0c717c10-2bd5-4aa9-8eb9-b870a76552d1	DOC CLEAN HEMP FIBER SHEETMASK (1 ST)	BBE1C1101	Dr. Babor	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	5.81	Venda Público
39837d57-8dcf-48e4-9d48-76d031d8cb0d	PRO BHA CLEANSING GEL 100 ML	BBE1C924	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	13.76	Venda Público
cmkd6qt310043cyntg2ccai9d	MATTE FINISH FDT 01 PORCELAIN 30ML	BBMKC117	Maquilhagem	\N	t	2026-01-13 22:50:45.565	2026-01-21 10:16:09.521	24.95	Venda Público
978d3a42-b079-4163-9da7-f72fba51181f	MATTE FINISH FDT 02 IVORY 30ML	BBMKC118	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	24.95	Venda Público
08e5adda-707e-4fab-8709-0b9fb52d80b7	MATTE FINISH FDT 03 NATURAL 30ML	BBMKC119	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	24.95	Venda Público
25a06671-5d06-472d-989e-7621fbc58c56	MATTE FINISH FDT 04 ALMOND 30ML	BBMKC120	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	24.95	Venda Público
cmkd6qt330044cyntmb8b7lv4	HYDRA LIQUID FDT 04 PORCELAIN 30ML	BBMKC124	Maquilhagem	\N	t	2026-01-13 22:50:45.567	2026-01-21 10:16:09.521	26.68	Venda Público
26d68eb1-042a-4d3f-a746-6cfcdb0d4e96	HYDRA LIQUID FDT 05 IVORY 30ML	BBMKC125	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	26.68	Venda Público
682ef364-798e-4f78-a85d-4c953ee9b296	HYDRA LIQUID FDT 06 NATURAL 30ML	BBMKC126	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	26.68	Venda Público
8ae7e58b-d661-4eb4-aaa8-28131479ba42	HYDRA LIQUID FDT 07 ALMOND 30ML	BBMKC127	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	26.68	Venda Público
13e3d346-3b75-463f-97a8-642b7f408166	HYDRA LIQUID FDT 08 SUNNY 30ML	BBMKC128	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	26.68	Venda Público
d826bd58-253e-4acc-b4ab-7a322d138d5d	HYDRA LIQUID FDT 09 CAFFE LATTE 30ML	BBMKC129	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	26.68	Venda Público
cmkd6qt360045cyntvpvm9hi4	3D FIRMING CONCEALER 01 PORCELAIN 4GR	BBMKC136	Maquilhagem	\N	t	2026-01-13 22:50:45.57	2026-01-21 10:16:09.521	18.03	Venda Público
b28b6502-4c8e-4a6e-9931-de9b732decb0	3D FIRMING CONCEALER 02 IVORY 4GR	BBMKC137	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	18.03	Venda Público
36cc1888-388d-48d5-9f74-f9f44447a5cd	FLAWLESS FINISH FDT 01 NATURAL 6GR	BBMKC140	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	23.38	Venda Público
2c8741b6-7f6a-4f32-8751-35d687c83ec2	FLAWLESS FINISH FDT 02 PORCELAIN 6GR	BBMKC141	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	23.38	Venda Público
ba262c1b-3d63-4763-bbca-3ab208624663	FLAWLESS FINISH FDT 03 ALMOND 6GR	BBMKC142	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	23.38	Venda Público
3fbaa4c7-84fb-47c7-a8df-86ea9dac1da7	FLAWLESS FINISH FDT 04 SUNNY 6GR	BBMKC143	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	23.38	Venda Público
cmkd6qt390046cynt0p49s3zd	MINERAL POWDER FDT 01 LIGHT 20GR	BBMKC144	Maquilhagem	\N	t	2026-01-13 22:50:45.573	2026-01-21 10:16:09.521	20.44	Venda Público
c5d77245-f886-4dc4-95be-8ef6e4f3ec31	MINERAL POWDER FDT 02 MEDIUM 20GR	BBMKC145	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	20.44	Venda Público
5da3b511-d553-41bf-b388-8ffa27f6d25c	TINTED HYDRA MOISTURIZER 01 IVORY 30ML	BBMKC146	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	24.28	Venda Público
7b8dcd13-3054-40bf-bbb5-b2751afe0658	TINTED HYDRA MOISTURIZER 02 NATURAL 30ML	BBMKC147	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	24.28	Venda Público
fd030994-a27b-4388-94ca-502d59d70cf9	TINTED HYDRA MOISTURIZER 03 ALMOND 30ML	BBMKC148	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	24.28	Venda Público
cmkd6qt3b0047cyntahbeyhy9	MATTIFYING FIXING POWDER 20GR	BBMKC149	Maquilhagem	\N	t	2026-01-13 22:50:45.575	2026-01-21 10:16:09.521	13.55	Venda Público
cmkd6qt3d0048cyntovqqf22e	BEAUTIFYING POWDER 3,5GR	BBMKC150	Maquilhagem	\N	t	2026-01-13 22:50:45.577	2026-01-21 10:16:09.521	21.03	Venda Público
cmkd6qt3g0049cyntxf6vnmeu	SATIN BLUSH 01 PEACH 5,8GR	BBMKC151	Maquilhagem	\N	t	2026-01-13 22:50:45.58	2026-01-21 10:16:09.521	21.03	Venda Público
f1da82f1-d6ae-42a2-b1f5-fbf5c3b83ba1	SATIN BLUSH 02 ROSE 5,8GR	BBMKC152	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	21.03	Venda Público
7975cb25-16d3-4a1c-9782-85844816c4b3	TESTER SPA SHAPING DAILY HAND CREAM 100 ML	BBE5PT114	Babor SPA	\N	t	2026-01-29 19:31:52.01	2026-01-29 19:31:52.01	5.41	Promo
8705e584-6bde-4601-97c2-52d680f25a5c	TESTER SPA SHAPING DRY GLOW OIL 100 ML	BBE5PT115	Babor SPA	\N	t	2026-01-29 19:31:52.01	2026-01-29 19:31:52.01	9.73	Promo
35ade219-47b2-4cac-bf22-2f1a1dfa05bb	TESTER BODY GROUND SOUL&BODY LOTION	BBE6PT100	Body Grounding Soul	\N	t	2026-01-29 19:31:52.01	2026-01-29 19:31:52.01	16.00	Promo
ae483a9c-2d42-43b9-ac6f-625b9b75af26	TESTER BODY AGATHIST SOUL & BODY LOTION 250 ML	BBE6PT203	Body Grounding Soul	\N	t	2026-01-29 19:31:52.01	2026-01-29 19:31:52.01	16.00	Promo
abaa7344-049e-4cf6-b354-b290af8f5290	TESTER BODY AGATHIST SOUL & ROOM FRAGRANCE 220 ML	BBE6PT205	Body Grounding Soul	\N	t	2026-01-29 19:31:52.01	2026-01-29 19:31:52.01	19.20	Promo
07b3ac75-0a40-4120-80e4-3e481ec0fc9a	SAMPLE SKINOVAGE CALMING CREAM 2 ML	BBS2PA100	Skinovage	\N	t	2026-01-29 19:31:52.01	2026-01-29 19:31:52.01	0.70	Promo
ba4b35b1-7101-44d4-951f-f3fd780d7c80	SAMPLE SKINOVAGE BALANCING CREAM 2 ML	BBS3PA100	Skinovage	\N	t	2026-01-29 19:31:52.01	2026-01-29 19:31:52.01	0.70	Promo
d0e69afe-9c22-4c3c-847c-f7f42fd76720	CP BODY AGATHIST SOUL & BODY CREAM 500 ML	BBE6I206	Body Cabin	\N	t	2026-01-30 08:07:02.923	2026-01-30 08:07:02.923	62.24	\N
92961c5f-e8c4-4946-91a1-ea84181f718c	CP EXP SP AHA DRY PEELING 500 ML	BBE6I300	Body Cabin	\N	t	2026-01-30 08:07:02.923	2026-01-30 08:07:02.923	35.88	\N
75865c3b-a46d-44fc-8627-cee25f04c288	PHYTOACTIVE COMBINATION 100ML	BBA1C104	Oportunidades	\N	t	2026-01-30 08:07:02.925	2026-01-30 08:07:02.925	7.04	\N
b3b56304-b7e7-4c44-a432-862f66971344	DEEP PORE CLEAN MAS 2 IN 1 50ML	BBA1C130	Oportunidades	\N	t	2026-01-30 08:07:02.925	2026-01-30 08:07:02.925	6.75	\N
02145048-f269-485a-afde-a1c83ff3788c	PROMO PHYTOACTIVE SENSITIVE + BOTTLE 100ML	BBA1C133	Oportunidades	\N	t	2026-01-30 08:07:02.925	2026-01-30 08:07:02.925	11.45	\N
cmkd6qszt002ncyntk30nt76i	SEACREATION THE CREAM 50 ML	BBC9C020	Sea Creation	\N	t	2026-01-13 22:50:45.449	2026-01-21 10:16:09.521	261.63	Venda Público
58686465-0f3f-4482-a84c-661370f2895b	HSR LIFTING GIFT SET 2025 (2 PCS)	BBZ1178	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	69.69	Venda Público
cmkd6qt26003rcynt4w4n46b8	LINE CORRECTING PENCIL 1GR	BBMKC300	Maquilhagem	\N	t	2026-01-13 22:50:45.534	2026-01-21 10:16:09.521	10.08	Venda Público
cmkd6qt29003scyntebn528vb	EYE SHADOW PENCIL 01 SHINY ROSE 2GR	BBMKC301	Maquilhagem	\N	t	2026-01-13 22:50:45.537	2026-01-21 10:16:09.521	12.68	Venda Público
c55b0871-b36a-46f9-ac81-17358bed2c30	EYE SHADOW PENCIL 02 COPPER BROWN 2GR	BBMKC302	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.68	Venda Público
e3a9085a-09e8-442c-980e-10e758f16a53	EYE SHADOW PENCIL 03 GREEN 2GR	BBMKC303	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.68	Venda Público
05a787da-953b-4764-bc37-e854a7728bcd	EYE SHADOW PENCIL 04 BLUE 2GR	BBMKC304	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.68	Venda Público
78adf0fb-7721-4084-bf9a-71f25cd6c715	EYE SHADOW PENCIL 05 DARK BROWN 2GR	BBMKC305	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.68	Venda Público
f6929d79-a483-4a6e-804f-5f85feeb3d7a	EYE SHADOW PENCIL 06 ANTHRACITE 2GR	BBMKC306	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.68	Venda Público
1c0bb172-81a2-4bcd-a04a-74366b340ece	EYE SHADOW PENCIL 07 BLACK 2GR	BBMKC307	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.68	Venda Público
fffbf40c-21a3-4b8c-9d39-b6ef1607c6ae	EYE SHADOW PENCIL 08 HIGHLIGHTS 2GR	BBMKC308	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.68	Venda Público
31d98512-f964-41d8-aff0-ed6bd27781c2	EYE SHADOW PENCIL 09 SUMMER GOLD 2GR	BBMKC309	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.68	Venda Público
9119e98a-5a52-453b-98fb-30edff26b9a2	EYE SHADOW PENCIL 10 SUNLIGHT 2GR	BBMKC310	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.68	Venda Público
dad954b6-a5bd-4998-bfb0-1c6d05150096	CP Creamy Compact FDT SPF 50 01 light	BBMKI103	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	19.01	\N
46439dea-b1ea-4c63-aaf5-57e21f3a7f1f	CP Creamy Compact FDT SPF 50 02 medium	BBMKI104	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	19.01	\N
7f6596cb-6d80-4b01-b8c3-3d4ff790be89	CP Collag. Deluxe FDT 02 ivory	BBMKI108	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	42.37	\N
cd653a6c-dbbe-41dc-9809-4ed41cc9c0d2	CP Colla Deluxe FDT 03 natural	BBMKI109	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	42.37	\N
d6d6c261-a9ce-4db7-9dcc-6679f8600762	CP Colla. Deluxe FDT 04 almond	BBMKI110	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	42.37	\N
cmkd6qt2c003tcynt2v4xqkuk	EYE CONTOUR PENCIL 01 BLACK 1GR	BBMKC311	Maquilhagem	\N	t	2026-01-13 22:50:45.54	2026-01-21 10:16:09.521	10.08	Venda Público
07996adc-d716-4c61-90ba-d3a1c708e5f6	EYE CONTOUR PENCIL 02 TAUPE 1GR	BBMKC312	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	10.08	Venda Público
cmkd6qt2f003ucynt64fdexfz	LIQUID EYELINER DEEP BLACK 1ML	BBMKC315	Maquilhagem	\N	t	2026-01-13 22:50:45.543	2026-01-21 10:16:09.521	18.00	Venda Público
e644b0b1-a3bc-4256-8118-ebf55fe93e28	SUPER STYLE & DEFINITION MASCARA BLACK 10ML	BBMKC324	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	19.82	Venda Público
cmkd6qt2w0041cynt2ov5hqbx	COLLAGEN DELUXE FDT 01 PORCELAIN 30ML	BBMKC107	Maquilhagem	\N	t	2026-01-13 22:50:45.56	2026-01-21 10:16:09.521	30.13	Venda Público
b10ceff3-fcae-4698-9d64-12ca022dd978	CLE ANNIVERSARY SET HY-OL & PHYTO HYDRA (2 PCS)	BBA1C343	Promoção Mensal	\N	t	2026-01-29 19:11:24.937	2026-01-29 19:11:24.937	31.16	Venda Público
92816f5b-8691-43ec-af13-d1f869154db9	MIN DOC DERMA FILLER SERUM 10 ML	BBE1PB8200A	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	10.41	Promo
ba23d161-3a7e-465a-b651-0467602c5174	MIN.HY-OL & PHYTO REACTIVATING (2 ST)	BBA1PB145	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	5.28	Promo
8a131cff-eec7-49c6-885a-8cc7f8062410	SMALL SIZE ENZYME CLEANSER 20 GR	BBA1PB207	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	5.41	Promo
9c46a70e-920c-4875-9cca-8d71d224d88c	HY-OL & PHYTOACTIVE BASE 50ML&30ML	BBA1PB226	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	4.76	Promo
0d0ba8ab-69b1-4dd9-a1f5-b7f9b03a980c	HY-OL & PHYTO BOOSTER HYDRA SMALL (2 PCS)	BBA1PB301	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	7.20	Promo
a7f2c2c3-7eb3-4968-8bdf-6a2bd2a43f08	ENZYME & VITAMIN C CLEANSER (SMALL) 15 GR	BBA1PB311	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	9.31	Promo
03de5528-71e6-43e1-bc57-df4c33fb4c67	HYALURONIC CLEANSING BALM 24 PCS (SMALL) 15 ML	BBA1PB313	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	5.88	Promo
1b081f09-1117-4701-b8e2-20177a44516e	CP CREAMY COMPACT FOUNDATION SPF 50 03 SUNNY 10GR	BBMKI105	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	10.30	Profissional
b1f4dc63-b6c3-4eee-a99b-38a5f3dd52b8	CP COLLAGEN DELUXE FDT 01 PORCELAIN 30ML	BBMKI107	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	21.84	Profissional
c6ccd94c-ad3f-4057-b8a5-8cfbf003e201	HYALURONIC CLEANSING BALM SMALL SIZE 15 ML	BBA1PB313A	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	4.80	Promo
400e289e-17ad-4e31-a73f-15d2b3daae8c	HSR LIFTING ANTI-WRINKLE CREAM 15 ML	BBB8PB075	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	17.66	Promo
0c31e38c-3231-493f-bb94-ce9ec3153306	MIN.BM VITALIZING HAIR & SHAMPOO 50 ML	BBC3PB001	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	5.00	Promo
ec9f1679-b8f7-4a26-9bf4-afcee7149db2	GENTLE CLEANSING MILK 200 ML	BBA1C205	Oportunidades	\N	t	2026-01-30 08:07:02.925	2026-01-30 08:07:02.925	9.50	\N
1401ac2b-089c-4ea5-a9c5-a060b1bff4c4	DOC CLEAN STRESS DEF MUSHROOM CREAM (SMALL) 15 ML	BBE1PB1015	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	7.80	Promo
56bdfbf4-2bb1-4d75-a7fc-3994d00d099e	DOC CLEAN MOIST GLOW DAY CREAM 15ML	BBE1PB1100	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	5.08	Promo
f414a332-41bc-46e0-ae67-c284a24443c3	MIN DB ULT PROTECTING BALM SPF50 15 ML SMALL	BBE1PB206	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	6.34	Promo
be6e32aa-2df5-4ae3-a2b7-9bdff797d896	MOISTURE GLOW CREAM SMALL 15 ML	BBE1PB8604	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	7.80	Promo
fb814fdc-e33b-4c44-8922-7a7d0f86222c	DOC MB STRESS MUSH CREAM SMALL 15 ML	BBE1PB8605	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	7.80	Promo
dad8200e-2520-4ca5-a74e-7b3ad5093ea9	DOC COLLAGEN BOOSTER CREAM 15 ML	BBE1PB700	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	7.57	Promo
0ef5d453-5544-4052-a4d1-49605abda127	DOC COLLAGEN BOOSTER CREAM 15 ML	BBE1PB700A	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	17.56	Promo
2b6a0c6c-b6d8-47b6-9fc2-2eb6d539d616	DOC HYDRO CELLULAR HYALURON CREAM 15 ML	BBE1PB801	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	5.00	Promo
52935aa5-fd32-4c99-98c9-da2f9938902e	MEN ENERGIZING FACE & EYE GEL 15ML	BBC3PB100	Miniaturas	\N	t	2026-01-29 19:32:12.149	2026-01-29 19:32:12.149	3.75	Promo
211d6707-37e2-417c-b36d-767ee9d2de00	CP GENTLE CLEANSING MILK 500 ML	BBA1I205	Oportunidades	\N	t	2026-01-30 08:07:02.925	2026-01-30 08:07:02.925	16.29	\N
78339d42-070d-4df0-aa29-e33b7de3591f	CP 3D Firm Serum FDT 04 almond	BBMKI115	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	57.14	\N
64b02d7c-2fdd-421e-b2fa-fb4aa199dee6	CP Matte Finish 01 porcelain	BBMKI117	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	33.73	\N
29434edc-113b-40bf-af2d-a5ca38f5e379	CP Hydra FDT 01 alabaster	BBMKI121	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	33.73	\N
40691801-0110-412d-abe2-a3f5a1241f61	CP Hydra Foundation 02 banana	BBMKI122	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	33.73	\N
f088fc3a-55db-4e5b-a05d-dfff845fba92	CP Hydra FDT 03 peach vanilla	BBMKI123	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	33.73	\N
e1e058e1-1d78-4cff-aedd-1842242e590c	CP Hydra Foundation 10 clay	BBMKI130	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	33.73	\N
d5c6a9eb-ba68-474d-b940-fbdb36dfb63f	CP Hydra Foundation 11 tan	BBMKI131	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	33.73	\N
6d4fe781-4b34-41ae-9403-c025a6f956e6	CP Hydra FDT 12 cinnamon	BBMKI132	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	33.73	\N
bb66750b-7d33-4139-839b-9e74ce441f3f	CP Hydra Foundation 13 sand	BBMKI133	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	33.73	\N
263a5e12-835e-458f-b1cd-a35c6c10f100	CP Hydra Foundation 14 honey	BBMKI134	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	33.73	\N
10af0e0a-e968-4025-a5d9-7257090a1022	CP Hydra Foundation 15 terra	BBMKI135	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	33.73	\N
437fa96a-03e1-49c9-9b11-34df0ffd6e00	CP 3D Firm Conceal. 03 natural	BBMKI138	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	16.02	\N
dd06c118-3197-410f-bda1-8f6d0921c5e8	CP 3D Firming Concealer 04 tan	BBMKI139	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	16.02	\N
74d9c3c4-1f6b-4e18-8fec-51f36b68c250	CP Tinted Hydra Moist03 almond	BBMKI148	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	22.87	\N
0fe28f3a-98c5-4f15-8e57-7786602162a6	CP Satin Duo Bronzer	BBMKI153	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	22.87	\N
454e353d-9c9f-44be-a428-3c04c27d40ef	CP Creamy Lipstick 02 hot blooded	BBMKI201	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.82	\N
fb168d5c-89d2-413c-b69f-1963eb8bc7dd	MIN DB LIF DERM FILLER SERUM 10 ML	BBE1PB8200	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	10.40	Promo
dadf1a21-1de7-417b-a000-40888057e953	MIN DB AMP 10D HA INST SOOTHING 6 ML	BBE1PB8301	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	8.90	Promo
ac2953ee-49fd-44a3-8e15-041b00120f31	MIN DB HYDRATION REP CREAM 15 ML	BBE1PB8303	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	9.40	Promo
69f06a7a-de64-4723-962d-180221f96f66	CP COLLAGEN DELUXE FDT 05 SUNNY 30ML	BBMKI111	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	21.84	Profissional
9b0b593a-f642-4547-984c-51d852de3221	CP 3D FIRMING SERUM FDT 01 PORCELAIN 30ML	BBMKI112	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	29.46	Profissional
9c91b796-24f9-48af-8004-10dc3b76a69a	CP 3D FIRMING. SERUM FDT 02 IVORY 30ML	BBMKI113	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	29.46	Profissional
95dc429e-7132-4137-8670-e990ffa78830	CP 3D FIRMING SERUM FDT 03 NATURAL 30ML	BBMKI114	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	29.46	Profissional
144883de-623a-423e-ada7-60d5fadab08c	CP 3D FIRMING SERUM FDT 05 SUNNY 30ML	BBMKI116	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	29.46	Profissional
9532acbe-d465-4a6c-bba5-4f805d1b938d	CP MATTE FINISH FDT 02 IVORY 30ML	BBMKI118	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.39	Profissional
6352c850-42c5-4605-8751-10dd1794802b	CP MATTE FINISH 03 FDT NATURAL 30ML	BBMKI119	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.39	Profissional
b5c6e7f6-67c5-4d7d-bdfb-35285a4b1569	CP FLAWLESS FINISH FDT 01 NATURAL 6GR	BBMKI140	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.20	Profissional
5cd30c29-8152-4d4b-b6dc-bd494f92b603	CP FLAWESS FINISH FDT02 PORCELAIN 6GR	BBMKI141	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.20	Profissional
265369d7-9928-4404-949b-068c26332232	CP FLAWLESS FINISH FDT 03 ALMOND 6GR	BBMKI142	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.20	Profissional
1d8ea56b-cbb2-4da8-bab1-3fb357616afb	CP FLAWLESS FINISH FDT 04 SUNNY 6GR	BBMKI143	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.20	Profissional
232581e0-baca-4855-8ed2-35441db2125d	CP MINERAL POWDER FDT 01 LIGHT 20GR	BBMKI144	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	20.64	Profissional
857b2a12-f4f5-48c1-93c8-154778b6c6e5	CP MINERAL POWDER FDT 02 MEDIUM 20GR	BBMKI145	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	20.64	Profissional
65783327-45af-4e07-81f4-6cde8f06c4d4	CP TINTED HYDRA MOISTURIZER 01 IVORY 30ML	BBMKI146	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.79	Profissional
adf1ee99-dbd0-407a-8f5d-741a98d194e4	CP TINTED HYDRA MOISTURIZER 02 NATURAL 30ML	BBMKI147	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.79	Profissional
fd057100-aca3-4c0e-9b10-ba7cdef4596f	CP MATTIFYING FIXING POWDER 20GR	BBMKI149	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.79	Profissional
e812f1f6-71b5-4e81-b493-9b45c3fcfd76	CP BEAUTIFYING POWDER 20GR	BBMKI150	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	20.05	Profissional
169c233f-8d59-4fbd-b0c9-5ac31728f3cf	CP SATIN BLUSH 01 PEACH 5,8GR	BBMKI151	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.79	Profissional
013e0c49-d5f2-403f-8cce-35519c39594f	CP SATIN BLUSH 02 ROSE 5,8GR	BBMKI152	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.79	Profissional
173cd79a-58fb-4876-9b77-3442c145935d	CP SATIN DUO HIGHLIGHTER 6GR	BBMKI154	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.79	Profissional
a8579976-65e2-4cb7-871a-9d8acec25b76	CP SHAPING POWDER DUO 7GR	BBMKI155	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	10.30	Profissional
e58d6406-4da7-4655-8eb9-13fb5ed8bd31	DOC HYDRO REPLENISHING GEL CR SMALL 15 ML	BBE1PB8303A	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	9.40	Promo
12def3a6-b497-47cb-b19d-c69d280af409	MIN DB RES RENEWAL CREAM 15 ML	BBE1PB8404	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	10.90	Promo
9022326d-fc64-4afd-ade4-a75a46d1f7bc	DOC PRO HA CONCENTRATE (SMALL) 10 ML	BBE1PB9002	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	10.70	Promo
398f8a57-7bd8-495c-9fbf-2ad3363cfe8a	DOC PSAMP HYALU.ACIS SMALL SIZE 6 ML	BBE1PB902	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	5.55	Promo
9fb98b3c-9528-4545-bf09-8a87904c8303	SMALL SIZE PRO AHA CLEANSING LOTION 20 ML	BBE1PB923	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	4.76	Promo
bddf5d09-5039-4131-a796-bf7a4ee1fbcf	MIN. SPA ENERGIZING BODY SORBET 50 ML	BBE5PB002	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	2.91	Promo
b0427456-b3e6-4eb1-b289-fb12fbe4abee	BODY HAND CREAM 20 ML (SMALL SIZE)	BBE6PB103	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	4.80	Promo
e160019c-bc63-4c8f-bc7e-8eb4bca02116	MIN DB LIF COLL-PEP.BOOSTER CREAM 15 ML	BBE1PB8202A	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	10.40	Promo
1974f316-7d5e-48e4-afc5-a2a5f55732e8	AMPOULE CONCENTRATE 3ER SET 6 ML	BBF1PB100A	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	8.20	Promo
469d0452-be9a-4805-a43c-f8eaf61c4707	AMP CONCENTRATE 3 PCS SET (SMALL SIZE)	BBF1PB100B	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	8.20	Promo
6f1be04d-92ab-432f-b5bc-271ede7a5de0	REVERSIVE PRO YOUTH CREAM 15ML	BBG1PB010	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	5.00	Promo
f4f49799-7f37-40c2-a520-62ba702dd289	MIN. SKINOVAGE MOISTURIZING CREAM 15 ML	BBS1PB012	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	5.00	Promo
7529df93-a910-4cd7-b97f-415838d179a7	CP Super Soft Lip Oil 01 pearl pink	BBMKI220	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.22	\N
4aed3564-92b4-4258-a478-e7c3b234e9bf	CP Super Soft Lip Oil 02 juicy red	BBMKI221	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.22	\N
dbffc61d-3f9b-46d1-9ee3-e12350eb6d81	DOC PC PROTECTING BALM SPF50 50 ML	BBE1C220	Dr. Babor	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	24.49	Venda Público
f8be3a13-1cb0-48e8-b381-dc36a6667edc	CP Ultra Shine Lip Gloss 02 berry nude	BBMKI223	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	15.48	\N
a17226fa-b9d8-4617-913b-c87af648b64a	DOC PC MATTIFY PROTECTOR SPF30 50 ML	BBE1C221	Dr. Babor	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	21.25	Venda Público
cc211b47-5773-43db-9550-7cfcba48b10f	TESTER CLE CLARIFYING PEELING 50 ML	BBA1PT318	Cleansing System	\N	t	2026-01-29 19:31:28.125	2026-01-29 19:31:28.125	7.70	Promo
dde4225a-d8dd-4f09-a51f-2468e47b60a9	DISPLAY AMPOULE PROMO 2025	BBF1PE600	Ampoules	\N	t	2026-01-29 19:31:42.255	2026-01-29 19:31:42.255	39.00	Promo
5a7d40bf-4e12-44e4-95df-1354e727854f	CP Ultra Shine Lip Gloss 06 nude rose	BBMKI227	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	15.48	\N
e41aa408-d175-45f5-8bb4-a0be7ba4f310	MIN DB REG THE CURE CREAM 15 ML	BBE1PB8104B	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	10.90	Promo
eb0e91b8-9b07-408c-810a-89b4fc1bee1c	MIN DB LIF COLL-PEP.BOOSTER CREAM 15 ML	BBE1PB8202	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	10.40	Promo
1004a2da-1044-4139-92fb-e9cfeeb585f2	MIN 3 PC AMP BEAUTY EFFECT SET INT 6 ML	BBF1PB050	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	5.41	Promo
b3c61595-bf0f-4a94-9e27-cc9e32db6498	1ER TM AMPOULE PHYTO AHA 2 ML	BBF1PB051	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	1.87	Promo
910e0b54-49c5-47a3-86dc-b0a3164ced72	AMPOULE CONCENTRATE 3ER SET 24ER 6 ML	BBF1PB100	Miniaturas	\N	t	2026-01-29 19:32:31.532	2026-01-29 19:32:31.532	10.05	Promo
a4c57d2f-62ac-4b21-b7f7-3a1d249c80ee	CP Eye Brow Mascara 02 medium	BBMKI319	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	14.45	\N
1badd142-da06-4e73-b67f-1680d8ad4931	EC LIPID BALANCING CREAM 50ML	BBS8C001	Oportunidades	\N	t	2026-01-30 08:07:02.929	2026-01-30 08:07:02.929	12.50	\N
3ef9b2a6-e785-4fff-b74a-a8c9e9516a6b	CP Absolute Volume&Length Mascara black	BBMKI321	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	32.92	\N
fd11bb45-1bb7-461e-a0b6-4ae1621387e2	CP Ultimate Style&Volume Mascara black	BBMKI322	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	25.96	\N
60829e79-8daf-4614-af7e-0800907c52f6	EC MOINTURIZING CREAM 50ML	BB8S8C002	Oportunidades	\N	t	2026-01-30 08:07:02.929	2026-01-30 08:07:02.929	12.00	\N
99115d7c-8570-4faa-925d-594dbc50b308	LIPID BALANCING CREAM 50ML	BB8S8C010	Oportunidades	\N	t	2026-01-30 08:07:02.929	2026-01-30 08:07:02.929	21.10	\N
1beaa647-59b8-4175-ac42-83a9132f5d5d	CP Perf Sepa&Length Masc black	BBMKI325	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	20.21	\N
ca3f4eca-25e9-4766-a322-e8952eff5c39	SENSITIVE CREAM 50ML	BB8S8C011	Oportunidades	\N	t	2026-01-30 08:07:02.929	2026-01-30 08:07:02.929	21.45	\N
3e46cce4-52ce-411e-82df-b9901adecd22	PURE CREAM 50ML	BBS8C014	Oportunidades	\N	t	2026-01-30 08:07:02.929	2026-01-30 08:07:02.929	14.30	\N
14865da4-e52d-4714-9cad-9e6f1591ac68	BB CREAM 01	BBS8C018	Oportunidades	\N	t	2026-01-30 08:07:02.929	2026-01-30 08:07:02.929	10.50	\N
278e5da2-6c07-4da7-8156-00c87d951287	VB DAILY MOISTURIZING CREAM 50ML	BBS1C002	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	22.00	\N
dd3ea320-4a68-4545-a617-dd767c7dbeef	CP LINE CORRECTING PENCIL 1GR	BBMKI300	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	6.55	Profissional
5aa54ccf-8422-4dcb-b440-a1f05f12bda1	CP EYE SHADOW PENCIL 01 SHINY ROSE 2GR	BBMKI301	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.45	Profissional
1b5afc19-54b1-4a0e-b9a2-d08226dbd8f4	CP EYE SHADOW PENCIL 02 COPPER BROWN 2GR	BBMKI302	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.45	Profissional
997b6610-2d46-4a75-8521-90a9e55ec427	CP EYE SHADOW PENCIL 03 GREEN 2GR	BBMKI303	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.45	Profissional
c1e1f52f-1509-4f76-a16b-23f519128397	CP EYE SHADOW PENCIL 04 BLUE 2GR	BBMKI304	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.45	Profissional
ac6e0227-82b6-4927-8dea-b7b00de9631a	CP EYE SHADOW PENCIL 05 DARK BROWN 2GR	BBMKI305	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.45	Profissional
61d8ab6d-ae25-4639-a811-4920b930b687	CP EYE SHADOW PENCIL 06 ANTHRACITE 2GR	BBMKI306	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.45	Profissional
4563d8ad-f3c0-4e7e-885c-955e445a242b	CP EYE SHADOW PENCIL 07 BLACK 2GR	BBMKI307	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.45	Profissional
15366639-6eee-42d1-9132-a198d908fa0d	CP EYE SHADOW PENCIL 08 HIGHLIGHTS 2GR	BBMKI308	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.45	Profissional
faa3bca1-0639-4673-80a9-cd0b385b09e3	CP EYE SHADOW PENCIL 09 SUMMER GOLD 2GR	BBMKI309	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.45	Profissional
b6895a2b-3347-4a62-a67c-bada7c9918be	CP EYE SHADOW PENCIL 10 SUNLIGHT 2GR	BBMKI310	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.45	Profissional
c4864be6-05a5-48c4-8e8c-84d0c2e78563	CP EYE CONTOUR PENCIL 01 BLACK 1GR	BBMKI311	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.14	Profissional
dc2a7ae7-2ef7-45d1-9e3f-9fdaebfce8d1	CP EYE CONTOUR PENCIL 02 TAUPE 1GR	BBMKI312	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.14	Profissional
3778a83c-97c7-46c8-84a5-83f588925fc5	CP EYE CONTOUR PENCIL 03 PACIFIC GREEN 1GR	BBMKI313	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.14	Profissional
a9bbaef5-d189-40cd-a8a7-6bee086df846	MOISTURIZING CREAM 50ML	BBS1C012	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	20.95	\N
3d9869f0-c840-4db9-96f9-b9ebd87a3e82	CP VB OXYGEN ENERGIZING CREAM 200ML	BBS1I001	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	32.10	\N
1d33ae54-88f9-45b4-ac8e-449803225fbf	CS CALMING BI-PHASE MOISTURIZINER 30ML	BBS2C004	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	19.00	\N
cmkd6qt4d004mcynty9izb46z	PRO BA BOSWELLIA ACID CONCENTRATE	BBE1C907	Pro Concentrates	\N	t	2026-01-13 22:50:45.613	2026-01-21 10:16:09.521	25.42	Venda Público
cde953c5-7a5d-437a-b5ca-efb95f55475c	PRO NIC SKIN ACTIVATOR	BBE1C914	Pro Concentrates	\N	t	2026-01-29 19:07:44.612	2026-01-29 19:07:44.612	10.22	Venda Público
c2b723c3-32b1-4eca-b4a9-baec56949fb5	PRO POST AHA PEEL KIT TREATMENT (4 PCS)	BBE1C922	Pro Concentrates	\N	t	2026-01-29 19:07:44.612	2026-01-29 19:07:44.612	13.99	Venda Público
cmkd6qt4f004ncynt7yku3yb0	PRO RETINOL CONCENTRATE A 30 ML	BBE1C929	Pro Concentrates	\N	t	2026-01-13 22:50:45.615	2026-01-21 10:16:09.521	37.71	Venda Público
11d4ba4f-71d8-450a-9fc7-1a98da283c15	PRO CE CERAMIDE CREAM 50 ML	BBE1C910	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	67.81	Venda Público
31c19139-b686-48da-a200-9278c9d7943f	PRO LMS LIPID CREAM 50 ML	BBE1C911	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	33.91	Venda Público
61bebe64-bd2c-4f41-9d55-166ed0db0e81	PRO EGF EGF&COLLAGEN CREAM 50 ML	BBE1C913	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	41.16	Venda Público
bbbbba6d-f928-4219-b98a-4013b7c1bfd7	PRO RECOVER OINTMENT 50 ML	BBE1C1100	Dr. Babor Pro	\N	t	2026-01-29 19:07:44.612	2026-01-29 19:07:44.612	29.28	Venda Público
5b810b9a-044f-421a-b385-0af0d573fbb6	PRO AHA PEELING LIQUID OVERNIGHT 50 ML	BBE1C909	Dr. Babor Pro	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	25.42	Venda Público
cmkd6qt0x0036cyntq7zx8uox	SPA SHAPING SHOWER FOAM 200 ML	BBE5C110	Babor SPA	\N	t	2026-01-13 22:50:45.489	2026-01-21 10:16:09.521	17.49	Venda Público
cmkd6qt4a004lcyntyp4m442k	PRO BG BETA GLUCAN CONCENTRATE	BBE1C905	Pro Concentrates	\N	t	2026-01-13 22:50:45.61	2026-01-21 10:16:09.521	25.42	Venda Público
cmkd6qt0z0037cynthvb0ph26	SPA SHAPING PEELING CREAM 200 ML	BBE5C111	Babor SPA	\N	t	2026-01-13 22:50:45.491	2026-01-21 10:16:09.521	18.92	Venda Público
cmkd6qt110038cynt3n1qxyg6	SPA SHAPING BODY LOTION 200 ML	BBE5C112	Babor SPA	\N	t	2026-01-13 22:50:45.493	2026-01-21 10:16:09.521	18.92	Venda Público
cmkd6qt130039cyntjf4a9sqh	SPA SHAPING VITAMIN ACE BODY CREAM 200ML	BBE5C113	Babor SPA	\N	t	2026-01-13 22:50:45.495	2026-01-21 10:16:09.521	32.44	Venda Público
cmkd6qt15003acyntjmy1jqjd	SPA SHAPING DAILY HAND CREAM 100 ML	BBE5C114	Babor SPA	\N	t	2026-01-13 22:50:45.497	2026-01-21 10:16:09.521	12.40	Venda Público
cmkd6qt17003bcyntonwk2yww	SPA SHAPING DRY GLOW OIL 100 ML	BBE5C115	Babor SPA	\N	t	2026-01-13 22:50:45.499	2026-01-21 10:16:09.521	26.90	Venda Público
cmkd6qt1a003ccyntjiuieimj	SPA ENERGIZING BODY SCRUB 200 ML	BBE5C211	Babor SPA	\N	t	2026-01-13 22:50:45.502	2026-01-21 10:16:09.521	16.66	Venda Público
cmkd6qt1c003dcyntg43aojkb	SPA ENERGIZING BODY LOTION 200 ML	BBE5C212	Babor SPA	\N	t	2026-01-13 22:50:45.504	2026-01-21 10:16:09.521	17.49	Venda Público
cmkd6qt1f003ecyntr5gi9zqj	SPA ENERGIZING REP HAND & MANI CREAM 100 ML	BBE5C213	Babor SPA	\N	t	2026-01-13 22:50:45.507	2026-01-21 10:16:09.521	16.66	Venda Público
7f2aece3-8c28-41e8-8088-7c8d0dfaf629	RELAXING BI-PHASE BODY FOAM 200 ML	BBE5C303	Babor SPA	\N	t	2026-01-29 19:09:25.33	2026-01-29 19:09:25.33	30.42	Venda Público
a0f163fe-51d6-47dd-b425-719bde4f2bcc	BODY GROUNDING SOUL & BODY LOTION	BBE6C100	Babor SPA	\N	t	2026-01-29 19:09:25.33	2026-01-29 19:09:25.33	30.70	Venda Público
500f7b7f-b04e-47ab-85f9-2145a8555311	BODY GROUNDING SOUL & BODY WASH	BBE6C101	Babor SPA	\N	t	2026-01-29 19:09:25.33	2026-01-29 19:09:25.33	24.55	Venda Público
5694e0ea-1200-48e9-aba1-98350b5c493d	BODY GROUNDING SOUL & BODY SHIM OIL	BBE6C102	Babor SPA	\N	t	2026-01-29 19:09:25.33	2026-01-29 19:09:25.33	34.38	Venda Público
2babd3d7-287b-45c4-b815-99a86cee6288	BODY GROUNDING SOUL & HAND CREAM	BBE6C103	Babor SPA	\N	t	2026-01-29 19:09:25.33	2026-01-29 19:09:25.33	13.72	Venda Público
108803a8-0dd5-40b9-9ee0-c8d2b092ac0d	BODY GROUNDING SOUL & ROOM FRAGANCE	BBE6C104	Babor SPA	\N	t	2026-01-29 19:09:25.33	2026-01-29 19:09:25.33	36.85	Venda Público
1824fa02-e6c7-4137-b340-2b28b4816ec6	BODY AGATHIST SOUL & BODY LOTION 250 ML	BBE6C203	Babor SPA	\N	t	2026-01-29 19:09:25.33	2026-01-29 19:09:25.33	33.16	Venda Público
56f60ddf-96cc-496b-bf10-f34d8e4b8673	BODY AGATHIST SOUL & BODY WASH 250 ML	BBE6C204	Babor SPA	\N	t	2026-01-29 19:09:25.33	2026-01-29 19:09:25.33	26.51	Venda Público
5f11daa3-4c35-41d3-af44-ba7a0edbbbb0	BODY AGATHIST SOUL & ROOM FRAGRANCE 220 ML	BBE6C205	Babor SPA	\N	t	2026-01-29 19:09:25.33	2026-01-29 19:09:25.33	39.80	Venda Público
cmkd6qszz002qcynt6riw9lyd	SEACREATION THE EYE CREAM 15 ML	BBC9C023	Sea Creation	\N	t	2026-01-13 22:50:45.455	2026-01-21 10:16:09.521	106.90	Venda Público
cmkd6qt01002rcynthk30kn97	SEACREATION THE MASK 50 ML	BBC9C024	Sea Creation	\N	t	2026-01-13 22:50:45.457	2026-01-21 10:16:09.521	119.41	Venda Público
48242900-7690-4fd5-ae76-8e409af9cb10	AMPOULE PROMOTION ASSORTMENT	BBF1C313	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	320.00	Venda Público
de073daf-cb44-4fea-99c6-3318e4e0d034	DECORATION DUMMIES AMPOULE PROMO 2023	BBF1PD313	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	5.20	Venda Público
2e1dc024-e9cb-4571-a732-2f2f9cef245b	DISPLAY AMPOULES PROMO 2023	BBF1PE313	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	54.08	Venda Público
c965e36e-9d9f-4389-9e3b-974641ba2b13	ASSORT TRENDCOLOUR A/W 22 + TESTERS (9 PCS)	BBMKPE006	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	401.10	Venda Público
36fde6b9-f046-44e1-b6e5-c7761e2ce3c1	REPAIR PRE & PROBIOTIC HAND CREAM 100 ML	BBZ1096	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	14.27	Venda Público
3c8b7f2d-6ab1-4d13-b293-1b374592f93a	PRO PERFOMANCE POWER CONCENTRATE SET (4 PCS)	BBZ1103	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	92.43	Venda Público
9685bfb0-8110-4347-963c-0a6cc59d7b39	ADVENT CALENDAR 2024	BBZ1165	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	52.23	Venda Público
79ba8620-f796-44d1-87b9-da03020a6da8	SOUL & BODY GIFT SET (2 ST)	BBZ1168	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	31.98	Venda Público
f620374d-d0c9-4844-afb1-d7b06dfcd191	DOC CURE SET (3 PCS)	BBZ1174	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	79.65	Venda Público
aa72368f-1577-433e-8179-62e42cb8a90e	REFINE TRAVEL KIT	BBZ1048	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	28.00	Venda Público
654044b2-421e-47bc-b039-5b578bd99f2a	ADVENT CALENDER 2025	BBZ1175	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	56.40	Venda Público
9ce238bf-ed8b-42f4-889d-db516447678b	SOUL & BODY GIFT SET 2025 (2 PCS)	BBZ1177	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	34.53	Venda Público
00d69b2c-2c26-4a29-a0a4-aca4aa2204b2	AMP ASSORTMENT PRECIOUS COLLECTION (9 PCS)	BBF1C100	Kits Promocionais	\N	t	2026-01-29 19:09:44.921	2026-01-29 19:09:44.921	160.00	Venda Público
cmkd6qt1h003fcyntx1dnce20	CREAMY LIPSTICK 01 ON FIRE 4GR	BBMKC200	Maquilhagem	\N	t	2026-01-13 22:50:45.509	2026-01-21 10:16:09.521	17.86	Venda Público
cmkd6qt1j003gcynt96b34y41	CREAMY LIPSTICK 02 HOT BLOODED 4GR	BBMKC201	Maquilhagem	\N	t	2026-01-13 22:50:45.511	2026-01-21 10:16:09.521	17.86	Venda Público
cmkd6qt1l003hcyntw5b0xi3r	CREAMY LIPSTICK 03 METALLIC PINK 4GR	BBMKC202	Maquilhagem	\N	t	2026-01-13 22:50:45.513	2026-01-21 10:16:09.521	17.86	Venda Público
cmkd6qt1n003icynt9tew0yeb	CREAMY LIPSTICK 04 NUDE ROSE 4GR	BBMKC203	Maquilhagem	\N	t	2026-01-13 22:50:45.515	2026-01-21 10:16:09.521	17.86	Venda Público
cmkd6qt1p003jcyntm9i6q9gf	CREAMY LIPSTICK 05 NUDE PINK 4GR	BBMKC204	Maquilhagem	\N	t	2026-01-13 22:50:45.517	2026-01-21 10:16:09.521	17.86	Venda Público
cmkd6qt1r003kcyntcuj28mce	CREAMY LIPSTICK 06 POWDERY PEACH 4GR	BBMKC205	Maquilhagem	\N	t	2026-01-13 22:50:45.519	2026-01-21 10:16:09.521	17.86	Venda Público
10301b82-d332-424c-b910-7ef1a3b2bee3	CREAMY LIPSTICK 07 SUMMER ROSE 4GR	BBMKC206	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.86	Venda Público
844eeb3f-1d0c-44ec-b9e3-1b1c50ec224d	CREAMY LIPSTICK 08 GIN&JUICE 4GR	BBMKC207	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.86	Venda Público
ceec597d-a050-4f74-9519-35bb4c99921d	CREAMY LIPSTICK 09 BABY DOLL 4GR	BBMKC208	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.86	Venda Público
422dd3ad-841d-4b2b-b63d-96a3f76df333	CREAMY LIPSTICK 10 SUPER RED 4GR	BBMKC209	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.86	Venda Público
cmkd6qt1t003lcynteqj5wgfz	MATTE LIPSTICK 11 VERY CHERRY MATT 4GR	BBMKC210	Maquilhagem	\N	t	2026-01-13 22:50:45.521	2026-01-21 10:16:09.521	17.86	Venda Público
cmkd6qt1v003mcynta794a7xl	MATTE LIPSTICK 12 SO NATURAL MATTE 4GR	BBMKC211	Maquilhagem	\N	t	2026-01-13 22:50:45.523	2026-01-21 10:16:09.521	17.86	Venda Público
78cd89de-46ce-4072-964e-b7b4243daa36	MATTE LIPSTICK 13 LOVELY CREAM ROSE MATTE 4GR	BBMKC212	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.86	Venda Público
d04a76d1-9ef7-4b35-9477-e965cb2ee566	MATTE LIPSTICK 14 LIGHT MAUVE MATTE 4GR	BBMKC213	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.86	Venda Público
ae687db9-78f9-42a7-bf22-010a43b8ed0a	MATTE LIPSTICK 15 SWEET PINK MATTE 4GR	BBMKC214	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.86	Venda Público
6105eca4-7aaa-48c6-b0e0-2c974b7d2cdf	MATTE LIPSTICK 16 SUNSET BEACH MATTE 4GR	BBMKC215	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.86	Venda Público
cmkd6qt1x003ncyntw5wt2gtc	LIP LINER 01 PEACH NUDE 1GR	BBMKC216	Maquilhagem	\N	t	2026-01-13 22:50:45.525	2026-01-21 10:16:09.521	10.08	Venda Público
cmkd6qt20003ocynt43jnhk3p	LIP LINER 02 RED 1GR	BBMKC217	Maquilhagem	\N	t	2026-01-13 22:50:45.528	2026-01-21 10:16:09.521	10.08	Venda Público
e8322e36-e65b-4c6b-b78c-5821fafa9566	LIP LINER 03 NUDE ROSE 1GR	BBMKC218	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	10.08	Venda Público
0c4600fb-d1fa-4daa-9be8-ea9fe3ae14f8	LIP LINER 04 NUDE BERRY 1GR	BBMKC219	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	10.08	Venda Público
cmkd6qt22003pcynt3vvxsikv	SUPER SOFT LIP OIL 01 PEARL PINK 6,5 ML	BBMKC220	Maquilhagem	\N	t	2026-01-13 22:50:45.53	2026-01-21 10:16:09.521	14.53	Venda Público
cmkd6qt24003qcyntk6rcswjk	SUPER SOFT LIP OIL 02 JUICY RED 6,5 ML	BBMKC221	Maquilhagem	\N	t	2026-01-13 22:50:45.532	2026-01-21 10:16:09.521	14.53	Venda Público
df2e8ffb-35ef-4f49-89b8-89e200243d23	ULTRA SHINE LIP GLOSS 01 BRONZE 6,5 ML	BBMKC222	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.40	Venda Público
18f2765a-31f6-4d48-ac12-35262d123bad	ULTRA SHINE LIP GLOSS 02 BERRY NUDE 6,5 ML	BBMKC223	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.40	Venda Público
6ed5f18b-36c1-467b-a9a3-4de4d1c905ef	ULTRA SHINE LIP GLOSS 03 SILK 6,5 ML	BBMKC224	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.40	Venda Público
54cc133e-ffe4-451d-9331-bbc4bd3f80d4	ULTRA SHINE LIP GLOSS 04 LEMONADE 6,5 ML	BBMKC225	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.40	Venda Público
474ae184-3e55-40ff-afcf-9c8b79d7471e	ULTRA SHINE LIP GLOSS 05 ROSE OF SPRING 6,5 ML	BBMKC226	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.40	Venda Público
a4690223-2bfa-42dc-9b1f-136d05756330	ULTRA SHINE LIP GLOSS 06 NUDE ROSE 6,5 ML	BBMKC227	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	12.40	Venda Público
719f2838-a7f7-4193-964b-11a4f6d0e8cc	EYE CONTOUR PENCIL 03 PACIFIC GREEN 1GR	BBMKC313	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	10.08	Venda Público
2a230bee-95f8-41ba-a52f-e62ddc88ccbd	EYE CONTOUR PENCIL 04 SMOKEY GREY 1GR	BBMKC314	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	10.08	Venda Público
cmkd6qt2h003vcyntb98604vq	EYE BROW PENCIL 01 LIGHT BROWN 1GR	BBMKC316	Maquilhagem	\N	t	2026-01-13 22:50:45.545	2026-01-21 10:16:09.521	10.08	Venda Público
e121b2bb-8462-44ac-98d5-642e0217fd54	EYE BROW PENCIL 02 ASH 1GR	BBMKC317	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	10.08	Venda Público
cmkd6qt2j003wcyntv1j45ktd	EYE BROW MASCARA 01 ASH 3GR	BBMKC318	Maquilhagem	\N	t	2026-01-13 22:50:45.547	2026-01-21 10:16:09.521	14.25	Venda Público
fbbf90a6-6bdf-4a4f-a568-8f1e3f33ee3e	EYE BROW MASCARA 02 MEDIUM 3GR	BBMKC319	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	14.25	Venda Público
178edeae-9e11-48eb-bacf-be328b90fb5e	EYE BROW MASCARA 03 DARK 3GR	BBMKC320	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	14.25	Venda Público
6383c8e1-34cd-4585-ab56-6118f7e944e0	ABSOLUTE VOLUME & LENGTH MASCARA BLACK 10ML	BBMKC321	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	22.32	Venda Público
cmkd6qt2l003xcyntdtek2mni	ULTIMATE STYLE&VOLUME MASCARA BLACK 10ML	BBMKC322	Maquilhagem	\N	t	2026-01-13 22:50:45.549	2026-01-21 10:16:09.521	18.37	Venda Público
cmkd6qt2o003ycyntqt5wyahj	EXTRA CURL & VOLUME MASCARA BLACK 10ML	BBMKC323	Maquilhagem	\N	t	2026-01-13 22:50:45.552	2026-01-21 10:16:09.521	18.37	Venda Público
b63dae9c-5285-4843-a292-29545f0b2517	PERFECT SEPARATION & LENGTH MASCARA 10ML	BBMKC325	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	18.37	Venda Público
cmkd6qt2r003zcyntbwjn6qy0	EYE SHADOW QUATTRO 01 NUDES 4GR	BBMKC326	Maquilhagem	\N	t	2026-01-13 22:50:45.555	2026-01-21 10:16:09.521	24.72	Venda Público
d1f23db5-0833-42b7-bee2-5257efc6d2d6	EYE SHADOW QUATTRO 02 SMOKEY 4GR	BBMKC327	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	24.72	Venda Público
a55cc243-772b-4b95-8585-ed1a29742fdd	EYE SHADOW QUATTRO 03 SHINY 4GR	BBMKC328	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	24.72	Venda Público
2a7f0c52-5b85-4935-8863-042411e6e69d	EYE SHADOW QUATTRO 04 DAY & NIGHT 4GR	BBMKC329	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	24.72	Venda Público
cmkd6qt2t0040cyntpjehhxs2	CREAMY COMPACT FOUNDATION SPF50 03 SUNNY 10GR	BBMKC105	Maquilhagem	\N	t	2026-01-13 22:50:45.557	2026-01-21 10:16:09.521	19.82	Venda Público
426f5490-a706-4db5-9380-c9219b88eac9	CREAMY COMPACT FDT SPF50 02 MEDIUM	BBMKC156	Maquilhagem	\N	t	2026-01-29 19:10:53.031	2026-01-29 19:10:53.031	17.35	Venda Público
f8fb04a5-e1cd-43a8-90cc-8eec61a958ae	LATA CERA MEL 500ML	EP10175	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	8.50	\N
dca4c8b6-63df-4768-bc6b-dc55040ea0b1	LATA CERA ROSA 500ML	EP10176	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	8.50	\N
cfbc1355-fa29-4bea-b2fe-4b8da283264b	CP PHYTO HY-OL BOOSTER BALANCING 100 ML	BBA1I303	Cleansing System	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	14.48	Profissional
4fd37acc-5bd5-4502-8119-d2ae482b18d2	CP PHYTO HY-OL BOOSTER REACTIVATING 100 ML	BBA1I304	Cleansing System	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	14.48	Profissional
61ebfed6-30d5-4283-98ff-938be6e8fe6d	CP GENTLE CLEANSING CREAM 200 ML	BBA1I309	Cleansing System	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	21.50	Profissional
66c35fce-3325-4376-ba70-10b45784bae9	CP DEEP CLEANSING FOAM 200 ML	BBA1I310	Cleansing System	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	16.77	Profissional
83ab011a-11b6-429a-ac27-7d86f7c8485f	CP REFINING ENZYME & VITAMIN C CLEANSER 40 GR	BBA1I311	Cleansing System	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	16.77	Profissional
6cecda02-c4c2-4bb2-8a11-fe4c85920740	CP CLE EYE & HEAVY MAKE UP REMOVER 200 ML	BBA1I315	Cleansing System	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	21.50	Profissional
e01f8069-5067-4d9b-abe6-eec8ad8c9ad6	CP CLE SOOTHING ROSE TONER 500 ML	BBA1I316	Cleansing System	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	38.42	Profissional
a30c9801-037a-4d61-8a13-f6cc76d702b5	CP EXP RICH VITALIZING MASK 200 ML	BBA1I322	Cleansing System	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	27.92	Profissional
b3c49d13-069d-4563-b717-82f530b52cfd	CP SMOOTHING PEELING CREAM 200 ML	BBA1I324	Cleansing System	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.84	Profissional
3346abb7-de64-408f-8a28-0eb5c4525bff	PEDRAS QUARTZ COR DE ROSA	BBD1I11	Expert Specialists	\N	t	2026-01-29 19:24:41.409	2026-01-29 19:24:41.409	87.75	Profissional
758c9014-40d0-4478-903a-e3ff0ff522d3	10ER NEEDLING CALMING MASK DECOLE (10 PCS)	BBD1I19	Expert Specialists	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.11	Profissional
fe920857-7da6-4b13-b142-0ff801b3e78e	DETOXIFYING CLAY MASK (10X60gr)	BBE1I19	Expert Specialists	\N	t	2026-01-29 19:24:41.409	2026-01-29 19:24:41.409	38.89	Profissional
084f6021-98d1-436d-a9fc-5f8a609a6864	CP SPECIALIST TONIC 200 ML	BBE1I8700	Expert Specialists	\N	t	2026-01-29 19:24:41.409	2026-01-29 19:24:41.409	20.41	Profissional
314e4bc9-c60f-4a95-9e41-ff6affb8a012	CP SPECIALIST PEELING LIQUID 200 ML	BBE1I8701	Expert Specialists	\N	t	2026-01-29 19:24:41.409	2026-01-29 19:24:41.409	64.04	Profissional
817f63ab-2505-4822-8b40-a96bf4d99f20	CP EXPERT SPECIALIST PEELING MASK 200 ML	BBE1I8702	Expert Specialists	\N	t	2026-01-29 19:24:41.409	2026-01-29 19:24:41.409	84.92	Profissional
2e895ce3-5ee0-4412-8f17-d89b46f19808	CP EXPERT SPECIALIST SILVER FOIL SHEET MASK 10 PCS	BBE1I8703	Expert Specialists	\N	t	2026-01-29 19:24:41.409	2026-01-29 19:24:41.409	98.00	Profissional
f9dd1189-c199-4a28-909f-86a7783af411	CP EXPERT SPECIALIST SMOOTHING SHEET MASK 10 PCS	BBE1I8705	Expert Specialists	\N	t	2026-01-29 19:24:41.409	2026-01-29 19:24:41.409	98.00	Profissional
bdf460ba-087d-45da-babb-9bb5927a31c6	CP EXPERT SPECIALIST ENZYME MICRO PEEL BALM 75 ML	BBE1I8706	Expert Specialists	\N	t	2026-01-29 19:24:41.409	2026-01-29 19:24:41.409	19.85	Profissional
3ab06182-603e-423d-b7c4-c3c34cea8c70	CP SKINOVAGE CALMING CREAM 50 ML	BBS2I100	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	18.42	Profissional
897a7951-6c4b-4bd7-b492-d13e16ee56c5	COLLAGEN DELUXE FOUDATION 01 PORCELAIN	BBMKC157	Maquilhagem	\N	t	2026-01-29 19:10:53.031	2026-01-29 19:10:53.031	28.20	Venda Público
d9b9e90b-f975-4e65-a249-b4c71bfd31a1	COLLAGEN DELUXE FOUDATION 02 IVORY	BBMKC158	Maquilhagem	\N	t	2026-01-29 19:10:53.031	2026-01-29 19:10:53.031	28.20	Venda Público
4999b03c-c3a8-4e63-a4c7-ee42380a497b	COLLAGEN DELUXE FOUDATION 03 NATURAL	BBMKC159	Maquilhagem	\N	t	2026-01-29 19:10:53.031	2026-01-29 19:10:53.031	28.20	Venda Público
16083397-d4c9-4643-82c3-750c6a0d5530	COLLAGEN DELUXE FOUDATION 04 ALMOND	BBMKC160	Maquilhagem	\N	t	2026-01-29 19:10:53.031	2026-01-29 19:10:53.031	28.20	Venda Público
cmkd6qt2y0042cyntkgajesg5	3D FIRMING SERUM FDT 01 PORCELAIN 30ML	BBMKC112	Maquilhagem	\N	t	2026-01-13 22:50:45.562	2026-01-21 10:16:09.521	35.17	Venda Público
b60aca7a-7867-4b8b-97dd-25379b4566a1	3D FIRMING SERUM FDT 02 IVORY 30ML	BBMKC113	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.17	Venda Público
dad26136-06a5-4c61-8d53-4dad907a14b4	3D FIRMING SERUM FDT 03 NATURAL 30ML	BBMKC114	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.17	Venda Público
5785f6c2-f12b-45fd-a0ac-ba571cec9f8c	3D FIRMING SERUM FDT 04 ALMOND 30ML	BBMKC115	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.17	Venda Público
6925c103-a070-4a9c-bd8f-ad794d5ae29f	3D FIRMING SERUM FDT 05 SUNNY 30ML	BBMKC116	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	35.17	Venda Público
a2bcb6bb-da44-438b-8d22-3431cf5354cf	3D FIRMING CONCEALER 03 NATURAL 4GR	BBMKC138	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	18.03	Venda Público
cf36679e-67fc-4880-b4aa-459b2069af9f	3D FIRMING CONCEALER 04 TAN 4GR	BBMKC139	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	18.03	Venda Público
cmkd6qt3i004acynth61rsghk	SATIN DUO BRONZER 6GR	BBMKC153	Maquilhagem	\N	t	2026-01-13 22:50:45.582	2026-01-21 10:16:09.521	21.03	Venda Público
cmkd6qt3k004bcynt304bk9hw	SATIN DUO HIGHLIGHTER 6GR	BBMKC154	Maquilhagem	\N	t	2026-01-13 22:50:45.584	2026-01-21 10:16:09.521	19.82	Venda Público
393ae688-54be-49f3-979f-0e97a5f97262	ASSORT MAKE UP RELAUNCH 2021	BBMKC100	Maquilhagem	\N	t	2026-01-29 19:11:10.654	2026-01-29 19:11:10.654	2200.00	Venda Público
bab76dcf-03db-48e8-8c97-79153dd91cdc	PENCIL SHARPENER (6 PCS)	BBMKC101	Maquilhagem	\N	t	2026-01-29 19:11:10.654	2026-01-29 19:11:10.654	19.21	Venda Público
185512bd-10c4-4ad5-a353-8c85b317acd3	BRUSH SET MAKE UP (12 PCS)	BBMKC102	Maquilhagem	\N	t	2026-01-29 19:11:10.654	2026-01-29 19:11:10.654	140.00	Venda Público
1723231c-7df9-482c-9285-8bc6c1d9b578	Kabuki Brush	BBMKC106	Maquilhagem	\N	t	2026-01-29 19:11:10.654	2026-01-29 19:11:10.654	11.48	Venda Público
7e9ba747-96c5-4f79-9ec5-07d2fe5e67f5	CLE ANNIVERSARY SET HY-OL & PHYTO CALMING (2 PCS)	BBA1C344	Promoção Mensal	\N	t	2026-01-29 19:11:24.937	2026-01-29 19:11:24.937	31.16	Venda Público
2e9459cd-ee79-4b8d-8088-08bc1e7723f1	CLE ANNIVERSARY SET HY-OL & PHYTO REACTIV. (2 PCS)	BBA1C345	Promoção Mensal	\N	t	2026-01-29 19:11:24.937	2026-01-29 19:11:24.937	31.16	Venda Público
f55a7bfc-4e1f-4f01-a9c8-795eae6c8dd8	CLE ANNIVERSARY SET HY-OL & PHYTO BALANCING (2 PCS)	BBA1C346	Promoção Mensal	\N	t	2026-01-29 19:11:24.937	2026-01-29 19:11:24.937	31.16	Venda Público
b1de66df-96a0-4a1e-8d4d-0d4b9b45e56d	BABOR 70 ANNIVERSARY SET (4 PCS)	BBZ1180	Promoção Mensal	\N	t	2026-01-29 19:11:24.937	2026-01-29 19:11:24.937	86.29	Venda Público
69f6b644-2d42-4772-a3ef-1aae5dff00fe	PROMO EASTER EGG 2026	BBZ1181	Promoção Mensal	\N	t	2026-01-29 19:11:24.937	2026-01-29 19:11:24.937	37.40	Venda Público
cmkd6qt4p004qcynti9md18aw	EVEN SENSE SPF50 50 ML	SKVC003	Skinvisibles	\N	t	2026-01-13 22:50:45.625	2026-01-13 22:50:45.625	17.50	Venda Público
cmkd6qt4r004rcyntswhcse4k	TRANSPARENT SENSE SPF50+ 50 ML	SKVC004	Skinvisibles	\N	t	2026-01-13 22:50:45.627	2026-01-13 22:50:45.627	19.00	Venda Público
cmkd6qt4u004scynt03bjsx6b	INVISIBLE SENSE SPRAY SPF50+ 200 ML	SKVC005	Skinvisibles	\N	t	2026-01-13 22:50:45.63	2026-01-13 22:50:45.63	19.00	Venda Público
9cfde574-57fb-4dc4-a22d-4c175c387262	CP SKINOVAGE CALMING CREAM RICH	BBS2I101	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	75.18	Profissional
d1e33dcc-e199-4217-baed-b7c5e7528715	CP SKINOVAGE CALMING MASK	BBS2I103	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	41.44	Profissional
234f0051-0ffa-4855-8346-c636dc9d965f	CP SKINOVAGE BALANCING CREAM 50 ML	BBS3I100	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	18.42	Profissional
1b22c503-b2bc-441d-ac51-cb0fd5fe05ed	CP SKINOVAGE BALANCING CREAM RICH	BBS3I101	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	75.18	Profissional
2636e9ae-c940-492b-80de-4dafb7c8effd	CP SKINOVAGE BALANCING MASK	BBS3I103	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	41.44	Profissional
bc7c3f5b-faaf-4c23-8743-c87649489d72	CP PURIFYING CREAM 50 ML	BBS5I103	Skinovage	\N	t	2026-01-29 19:24:58.011	2026-01-29 19:24:58.011	13.83	Profissional
d8e5d220-9a86-4abe-8a87-a4cfcc01f4f3	CP CLASSICS MIMICAL CONTROL	BBS6I101	Classics	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	74.90	Profissional
c1d935af-d2ad-4143-9421-54071c3a2f01	CP CLASSICS ARGAN CREAM	BBS6I102	Classics	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	71.09	Profissional
01d43572-a21b-422d-a6e0-45b6a5573554	CP SKINOVAGE MOISTURIZING CREAM 50 ML	BBS8I100	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	18.42	Profissional
d131b1ed-99db-4c2f-ac25-551ba49b616c	CP SKINOVAGE MOIST+LIPID CREAM	BBS8I101	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	75.18	Profissional
e3fea81d-d6a5-4057-9d93-55a3607aee22	CP SKINOVAGE MOIST.EYE CREAM 30 ML	BBS8I103	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	28.39	Profissional
ca82ba6c-f623-438c-9df3-1a7a977d068d	CP SKINOVAGE MOIST.FOAM MASK	BBS8I104	Skinovage	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	18.09	Profissional
bce5039a-1ea7-4cbf-917c-e4cf5ec3630f	CP REGENERATION REBALANCING TONER 500 ML	BBE1I8101	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	39.51	Profissional
0fa14949-8421-4366-a6bd-1cb037494c90	CP REGENERATION ECM REPAIR SERUM 30 ML	BBE1I8102	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	30.38	Profissional
df399f4b-d3b4-4e5a-a9ce-23a854cd7f5a	CP REGENERATION REPAIR & RADIANCE MASK 200 ML	BBE1I8106	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	75.94	Profissional
77ba9f5c-f46f-444e-83dc-534cd3f99916	CP DOC REGENERATION THE CURE CREAM 200 ML	BBE1I8107	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	104.69	Profissional
4be8288f-48ac-4671-8107-8a0d9a2b4be8	CP DB REGENERATION BARRIER BAL LOTION CLEANSER 200ML	BBE1I8108	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	14.36	Profissional
6e416091-db48-4297-b1d8-ad1918226144	CP LIFTING DERMA FILLER SERUM 30 ML	BBE1I8200	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	30.24	Profissional
cc6ce1c8-bf07-4ad0-a84d-b6daa1c05b04	CP LIFTING COLLAGEN-PEPTIDE BOOSTER CREAM 200 ML	BBE1I8202	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	85.96	Profissional
2123cf75-c7a8-4450-94e6-cc1bfc666790	CP LIFTING DUAL EYE SOLUTION - EYE CREAM DAY 30 ML	BBE1I8205	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	36.93	Profissional
fb54e2cd-f63f-4b5b-a76e-0aff3acccc1b	CP HYDRATION HYDRO REPLENISHING GEL CREAM 50 ML	BBE1I8303	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	32.26	Profissional
a60f66d3-e2f2-451d-a1af-5ff143fdbc98	CP HYDRATION DE-PUFFING EYE GEL 30 ML	BBE1I8304	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	36.29	Profissional
ac877d7f-9100-4a17-a622-119387e6844a	CP DB HYD 10D HYALURONIC ACID AMP 48 ML	BBE1I8306	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	53.76	Profissional
3efdb35f-a1eb-4f85-b75b-2ef450c7ef7d	CP RESURFACE REFINING CLEANSING OIL BALM 200 ML	BBE1I8400	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	27.78	Profissional
870abc58-96b8-4a23-9b44-6e942fbde160	CP RESURFACE RENEWAL CREAM 200 ML	BBE1I8404	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	91.00	Profissional
eafcd7dd-526e-4450-802c-9c3515d5037e	CP RESURFACE DARK SPOT CORRECT CONCENTRATE 30ML	BBE1I8410	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	28.22	Profissional
1a7b17da-5db0-4af0-8c49-052ff1163b64	CP SENSITIVE SOOTHING CREAM CLEANSER 200 ML	BBE1I8500	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	18.26	Profissional
62b4a335-3019-4b50-9af2-7194df88059b	CP DOC SENS ITCH RELIEF SERUM	BBE1I8502	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	24.61	Profissional
ec20981e-7421-4f7d-900d-6205ce0477ed	CP DOC SENS SOOTHING CREAM RICH	BBE1I8506	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	31.22	Profissional
1396ccfe-58a9-4ddb-bd00-98690964be57	CP CLARIFYING DAILY BLEMISH CONTROL CLEANSING GEL 200 ML	BBE1I8600	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	22.18	Profissional
68eed754-103a-4368-bded-2c69497b8e6a	CP DB CLARIFYING BLEMISH CORRECTING CREAM 50 ML	BBE1I8603	Dr. Babor	\N	t	2026-01-29 19:25:18.827	2026-01-29 19:25:18.827	19.80	Profissional
f3377030-81c3-4d02-9ddd-a8b9ee5e9e78	CP DB MB HERBAL BALANCING TONER 200 ML	BBE1I6000	Dr. Babor	\N	t	2026-01-29 19:25:33.909	2026-01-29 19:25:33.909	19.49	Profissional
54b1a456-9876-4608-9679-e5a67465dbf1	CP DB MB MOISTURE GLOW SERUM 30 ML	BBE1I6001	Dr. Babor	\N	t	2026-01-29 19:25:33.909	2026-01-29 19:25:33.909	14.20	Profissional
38edc1d5-4c06-43aa-aade-79ae1bb47e4e	CP DB MB AWAKENING EYE CREAM 30 ML	BBE1I6002	Dr. Babor	\N	t	2026-01-29 19:25:33.909	2026-01-29 19:25:33.909	22.40	Profissional
1ea643de-e534-4373-8a6d-6fda1e2169a0	CP DB MB RENEWAL OVERNIGHT MASK 200 ML	BBE1I6003	Dr. Babor	\N	t	2026-01-29 19:25:33.909	2026-01-29 19:25:33.909	28.36	Profissional
1952b24c-85c7-4885-8e3b-bf94d508f9b4	CP DB MB MOISTURE GLOW CREAM 50 ML	BBE1I6004	Dr. Babor	\N	t	2026-01-29 19:25:33.909	2026-01-29 19:25:33.909	14.20	Profissional
2537193b-be9d-46f2-acdc-55a428f7a7c9	CP DB MB STRESS DEFENSE CREAM 50 ML	BBE1I6005	Dr. Babor	\N	t	2026-01-29 19:25:33.909	2026-01-29 19:25:33.909	18.00	Profissional
52e271eb-ae08-404a-9079-f0239f7056ac	CP DOC CLEAN MOISTURE GLOW SERUM 30 ML	BBE1I1005	Dr. Babor	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	14.20	Profissional
7dcd3b7e-03f1-4a30-806e-f244731217be	CP DOC CLEAN MOISTURE GLOW GEL-CREAM 50 ML	BBE1I1006	Dr. Babor	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	14.20	Profissional
ca05dd1f-b70d-449d-8e4a-0ecf4fe87f9c	CP DOC CLEAN RENEWAL OVERN MASK 200 ML	BBE1I1007	Dr. Babor	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	28.36	Profissional
1007a50d-612a-457d-8c57-bf5d40093337	CP DOC CLEAN GLOW STARTER MASK 100 ML	BBE1I1009	Dr. Babor	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	10.44	Profissional
9139aee6-230a-4e41-87a7-b854f920b03e	CP PRO PEP CONCENTRATE 30 ML	BBE1I927	Dr. Babor Pro	\N	t	2026-01-29 19:25:49.725	2026-01-29 19:25:49.725	21.37	Profissional
a957c3f2-b89f-49b4-aedf-d1bb3f416b87	CP PRO EGF & COLLAGEN CREAM	BBE1I913	Dr. Babor Pro	\N	t	2026-01-29 19:25:49.725	2026-01-29 19:25:49.725	43.35	Profissional
09b58d59-fa34-4608-9863-278974d4735e	CP PRO AHA PEELING 20% PH 2.7	BBE1I919	Dr. Babor Pro	\N	t	2026-01-29 19:25:49.725	2026-01-29 19:25:49.725	83.32	Profissional
dc07cb49-46a6-472e-b1ef-290d00b1bd30	CP DC PRO EXO YOUTH SERUM	BBE1I9000	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	49.59	Profissional
71bcd2b9-dae6-492d-bbdc-8299ed25b890	CP DCOC PRO EXO YOUTH CREAM	BBE1I9001	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	107.38	Profissional
d27e13d0-76c9-42c9-9883-3d6743090c1c	CP DOC PRO LONGEVITY SERUM	BBE1I9002	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	49.59	Profissional
f55a9851-7d77-4061-b57e-e5360d46781d	CP DOC PRO HYALURONIC ACID PLUMP SERUM	BBE1I9003	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	37.16	Profissional
479743bb-dd46-4a09-b2e0-ed455e9db86d	CP DOC PRO BALANCING OINTMENT CLEANSER	BBE1I9004	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	19.21	Profissional
e3f36a1b-7768-4795-9081-480bcfd0aaa8	CP DOC PRO BARRIER RESIL TONER	BBE1I9007	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	27.22	Profissional
e310d05d-fcb2-492b-b744-4af518da032f	CP DOC PRO ENERGY ACTIV ESSENCE	BBE1I9005	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	16.52	Profissional
d7ddcd64-8381-4a2e-b485-adf5225b2ff0	CP DOC PRO VITAMIN B CALMING SERUM	BBE1I9008	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	37.16	Profissional
be5956d5-4522-4a28-98b7-50efad91e80e	CP DOC PRO DERMA CONTROL SERUM	BBE1I9009	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	37.16	Profissional
147cfcb4-8e27-46aa-840a-26b6414c459c	CP DOC PRO RETINOL REFINING SERUM	BBE1I9010	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	47.52	Profissional
d5b049da-9797-4d24-9f83-767487731e59	CP DOC PRO VITAMIN C-20 SERUM	BBE1I9011	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	47.52	Profissional
744cf65a-c444-46d2-94d3-b758e04f632e	CP DOC PRO SIGNATURE MASSAGE CREAM	BBE1I9012	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	87.36	Profissional
d0973b02-f5b9-41cd-ae97-3bf7ce59615e	CP DOC PRO SENSITIVE EMUGEL	BBE1I9013	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	33.07	Profissional
363cbfd0-a2a4-4ba2-b169-faa296d4a9bb	CP DOC PRO DERMA CONTROL EMULSION	BBE1I9014	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	37.16	Profissional
9241fbb7-3626-4d89-a6ce-937a55799ea2	CP DOC PRO HYDR. RECOV. OINTMENT	BBE1I9015	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	18.54	Profissional
64fc4ed5-efb6-4b61-8647-45f4e052b8f1	CP DOC PRO ANTIOX. BALM SPF50+	BBE1I9016	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	18.54	Profissional
24577a7d-e668-404c-9be8-0ae1075f75eb	CP DOC PRO SKIN TONE BALM EYE CREAM	BBE1I9017	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	53.62	Profissional
d4c3d93c-0703-4d51-bee7-7df56e47d866	DOC PRO VITAMIN B CALMING SHEET MASK F&D	BBE1I9019	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	88.20	Profissional
a4ac436a-f5e2-4537-b44e-dd0c7c08028c	CP DOC PRO RICH MENO CREAM MASK	BBE1I9020	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	57.79	Profissional
d47a6adb-9552-4f69-a340-65bd6a6259db	CP DOC PRO ANT. RAD. SHEET M&D (20 ST)	BBE1I9021	Dr. Babor Pro	\N	t	2026-01-29 19:26:09.155	2026-01-29 19:26:09.155	88.20	Profissional
31260d9b-eba6-4542-b12f-4f0b53d1e0c8	CP DOC PRO AHA PEEL 10% PH 3.5	BBE1I9023	Dr. Babor Pro	\N	t	2026-01-29 19:26:24.321	2026-01-29 19:26:24.321	171.22	Profissional
097d9d91-47bf-4f0d-9f2d-2f86a3d2698a	CP DOC PRO AHA PEEL 20% PH 3.0	BBE1I9024	Dr. Babor Pro	\N	t	2026-01-29 19:26:24.321	2026-01-29 19:26:24.321	171.22	Profissional
bbfb0c57-4b56-4fd1-abec-81b5f92508c4	CP DOC PRO AHA 30% PH 2.7	BBE1I9025	Dr. Babor Pro	\N	t	2026-01-29 19:26:24.321	2026-01-29 19:26:24.321	171.22	Profissional
0c0c5f0b-a672-4966-a913-1acaac24ed7f	CP DOC PRO 14% AHA T. VIT.C PEEL PH 4	BBE1I9026	Dr. Babor Pro	\N	t	2026-01-29 19:26:24.321	2026-01-29 19:26:24.321	171.22	Profissional
9c3603b2-d719-4bbe-8746-d277ddd15306	CP DOC PRO 4,5% AHA PEEL PH 4	BBE1I9027	Dr. Babor Pro	\N	t	2026-01-29 19:26:24.321	2026-01-29 19:26:24.321	171.22	Profissional
e53b15c3-c844-4e55-a1c6-e408be97a829	CP DOC PRO SKIN TONE BALANCING CREAM	BBE1I9018	Dr. Babor Pro	\N	t	2026-01-29 19:26:24.321	2026-01-29 19:26:24.321	41.33	Profissional
3e2e1e9d-6456-4fc9-90b6-5af861f74396	CP DOC MN PLUMPING SERUM (DEVICE NEEDLING)	BBE1I9028	Dr. Babor Pro	\N	t	2026-01-29 19:26:24.321	2026-01-29 19:26:24.321	23.52	Profissional
b808188c-d350-41c1-bbc4-8f11e5f12317	CP DOC MN YOUTH SERUM (DEVICE NEEDLING)	BBE1I9029	Dr. Babor Pro	\N	t	2026-01-29 19:26:24.321	2026-01-29 19:26:24.321	32.93	Profissional
bf57517c-a2c4-43f4-a475-a3e4bd07627e	CP DOC MN LONGEVITY SERUM (DEVICE NEEDLING)	BBE1I9030	Dr. Babor Pro	\N	t	2026-01-29 19:26:24.321	2026-01-29 19:26:24.321	32.93	Profissional
a52b2636-5ab2-441e-ae94-1829e1e5fa67	CP DOC MN REFINING SERUM (DEVICE NEEDLING)	BBE1I9031	Dr. Babor Pro	\N	t	2026-01-29 19:26:24.321	2026-01-29 19:26:24.321	32.93	Profissional
b993e974-b663-4618-a12b-85b84d381e9d	DOC PRO CRYO MASSAGE STICKS (SERVICE ITEMS)	BBE1I9032	Dr. Babor Pro	\N	t	2026-01-29 19:26:24.321	2026-01-29 19:26:24.321	44.80	Profissional
8fc5fe70-e4b6-4672-8644-1ca4bc1cea82	CORNEOFIX (FOLIEN)	BBE1I9033	Dr. Babor Pro	\N	t	2026-01-29 19:26:24.321	2026-01-29 19:26:24.321	36.45	Profissional
86960c2c-077c-4277-a307-b526a82414bf	DERMAVISUALIZER 2.0	BBE1I9034	Dr. Babor Pro	\N	t	2026-01-29 19:26:24.321	2026-01-29 19:26:24.321	1200.00	Profissional
4456a9b6-6a35-4cb7-a3af-1074640afa84	CP CREAMY LIPSTICK 01 ON FIRE 4GR	BBMKI200	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
6f07081c-3f0b-45d3-8d65-f23848e93d4a	CP CREAMY LIPSTICK 03 METALLIC PINK 4GR	BBMKI202	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
5a430e11-a99c-4eaf-8743-92e386faf838	CP CREAMY LIPSTICK 04 NUDE ROSE 4GR	BBMKI203	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
0ca241c0-f2ff-45dd-b42e-50e78e311fa8	CP CREAMY LIPSTICK 05 NUDE PINK 4GR	BBMKI204	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
148e6e6a-d863-4ba8-904d-111ac487897f	CP CREAMY LIPSTICK 06 POWDERY PEACH 4GR	BBMKI205	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
8855c034-ddbf-451b-95e3-c6d63585dcfb	CP CREAMY LIPSTICK 07 SUMMER ROSE 4GR	BBMKI206	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
6ebd1b63-d0ef-4172-88fd-a672af65b48b	CP CREAMY LIPSTICK 08 GIN&JUICE 4GR	BBMKI207	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
b1f1120a-e5aa-47ff-a820-4910f3c72250	CP CREAMY LIPSTICK 09 BABY DOLL 4GR	BBMKI208	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
e8223406-cc2c-4707-8267-406ef8540aaf	CP CREAMY LIPSTICK 10 SUPER RED 4GR	BBMKI209	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
1f31d24e-4268-4bc6-a66c-babd13583cd2	CP MATTE LIPSTICK 11 VERY CHERRY MATTE 4GR	BBMKI210	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
e3dc8231-8e97-4007-b7de-0930a85f6644	CP MATTE LIPSTICK 12 SO NATURAL MATTE 4GR	BBMKI211	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
cdf1f48b-bb43-4360-b8db-d03e9c748819	CP MATTE LIPSTICK 13 LOVELY CREAM ROSE 4GR	BBMKI212	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
4a0a1aa6-59b0-44ae-9e61-3b2c944e4978	CP MATTE LIPSTICK 14 LIGHT MAUVE 4GR	BBMKI213	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
24eecea2-4cc9-4c07-badf-33e798255dd3	CP MATTE LIPSTICK 15 SWEET PINK 4GR	BBMKI214	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
f17496dd-2cdd-4a9a-a1c9-0c3b577df6ed	CP MATTE 16 SUNSET BEACH MATTE 4GR	BBMKI215	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.18	Profissional
3416812d-a9c1-4d5c-9811-4d611830e75b	CP LIP LINER 01 PEACH NUDE 1GR	BBMKI216	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.11	Profissional
3c6c24c3-bf77-4487-8ac2-d906bd0ab08c	CP LIP LINER 02 RED 1GR	BBMKI217	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.11	Profissional
9b00a36a-3fec-4777-8243-6efe953be371	CP LIP LINER 03 NUDE ROSE 1GR	BBMKI218	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.11	Profissional
88c1eb2b-bdf6-4514-8f8a-6f15bb0433b8	CP LIP LINER 04 NUDE BERRY 1GR	BBMKI219	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.11	Profissional
4aec87f8-86e6-4fa4-b485-1d55b26d3df8	CP ULTRA SHINE LIP GLOSS 01 BRONZE 6,5 ML	BBMKI222	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.98	Profissional
50a9e26f-56c5-47dd-af00-030f58364a5c	CP ULTRA SHINE LIP GLOSS 03 SILK 6,5 ML	BBMKI224	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.98	Profissional
637e7701-d281-405b-bb4a-c7cbc15d31af	CP ULTRA SHINE LIP GLOSS 04 LEMONADE 6,5 ML	BBMKI225	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.98	Profissional
93ad0740-bc11-44ef-82b7-51ebcddd3754	CP ULTRA SHINE LIP GLOSS 05 ROSE OF SPRING 6,5 ML	BBMKI226	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.98	Profissional
06995d78-99f8-47ba-a6b8-c8cdb5419fb3	CP EYE CONTOUR PENCIL 04 SMOKEY GREY 1GR	BBMKI314	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.14	Profissional
cf652273-3a18-4599-9c20-6905e4eb00b0	CP LIQUID EYELINER DEEP BLACK 1ML	BBMKI315	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	10.72	Profissional
3ed4f1d1-e1e3-433d-aebe-cfff31c18f62	CP EYE BROW PENCIL 01 LIGHT BROWN 1GR	BBMKI316	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.14	Profissional
26e840d2-9bde-41d1-926e-aa6521dc7cda	CP EYE BROW PENCIL 02 ASH 1GR	BBMKI317	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.14	Profissional
e58b8729-3c5c-4a13-86d4-ec2a9cc5cfb9	CP EYE BROW MASCARA 01 ASH 3GR	BBMKI318	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.45	Profissional
212c72a2-48dc-4be1-8dc7-dfd0db788ee0	CP EYE BROW MASCARA 03 DARK 3GR	BBMKI320	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.45	Profissional
a4ddd368-f928-432d-a76a-59529de13e7d	CP EXTRA CURL & VOLUME MASCARA BLACK 10ML	BBMKI323	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	13.69	Profissional
ac8956c6-d25d-4cd2-b50d-6459d4cd5715	CP SUPER STYLE & DEFINITION MASCARA BLACK 10ML	BBMKI324	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	13.97	Profissional
46f19837-f17b-45e3-8510-ec87a62ceb00	CP EYE SHADOW QUATTRO 01 NUDES 4GR	BBMKI326	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	13.38	Profissional
3a7966b5-c6fc-47ec-ab40-7721fadeedaa	CP EYE SHADOW QUATTRO02 SMOKEY 4GR	BBMKI327	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	13.38	Profissional
1b0812ef-6195-45f8-bf87-4d2a77b34389	CP EYE SHADOW QUATTRO 03 SHINY 4GR	BBMKI328	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	13.38	Profissional
153e4e46-c129-4c43-8cdd-a3ae1dc50b84	CP EYE SHADOW QUATTRO 04 DAY&NIGHT 4GR	BBMKI329	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	13.38	Profissional
7a0e9e60-97e8-47ba-9d8f-80013b1b8dd2	CP COLLAGEN DELUXE FDT 01 PORCELAIN	BBMKI157	Maquilhagem	\N	t	2026-01-29 19:27:24.837	2026-01-29 19:27:24.837	22.99	Profissional
bd548183-300d-4c68-8902-7dc097014b5e	CP COLLAGEN DELUXE FDT 02 IVORY	BBMKI158	Maquilhagem	\N	t	2026-01-29 19:27:24.837	2026-01-29 19:27:24.837	22.99	Profissional
fb64b85d-a4ec-44e3-b9ad-edb052859828	CP MATTE FINISH 04 FDT ALMOND 30ML	BBMKI120	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.39	Profissional
3c1f01c2-e864-43ae-806a-48e4e576e4f7	CP HYDRA LIQUID FDT 04 PORCELAIN 30ML	BBMKI124	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.39	Profissional
92e2a085-0a64-4f20-a03f-67979b2c13a4	CP HYDRA LIQUID FDT 05 IVORY 30ML	BBMKI125	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.39	Profissional
95a938aa-b368-4a4c-b69e-fa0ebc560c93	CP HYDRA LIQUID FDT 06 NATURAL 30ML	BBMKI126	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.39	Profissional
7d694b26-3c96-4696-8dba-6ce40c000b23	CP HYDRA LIQUID FDT 07 ALMOND 30ML	BBMKI127	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.39	Profissional
7b367dbf-43eb-464f-bab2-55908930d6a1	CP HYDRA LIQUID FDT 08 SUNNY 30ML	BBMKI128	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.39	Profissional
ec588e7c-fbe3-4358-a42e-035b339d871b	CP HYDRA LIQUID FDT 09 CAFFE LATTE 30ML	BBMKI129	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	17.39	Profissional
86a573d5-9fbc-4b47-8b6a-a6e56e945512	CP 3D FIRMING CONCEALER 01 PORCELAIN 4GR	BBMKI136	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	8.26	Profissional
0f7a2b8c-a74e-4385-a38d-357a5b57d38c	CP 3D FIRMING CONCEALER 02 IVORY 4GR	BBMKI137	Maquilhagem	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	8.26	Profissional
219c3639-794d-4192-b2aa-a59648640fec	SKINOVAGE BALANCING CREAM 15 ML	BBS3PB012	Miniaturas	\N	t	2026-01-29 19:32:43.618	2026-01-29 19:32:43.618	5.00	Promo
57970262-6f21-4ab0-b6d0-3502e15c1f3c	MIN PX MIMICAL CONTROL CREAM 15ML	BBS4PB001	Miniaturas	\N	t	2026-01-29 19:32:43.618	2026-01-29 19:32:43.618	4.58	Promo
13e5731b-affc-48fb-b792-0e20c453d018	SMALL SIZE SKINOVAGE VITALIZING CREAM 15 ML	BBS5PB0012	Miniaturas	\N	t	2026-01-29 19:32:43.618	2026-01-29 19:32:43.618	5.00	Promo
f4155664-9f8a-4066-956e-d0abf83c91b9	HY-OL & PHYTO BOOST HYDR SMALL 2 PCS	BBZPB002	Miniaturas	\N	t	2026-01-29 19:32:43.618	2026-01-29 19:32:43.618	7.20	Promo
60ca5729-4799-430b-9fe9-fb11a8575e27	DOC COLLAGEN BOOSTER CR SMALL 15 ML	BBZPB003	Miniaturas	\N	t	2026-01-29 19:32:43.618	2026-01-29 19:32:43.618	6.40	Promo
e384bc4b-92f0-4946-aa58-774847ea16fd	DOC PS AMP HYALURONIC ACID SMALL 6 ML	BBZPB004	Miniaturas	\N	t	2026-01-29 19:32:43.618	2026-01-29 19:32:43.618	5.34	Promo
4fd9da31-e9ae-4d6e-b865-f747de4034b2	CLEAN CLAY-MULTI CLEANSING SMALL 20 ML	BBZPB006	Miniaturas	\N	t	2026-01-29 19:32:43.618	2026-01-29 19:32:43.618	5.34	Promo
beca9a97-7b2e-4155-b5d8-3b5d7d7ccc83	DOC EYE CREAM DAY SMALL 7 ML	BBZPB007	Miniaturas	\N	t	2026-01-29 19:32:43.618	2026-01-29 19:32:43.618	5.34	Promo
42e4f533-e72e-4612-a492-1a9e8224b067	HSR LIFT ANTI-WRINKLE CR SMALL 15 ML	BBZPB009	Miniaturas	\N	t	2026-01-29 19:32:43.618	2026-01-29 19:32:43.618	6.40	Promo
dd4067f5-0282-45b7-b1a8-7fcd5de980ee	HY-OL & PHYTO BOOSTER HYDRA (2 PCS)	BBA1PB305	Miniaturas	\N	t	2026-01-29 19:32:43.618	2026-01-29 19:32:43.618	7.20	Promo
6b663818-da03-4782-8593-0c255e3690a0	CP BODY GROUNDING SOUL & HAND CREAM	BBE6I103	Body Cabin	\N	t	2026-01-30 08:07:02.923	2026-01-30 08:07:02.923	21.56	\N
c4b58298-1c60-4753-a4fc-8a7f7c3169eb	CP CS CALMING BI-PHASE MOISTURIZINER 30ML	BBS2I004	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	12.50	\N
eea729b1-a0d0-4a8c-8cc5-9964f7dd038d	CP PC INTENSE BALANCING CREAM 200ML	BBS3I003	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	33.00	\N
f0388b21-c77f-4540-9b60-a6c2646595a8	CP BALANCING MASK 200ML	BBS3I015	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	20.05	\N
2483f280-43d8-495c-a30a-0c66973bac8d	SE ANTI-WRINKLE EYE FLUID 15ML	BBS6C001	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	17.00	\N
13713047-2016-4c8d-882a-1480c60521bb	SE ANTI-WRINKLE EYE CREAM 15ML	BBS6C003	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	17.00	\N
ae70da36-85b8-4c59-b80c-6003c9ad6e41	SE REACTIVATING EYE CREAM 15ML	BBS6C004	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	15.00	\N
f07357f7-ad4e-4808-879d-3d506a047edd	WINTER PROTECT CREAM 50ML	BBS6C016	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	18.60	\N
59bedc2b-e7a2-4486-884d-62b1b6f33785	INTENS MOISTURE PLUS SERUM 30ML	BBS7C001	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	19.90	\N
3d68c53c-449c-4356-80a9-c610dc50c042	INTENS DETOX SERUM SPF15 30ML	BBS7C002	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	19.88	\N
cadf330f-477e-4083-a10c-32b6a8f846f8	INTENS ILLUMINATING SERUM 30ML	BBS7C003	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	19.50	\N
0d261c75-140f-4c79-bbd7-7d9e7e59e0aa	INTENS COMFORT CREAM MASK 50ML	BBS7C004	Oportunidades	\N	t	2026-01-30 08:07:02.931	2026-01-30 08:07:02.931	10.50	\N
11d307cd-b487-4d5b-a7d7-73b9651a581f	REVERSIVE DUAL SERUM 4X10 ML	BBG1C004	Oportunidades	\N	t	2026-01-30 08:07:02.934	2026-01-30 08:07:02.934	60.00	\N
ca71fafc-114e-4d43-8945-e0c6ee5e124f	TREATMENT SET REVERSIVE	BBG1I001	Oportunidades	\N	t	2026-01-30 08:07:02.934	2026-01-30 08:07:02.934	18.60	\N
9bc8494c-6dbd-452f-8e0d-dc32e6790e33	REVERSIVE COCOONING LINEN	BBG1I002	Oportunidades	\N	t	2026-01-30 08:07:02.934	2026-01-30 08:07:02.934	4.95	\N
9489d95d-1f05-4f1a-8d23-1a8d64bb0380	REVERSIVE EAU DE PARFUM 50 ML	BBG1C017	Oportunidades	\N	t	2026-01-30 08:07:02.934	2026-01-30 08:07:02.934	20.00	\N
af9aaa13-7620-4694-912e-cd7473bb558e	HSR DE LUXE CREAM RICH 50ML	BBB8C51	Oportunidades	\N	t	2026-01-30 08:07:02.936	2026-01-30 08:07:02.936	49.00	\N
5017f27a-fb44-4317-99c2-18fc3f43e9f9	HSR LIFTING SET 2016	BBB8C71	Oportunidades	\N	t	2026-01-30 08:07:02.936	2026-01-30 08:07:02.936	35.00	\N
e230dc5e-45b0-4dee-a53a-0a3c5e62b1a8	DB RC GLOW BOOSTER BI-PHASE AMPOULE 14X1ML	BBE1C100	Oportunidades	\N	t	2026-01-30 08:07:02.937	2026-01-30 08:07:02.937	16.70	\N
f862532c-b943-4839-b2c0-09615bbf2b45	CP SET DOCTOR BABOR REFINE CELLULAR	BBE1I107	Oportunidades	\N	t	2026-01-30 08:07:02.937	2026-01-30 08:07:02.937	29.35	\N
cce3435c-ebae-407f-98ab-f3acdc508142	DOC ULTIMATE DERMA OPTIMIZER 90ML	BBE1C20	Oportunidades	\N	t	2026-01-30 08:07:02.937	2026-01-30 08:07:02.937	68.73	\N
24dadf17-0818-4124-9f6e-e9fcce118855	DOC DERMA ULTIMATE WRINKLE FILLER 6ML	BBE1C21	Oportunidades	\N	t	2026-01-30 08:07:02.937	2026-01-30 08:07:02.937	24.02	\N
5c782991-e055-48fe-a6f5-983fc64c53d7	ULTIMATE VITAMIN C BOOSTER CONCENTRATE 30ML	BBE1C23	Oportunidades	\N	t	2026-01-30 08:07:02.937	2026-01-30 08:07:02.937	35.94	\N
49097784-392d-4490-adb5-773e00e36071	DOC STRESS-RELIEF BI-PHASE AMPOULE 14 X1ML	BBE1C28	Oportunidades	\N	t	2026-01-30 08:07:02.937	2026-01-30 08:07:02.937	29.50	\N
dc68e8e5-3737-4036-88bd-94c8432d2e27	ULT.CALM.CREAM 200 ML	BBE1I13	Oportunidades	\N	t	2026-01-30 08:07:02.937	2026-01-30 08:07:02.937	44.78	\N
508f4ceb-3ffb-41b5-8e8e-987091ac036b	HIGH PROT. SUN STICK SPF 50 8GR	BBC1C42	Oportunidades	\N	t	2026-01-30 08:07:02.939	2026-01-30 08:07:02.939	8.06	\N
75512596-d601-4a7b-a6e2-41a7b60cdec5	AFTER SUN REPAIR LOTION 200ML	BBC1C48	Oportunidades	\N	t	2026-01-30 08:07:02.939	2026-01-30 08:07:02.939	8.55	\N
cccacd90-6d30-4d98-ac73-0bf2c61da0f5	SEACREATION EYE CREAM 15ML	BBC9C012	Oportunidades	\N	t	2026-01-30 08:07:02.94	2026-01-30 08:07:02.94	60.00	\N
959e5a31-9d95-456c-9c19-40c8abeab9ed	SHAPING CUTICLE & NAIL REPAIR 15ML	BBE5C022	Oportunidades	\N	t	2026-01-30 08:07:02.941	2026-01-30 08:07:02.941	8.00	\N
86e8a162-d673-4af2-b268-b12e61d1596b	SHAPING SHOWER FOAM 150ML	BBE5C001	Oportunidades	\N	t	2026-01-30 08:07:02.941	2026-01-30 08:07:02.941	14.83	\N
4c0f7528-b91d-4319-be60-7b353f6e125f	BALANCING SHOWER MILK 200ML	BBE5C060	Oportunidades	\N	t	2026-01-30 08:07:02.941	2026-01-30 08:07:02.941	7.40	\N
9ac32f52-5862-4e10-93fc-8eabbac54a3f	BALANCING BODY OIL 200ML	BBE5C062	Oportunidades	\N	t	2026-01-30 08:07:02.941	2026-01-30 08:07:02.941	14.25	\N
c0d05152-dfcc-4646-a6a9-f945ca5bdd23	ENERGIZING BODY FOAM 200ML	BBE5C042	Oportunidades	\N	t	2026-01-30 08:07:02.941	2026-01-30 08:07:02.941	9.55	\N
299ca63a-d1eb-4b80-8e05-97204f18dd27	SCEN.MASS.19 PEDR.	BBC4I09	Oportunidades	\N	t	2026-01-30 08:07:02.943	2026-01-30 08:07:02.943	133.01	\N
35ec38af-5c46-43a3-b7db-228fc9c988f4	MEN INSTANT ENERGY AMPOULE CONCENT. 14 ML	BBC3C105	Babor Men	\N	t	2026-01-30 08:07:02.944	2026-01-30 08:07:02.944	20.19	\N
bce1b4d4-fb44-4d75-b1d2-a7a539fd0180	TST BABOR MEN EDT N.2 100ML	BBC3PT030	Babor Men	\N	t	2026-01-30 08:07:02.944	2026-01-30 08:07:02.944	4.50	\N
82b49a62-7dc4-48f4-a44a-4150b2ef21f8	TST MEN INSTANT ENERGY AMPOULE 30ML	BBC3PT105	Babor Men	\N	t	2026-01-30 08:07:02.944	2026-01-30 08:07:02.944	6.30	\N
458fe18d-51f8-4430-bb14-e91459d8e1c3	BM VITALIZING HAIR & BODY SHAMPOO 200ML	BBC3C55	Babor Men	\N	t	2026-01-30 08:07:02.944	2026-01-30 08:07:02.944	7.40	\N
8bbfdf1b-2d19-40c3-a225-4ae8523e1009	FRESH LOOK CREAM 50 ML	BBC3C25	Babor Men	\N	t	2026-01-30 08:07:02.944	2026-01-30 08:07:02.944	7.40	\N
3bddb8fe-9d7d-4ee1-9d49-c222debe1fab	DISPLAY AGE ID FALL WINT 2017	BBAGPE007	Maquilhagem	\N	t	2026-01-30 08:07:02.945	2026-01-30 08:07:02.945	375.16	\N
c9c8a7be-69ec-4b28-a8bb-201f9e26575c	DOBLEHEATER-WAX HEATER (ZC-989N2)	CEAP015	Equipamentos	\N	t	2026-01-30 08:07:02.946	2026-01-30 08:07:02.946	40.50	\N
48d700c9-067b-4644-9233-7eebd14bc5a6	FACIAL WAXER - WAX HEATER (ZC-989Q)	CEAP017	Equipamentos	\N	t	2026-01-30 08:07:02.946	2026-01-30 08:07:02.946	42.85	\N
2f0068ce-84ef-401b-9677-3dcfcd54295f	FINEX - PARAFFIN WAX HEATER (ZC-989R)	CEAP018	Equipamentos	\N	t	2026-01-30 08:07:02.946	2026-01-30 08:07:02.946	92.80	\N
4221e37b-0f25-4af2-99b3-bad6d8f444f0	BASE DE APARELHO ROLL-ON	EPEI002	Equipamentos	\N	t	2026-01-30 08:07:02.946	2026-01-30 08:07:02.946	20.40	\N
3d84dcc3-27c6-4c3b-9ca5-304ff2cc7e11	PUNHO DE APARELHO ROLL-ON	EPEI003	Equipamentos	\N	t	2026-01-30 08:07:02.946	2026-01-30 08:07:02.946	34.70	\N
03ab3c78-c341-4f26-82fe-73153957b4cb	PANELA PARAFINA	EPEI103	Equipamentos	\N	t	2026-01-30 08:07:02.946	2026-01-30 08:07:02.946	60.00	\N
5a1c3d84-c6b4-4ee8-9fe2-946dd19d7209	PANELA DE CERA FACIAL 600GR	EPEI161	Equipamentos	\N	t	2026-01-30 08:07:02.946	2026-01-30 08:07:02.946	117.00	\N
4ac71161-21f9-428a-91a9-7d67ea61fbf9	PANELA DE CERA DE LATA 500/800 CC	EPEI162	Equipamentos	\N	t	2026-01-30 08:07:02.946	2026-01-30 08:07:02.946	64.26	\N
0683c8ec-ab40-4e68-aa1b-bd90dd45b53a	ROLL-ON MEL	EP02221	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	1.55	\N
bed66d9b-ad67-454b-86b4-b8ff25e3fb55	ROLL-ON CHOCOLATE	EP02222	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	1.55	\N
301a8488-ace3-4b65-ada1-c428ba8ae3d1	ROLON MAÇA	EP02223	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	1.55	\N
77309b4a-ba2e-4222-940f-4ff1cd0e7c7f	ROLL-ON ROSA	EP02224	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	1.55	\N
95dfc7d7-27ad-4c1d-b60d-544c6e3be56f	ROLL-ON VINHO	EP02251	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	1.55	\N
5f336c71-40a3-4163-85d7-2fae82531241	ROLLON MEL EPIFUTUR	EP02252	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	1.00	\N
c00c04af-0606-4157-95f3-5d358ff0c494	ROLLON VERDE EPIFUTUR	EP02253	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	1.00	\N
275a5b6f-640b-4adf-ab3b-b47e2f86a471	PARAFINA MÃOS E PÉS 500 GR.(C/MANTEIGA DE KARITE)	EPEI055	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	6.30	\N
b44816f8-e553-46be-b108-b88b5f61398b	ÓLEO EPIL 500ML	EPEI184	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	18.88	\N
f4e22380-c1c3-4ace-ab08-3219a9649799	CERA PÉTALAS ROSA 2KG	EPEI249	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	17.50	\N
57ce0b2c-9512-4fa5-9694-67cd5d5a5ff5	CERA MARFIM 2KG	EPEI250	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	17.50	\N
02d04d0e-7553-4098-8502-8b6ca52b8d46	PASTILHA AZUL 2 KG	EPEI252	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	17.50	\N
17c8217b-72b0-4223-927e-832e41b934f5	CERA CHOCOLATE 2KG	EPEI257	Ceras	\N	t	2026-01-30 08:07:02.948	2026-01-30 08:07:02.948	17.50	\N
452e1523-7c10-4f5d-b405-936e6c0ce54b	ROLO CERA FRIA LISO 100GR/100 M	EPEI177	Consumiveis	\N	t	2026-01-30 08:07:02.95	2026-01-30 08:07:02.95	10.64	\N
45bf606c-cc5b-4eea-be32-35efc6b0f707	PAP.MARQ.EXTRA CREP.43GRM 100M	DVVA100	Consumiveis	\N	t	2026-01-30 08:07:02.95	2026-01-30 08:07:02.95	7.14	\N
1d59a2f1-aca8-4423-8929-dc017abf50fc	PAP.MARQ.EXTRA CREP.43GRM 200M	DVVA200	Consumiveis	\N	t	2026-01-30 08:07:02.95	2026-01-30 08:07:02.95	18.84	\N
aa2f08f9-e75e-43cb-b22a-9c4d09f30c7b	ROLO MARQ.TEC.SOFT 80+ 80 M	DVVA313	Consumiveis	\N	t	2026-01-30 08:07:02.95	2026-01-30 08:07:02.95	17.40	\N
f5e320d3-04c7-4afb-8735-210e255cb6c0	PLAST.ENVOLV.0.8X0.8 80M	DVVA202	Consumiveis	\N	t	2026-01-30 08:07:02.95	2026-01-30 08:07:02.95	22.64	\N
88a3be4e-a36f-4e46-ba5c-99ed385e2b8d	DR PEN (DERMA PEN)	CEAP193	Equipamentos	\N	t	2026-01-30 08:07:02.952	2026-01-30 08:07:02.952	95.00	\N
d151d6f0-c597-4c73-8f08-c408887bd554	AGULHA Nº 24 - DR PEN (DERMA PEN)	CEAP196	Consumiveis	\N	t	2026-01-30 08:07:02.952	2026-01-30 08:07:02.952	1.25	\N
95125a22-91ab-4c18-9c5d-5ce96b75e0e9	AGULHA NANO - DR PEN (DERMA PEN)	CEAP198	Consumiveis	\N	t	2026-01-30 08:07:02.952	2026-01-30 08:07:02.952	1.25	\N
a0024021-6313-4c6f-862b-4326c06b964f	AGULHA Nº 12 - DR PEN (DERMA PEN)	CEAP199	Consumiveis	\N	t	2026-01-30 08:07:02.952	2026-01-30 08:07:02.952	1.25	\N
b4fbf6df-09ea-4b09-be1f-15bde34a9636	AGULHA Nº 36 - DR PEN (DERMA PEN)	CEAP200	Consumiveis	\N	t	2026-01-30 08:07:02.952	2026-01-30 08:07:02.952	1.25	\N
e87d789d-cbb9-4256-a38a-1c6575a1df55	PROMO FLUID ANTI-STRESS 2014 14 ML	BBF1C016*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	9.42	\N
7f2abdeb-7b6a-4cd0-93b6-a283ef7bcd5e	PROMO FLUID MOISTURE 14 ML	BBF1C023*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	7.10	\N
66e2bc5a-2a2f-4276-8cf3-a9b915dad13d	PROMO FLUID VITALITY 14 ML	BBF1C026*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.78	\N
e6eea329-ca89-468f-a320-d0a12bed1c25	ACTIVE NIGHT 7X2 ML	BBF1C031*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	13.14	\N
252b129e-1fe2-42d2-b32d-4a9562e6812e	MATTE FINISH 7X2 ML	BBF1C034*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	11.27	\N
d09b7e52-cc23-4ff2-a356-1830dabffcc1	LIFT EXPRESS 7X2ML	BBF1C038*	\N	\N	t	2026-01-21 10:16:09.521	2026-01-21 10:16:09.521	15.07	\N
d6a39c16-478f-4534-b438-94e9648c8940	SAMPLE RC PORE REFINER 2 ML	BBE1PA101	Samples	\N	t	2026-01-30 08:10:06.454	2026-01-30 08:10:06.454	1.43	\N
1064df5c-aa23-4016-8261-1533bfad797d	DB SAMPLE 3ER AMPOULE ECM REPAIR SERUM 6 ML	BBE1PA204	Samples	\N	t	2026-01-30 08:10:06.454	2026-01-30 08:10:06.454	11.90	\N
145588c9-7425-40c2-a36c-d5806cca6cdb	SAMPLE BLEMISH REDUCING CREAM 2 ML	BBE1PA303	Samples	\N	t	2026-01-30 08:10:06.454	2026-01-30 08:10:06.454	1.51	\N
aa2e478f-8bad-4d1f-a327-ba25e801db72	SAMPLE DB LIF C DUAL EYE SOLUTION (DAY+NIG) 4 ML	BBE1PA707	Samples	\N	t	2026-01-30 08:10:06.454	2026-01-30 08:10:06.454	1.73	\N
2c8e8e42-a328-444d-85a6-1e6b839d8273	TM DB LIF COLLAGEN BOOSTER CREAM RICH 3 ML	BBE1PA714	Samples	\N	t	2026-01-30 08:10:06.454	2026-01-30 08:10:06.454	3.46	\N
80d9ea1c-f3a5-4736-bc01-d7c6c43b7644	DEKOFACTISE CLEANFORMANCE	BBE1PD1000	Displays	\N	t	2026-01-30 08:10:06.454	2026-01-30 08:10:06.454	23.80	\N
9c85bd08-3a0a-498b-b241-a8907c7a5279	DECO STAND DR. BABOR SILVER (2PCS)	BBE1PD651	Displays	\N	t	2026-01-30 08:10:06.454	2026-01-30 08:10:06.454	66.28	\N
589013db-2567-4857-9ffb-b6fca46e6c6a	SET DOC MASKS DISPLAY	BBE1PE1100	Displays	\N	t	2026-01-30 08:10:06.454	2026-01-30 08:10:06.454	14.56	\N
9a213f02-ecb1-490a-8b69-7ace53b3ccf5	SHELF DISPLAY DOCTOR BABOR PRO	BBE1PE900	Displays	\N	t	2026-01-30 08:10:06.454	2026-01-30 08:10:06.454	21.09	\N
387065c6-0dd1-4d42-ac04-65bd58602928	DB HC PASSPLAKAT GB	BBE1PP010	Marketing	\N	t	2026-01-30 08:10:06.454	2026-01-30 08:10:06.454	2.16	\N
e9821d05-a5c8-4507-b881-687674efcdcf	TESTER DOC ENZYME PEEL BALM 75 ML	BBE1PT117	Testers	\N	t	2026-01-30 08:10:06.454	2026-01-30 08:10:06.454	8.65	\N
1e92e234-0031-49d4-b3fe-f99d7eece31f	TST DOC LC COLLAGEN-PEP SERUM 30 ML	BBE1PT719	Testers	\N	t	2026-01-30 08:10:06.454	2026-01-30 08:10:06.454	20.59	\N
7078ab93-8bd3-4630-807d-862242abcad3	PRESENTATION BOX NEW CUSTOMERS	BBZ1079	Marketing	\N	t	2026-01-30 08:10:06.454	2026-01-30 08:10:06.454	38.94	\N
17f529a1-2797-4835-840c-22647d8c8679	TESTER PRO RECOVER OINTMENT 50 ML	BBE1PT1100	Testers	\N	t	2026-01-30 08:10:06.51	2026-01-30 08:10:06.51	15.00	\N
c3cd3426-b635-4f44-92b0-527ccc2d026d	PRO SILICON SCHAMM (SPONGES)	BBE1PD901	Acessorios	\N	t	2026-01-30 08:10:06.51	2026-01-30 08:10:06.51	3.79	\N
6e142d85-2c84-4295-99ea-f6bdc50cf44c	PRO ACID BOWL (PETRI DISH)	BBE1PD902	Acessorios	\N	t	2026-01-30 08:10:06.51	2026-01-30 08:10:06.51	2.81	\N
c6ddadcc-70f7-46f6-bae8-68da2c7b6a22	PRO POSTER SET STANDARD	BBE1PP901	Marketing	\N	t	2026-01-30 08:10:06.51	2026-01-30 08:10:06.51	25.96	\N
1d5b95e4-2422-4b2e-bff4-cab25b1b62c9	TST PRO RETINOL CONCENTRATE A 30 ML	BBE1PT929	Testers	\N	t	2026-01-30 08:10:06.51	2026-01-30 08:10:06.51	22.88	\N
ee0f9f5d-0fca-453e-b0a5-30ed3bf5e97f	TST DOC CLEAN DEEP CLEANSING PADS 20ST	BBE1PT1002	Testers	\N	t	2026-01-30 08:10:06.512	2026-01-30 08:10:06.512	10.82	\N
cc6a2599-6bd0-4a35-9253-bdb53b0015c4	TST DOC CLEAN PHYTO CBD 24H CREAM 50 ML	BBE1PT1003	Testers	\N	t	2026-01-30 08:10:06.512	2026-01-30 08:10:06.512	8.98	\N
9a6ac941-0001-49c7-b6a7-2dbbc65005cf	TST DOC CLEAN MOISTURE GLOW GEL-CREAM 50 ML	BBE1PT1006	Testers	\N	t	2026-01-30 08:10:06.512	2026-01-30 08:10:06.512	8.33	\N
45b42cdf-51e7-41b9-91b5-e69fc012120a	TST DOC CLEAN RENEWAL OVERN MASK 75 ML	BBE1PT1007	Testers	\N	t	2026-01-30 08:10:06.512	2026-01-30 08:10:06.512	6.17	\N
10fdc3d3-5e05-4fc7-b6e6-96b1ab8ae5ad	TST DOC CLEAN REVIVAL CREAM RICH 50 ML	BBE1PT1008	Testers	\N	t	2026-01-30 08:10:06.512	2026-01-30 08:10:06.512	10.38	\N
6875b2cf-e42c-4afa-9b38-f355e54224c1	TESTER DOC CLEAN OIL-FREE CREAM 50 ML	BBE1PT1009	Testers	\N	t	2026-01-30 08:10:06.512	2026-01-30 08:10:06.512	18.93	\N
db984e78-4408-4d84-8f53-8ff25520bc6a	TESTER DOC CLEAN HERBAL BALANCING TONER 200 ML	BBE1PT1012	Testers	\N	t	2026-01-30 08:10:06.512	2026-01-30 08:10:06.512	10.82	\N
e4b630a3-f6c6-425a-a128-c9a9e7e3c4d3	SAMPLE DB REGENERATION THE CURE CREAM 5 ML	BBE1PA8104A	Samples	\N	t	2026-01-30 08:10:06.514	2026-01-30 08:10:06.514	4.00	\N
d6646fa1-70cc-4e16-b2b9-70d2f5606359	SAMPLE REGENERATION THE CURE CREAM 2 ML	BBE1PA8104B	Samples	\N	t	2026-01-30 08:10:06.514	2026-01-30 08:10:06.514	0.30	\N
76f3ebe1-9806-40a2-bd2f-b390d1fbac41	SAMPLE LIFTING DERMA FILLER SERUM 2 ML	BBE1PA8200	Samples	\N	t	2026-01-30 08:10:06.515	2026-01-30 08:10:06.515	0.34	\N
eb1945c9-4e6a-4bd6-bf78-5c1a91429495	SAMPLE LIFTING INSTANT LIFT EFFECT CREAM 2 ML	BBE1PA8204	Samples	\N	t	2026-01-30 08:10:06.515	2026-01-30 08:10:06.515	0.38	\N
1b8373ac-8bac-43ca-8049-aabaa62121f6	TESTER LIFTING DUAL EYE SOLUTION 30 ML	BBE1PT8205	Testers	\N	t	2026-01-30 08:10:06.515	2026-01-30 08:10:06.515	15.50	\N
7e26e555-cb34-4f20-889a-135c3119d01b	Sample Doctor Babor Lifting Dual Eye Solution 7 ml	BBE1PA8205	Samples	\N	t	2026-01-30 08:10:06.515	2026-01-30 08:10:06.515	1.76	\N
fb65be93-5dca-44d1-a088-bdc49c997b90	SAMPLE DB LIFTING COLLAGEN-PEPTIDE B.CREAM 2 ML	BBE1PA8202	Samples	\N	t	2026-01-30 08:10:06.515	2026-01-30 08:10:06.515	0.32	\N
d11dc661-70b4-4140-80bf-d9c495d823bf	SAMPLE DB HYDRATION 10D HYALURONIC AMP SERUM C 2ML	BBE1PA8301	Samples	\N	t	2026-01-30 08:10:06.517	2026-01-30 08:10:06.517	1.98	\N
efd2121c-2b0f-4395-bab7-e1560f121e0d	SAMPLE RESURFACE RENEWAL CREAM 2 ML	BBE1PA8404	Samples	\N	t	2026-01-30 08:10:06.518	2026-01-30 08:10:06.518	0.30	\N
8a2f0571-da7e-4798-b612-b9d533f66702	SAMPLE RESURFACE RENEWAL EYE ZONE PATCH 1 PC	BBE1PA8405	Samples	\N	t	2026-01-30 08:10:06.518	2026-01-30 08:10:06.518	2.00	\N
b8c8ebd2-9f36-414b-b8e4-17a01e33fca9	SAMPLE RESURFACE EXFOLIATING PEEL PADS 1 PC	BBE1PA8406	Samples	\N	t	2026-01-30 08:10:06.518	2026-01-30 08:10:06.518	0.70	\N
7e1d3bc9-3970-454c-83ba-aecdee13889a	TESTER RESURFACE REFINING RADIANCE SERUM 30 ML	BBE1PT8402	Testers	\N	t	2026-01-30 08:10:06.518	2026-01-30 08:10:06.518	16.50	\N
cdc4a4a2-5878-4792-86a9-e66429342d19	TESTER RESURFACE EXFOLIATING ANTIOXIDANT GEL 50 ML	BBE1PT8407	Testers	\N	t	2026-01-30 08:10:06.518	2026-01-30 08:10:06.518	22.60	\N
e882859c-70ca-4b34-b79c-5ca11eef14dc	TESTER RESURFACE DARK SPOT CORRECTING CONCENTRATE 30 ML	BBE1PT8410	Testers	\N	t	2026-01-30 08:10:06.518	2026-01-30 08:10:06.518	10.30	\N
fdc2ae42-e46b-44c6-8263-2d7d3c688d33	TESTER SENSITIVE SOOTHING CREAM CLEANSER 150 ML	BBE1PT8500	Testers	\N	t	2026-01-30 08:10:06.52	2026-01-30 08:10:06.52	5.90	\N
0d380dfd-e64e-4396-9ac0-4035ea397af6	SAMPLE DOC SENS ITCH RELIEF SERUM 2 ML	BBE1PA8502	Samples	\N	t	2026-01-30 08:10:06.52	2026-01-30 08:10:06.52	0.33	\N
f7c9151e-9d4e-4f99-881c-b418efa1235d	BACK CARD THE CURE CREAM FUR RETINOL DISPLAY	BBE1PD8800	Displays	\N	t	2026-01-30 08:10:06.521	2026-01-30 08:10:06.521	22.40	\N
ee2a1ba5-8eca-4a56-a3fb-65c89aa8c0d1	DOCTOR BABOR BASE DISPLAY	BBE1PE8801	Displays	\N	t	2026-01-30 08:10:06.521	2026-01-30 08:10:06.521	64.00	\N
4fd64c3a-7f7b-4f48-9010-adb0c2378bdf	BABOR CORE GWP BAG	BBZ1163	Marketing	\N	t	2026-01-30 08:10:06.521	2026-01-30 08:10:06.521	9.00	\N
02b3bb03-9dfd-45f7-aea5-a9e746be5698	SAMPLE DB MB MOISTURE GLOW SERUM	BBE1PA6001	Samples	\N	t	2026-01-30 08:10:06.522	2026-01-30 08:10:06.522	0.38	\N
2d0d256d-e1b8-426e-bcbc-c23b83fa5359	SAMPLE DB MB MOISTURE GLOW CREAM	BBE1PA6004	Samples	\N	t	2026-01-30 08:10:06.522	2026-01-30 08:10:06.522	0.38	\N
ddd6e3f4-2ae5-4cee-a1ac-905e46c1f2ee	SAMPLE DB MB STRESS DEFENSE CREAM	BBE1PA6005	Samples	\N	t	2026-01-30 08:10:06.522	2026-01-30 08:10:06.522	0.38	\N
c31d85bd-2446-481d-b938-35c460cb72da	TST DB MB MOISTURE GLOW SERUM	BBE1PT6001	Testers	\N	t	2026-01-30 08:10:06.522	2026-01-30 08:10:06.522	9.32	\N
c4792df5-a235-45c2-b950-a96ff6b0e8be	TST DB MB MOISTURE GLOW CREAM	BBE1PT6004	Testers	\N	t	2026-01-30 08:10:06.522	2026-01-30 08:10:06.522	9.32	\N
3e11ae21-aeed-4f90-8a74-c39bb767884d	TST DB MB STRESS DEFENSE CREAM	BBE1PT6005	Testers	\N	t	2026-01-30 08:10:06.522	2026-01-30 08:10:06.522	11.00	\N
1c0b0039-d715-4b88-b504-451e848eeb56	SAMPLE DOC PRO EXO YOUTH SERUM 2 ML	BBE1PA9000	Samples	\N	t	2026-01-30 08:10:06.523	2026-01-30 08:10:06.523	0.30	\N
c92a6387-e527-4cf4-aa8c-5ff5d2db9d1d	SAMPLE DOC PRO EXO YOUTH CREAM 2 ML	BBE1PA9001	Samples	\N	t	2026-01-30 08:10:06.523	2026-01-30 08:10:06.523	0.50	\N
ae566b55-ac84-4ac8-9daf-2eea5c354823	SAMPLE DOC PRO EXO YOUTH CREAM (LUXE) 5 ML	BBE1PA9001L	Samples	\N	t	2026-01-30 08:10:06.523	2026-01-30 08:10:06.523	6.50	\N
ab0ecf6c-52b1-44a1-895a-c8f89efb0e03	SAMPLE DOC PRO LONGEVITY SERUM 2 ML	BBE1PA9002	Samples	\N	t	2026-01-30 08:10:06.523	2026-01-30 08:10:06.523	0.30	\N
7654e1e8-a089-4c1d-87f1-3747a3bec97d	SAMPLE DOC PRO HYD. ACID PLUMPING SERUM 2 ML	BBE1PA9003	Samples	\N	t	2026-01-30 08:10:06.523	2026-01-30 08:10:06.523	0.30	\N
431fa678-03ac-4cbd-82fb-4de98a4ce455	SAMPLE DOC PRO ENERGY ACTIV ESSENCE 3 ML	BBE1PA9005	Samples	\N	t	2026-01-30 08:10:06.523	2026-01-30 08:10:06.523	0.30	\N
40118977-2ee5-4d4d-8ce7-67270d4ab41d	SAMPLE DOC PRO BARRIER RESI.TONER 3 ML	BBE1PA9007	Samples	\N	t	2026-01-30 08:10:06.523	2026-01-30 08:10:06.523	0.30	\N
a90e676e-3f24-4665-b601-1af2bc280c00	SAMPLE DOC PRO VITAMIN B CALMING SERUM 2 ML	BBE1PA9008	Samples	\N	t	2026-01-30 08:10:06.523	2026-01-30 08:10:06.523	0.30	\N
19b4fe77-1da5-4c47-8284-9780f37d5880	SAMPLE DOC PRO DERMA CONTROL SERUM 2 ML	BBE1PA9009	Samples	\N	t	2026-01-30 08:10:06.523	2026-01-30 08:10:06.523	0.30	\N
bd317db4-0e18-482c-93ab-97a7d1403898	SAMPLE DOC PRO VITAMIN C-20 SERUM 2 ML	BBE1PA9011	Samples	\N	t	2026-01-30 08:10:06.523	2026-01-30 08:10:06.523	0.34	\N
44995916-307d-4854-92c3-1fd0107bbc71	SAMPLE DOC PRO SENSITIVE EMUGEL 2 ML	BBE1PA9013	Samples	\N	t	2026-01-30 08:10:06.523	2026-01-30 08:10:06.523	0.30	\N
03810334-aea9-449a-8e22-71d67c31fd84	SAMPLE DOC PRO DERMA CONTROL EMULSION 2 ML	BBE1PA9014	Samples	\N	t	2026-01-30 08:10:06.523	2026-01-30 08:10:06.523	0.34	\N
5c3f0ebf-6a0f-4f91-a54a-20919875e6a7	SAMPLE DOC PRO SKIN TONE B EYE CREAM 2 ML	BBE1PA9017	Samples	\N	t	2026-01-30 08:10:06.523	2026-01-30 08:10:06.523	0.30	\N
d833608d-01f9-4545-b8d7-93246650c9c7	PRO DECORATION SET LAUNCH	BBE1PD9000	Displays	\N	t	2026-01-30 08:10:06.525	2026-01-30 08:10:06.525	13.00	\N
488f2a35-8d75-4f82-b716-afdf632dbdb4	DOC PRO SILICONE BRUSHES 2 PCS	BBE1PD9001	Acessorios	\N	t	2026-01-30 08:10:06.525	2026-01-30 08:10:06.525	8.18	\N
d7caceb1-9925-4abe-b400-c1794b071502	DOC PRO BACKWALL DISPLAY	BBE1PE9000	Displays	\N	t	2026-01-30 08:10:06.525	2026-01-30 08:10:06.525	38.00	\N
30bb6aa0-bdd0-412b-8af8-4aa6f7125535	DOC PRO COUNTER DISPLAY	BBE1PE9050	Displays	\N	t	2026-01-30 08:10:06.525	2026-01-30 08:10:06.525	70.00	\N
7c0552e5-7885-40b1-93ba-bf74a38d42f8	TESTER DOC PRO EXO YOUTH SERUM 30 ML	BBE1PT9000	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	36.90	\N
ede41ecc-4a2f-4b9a-be77-e8b1bb414212	TESTER DOC PRO EXO YOUTH CREAM 50 ML	BBE1PT9001	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	36.90	\N
b25e097d-0f20-4fc4-b560-b2f5ac81a470	TESTER DOC PRO LONGEVITY SERUM 30 ML	BBE1PT9002	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	36.90	\N
b165adfb-9ac0-4b52-9555-f4adadea70ec	TESTER DOC PRO HYDRATION ACID PLUMP. SERUM 50 ML	BBE1PT9003	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	26.75	\N
08c3dc07-919b-4fac-9488-61c65880a188	TESTER DOC PRO BALANCING OINTMENT CLEANSER 150 ML	BBE1PT9004	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	10.70	\N
d3bad40c-7b1a-4552-9a76-83ce526e034b	TESTER DOC PRO ENERGY ACTIV ESSENCE 100 ML	BBE1PT9005	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	12.30	\N
0b021d4a-1e4c-44f1-b3e7-9aa2117155f0	TESTER DOC PRO O.ACID PEEL PH4 L-ON 50 ML	BBE1PT9006	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	20.50	\N
2c34193d-030d-4406-9e99-a7428245d986	TESTER DOC PRO BARRIE RESIL TON SPRAY 130 ML	BBE1PT9007	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	6.50	\N
b46fc5d3-b5cf-4ab7-9b7a-50c9f5da33ab	TESTER DOC PRO VITAMIN B CALMING SERUM 30 ML	BBE1PT9008	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	27.65	\N
658ab78b-eee4-41ae-a36f-ae3453b753cb	TESTER DOC PRO DERMA CONTROL SERUM 30 ML	BBE1PT9009	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	27.65	\N
e904fec2-59e5-4552-908c-48471427927b	TESTER DOC PRO RETINOL REFINING SERUM 30 ML	BBE1PT9010	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	35.35	\N
f5060787-858f-4ab7-9c26-066c472fcb01	TESTER DOC PRO VITAMIN C-20 SERUM 30 ML	BBE1PT9011	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	35.35	\N
9029a6cd-85cd-401e-8581-fbcec72659bd	TESTER DOC PRO SENSITIVE EMUGEL 50 ML	BBE1PT9013	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	24.60	\N
c8a25a18-0b4e-4bd5-90d5-6e685ed37094	TESTER DOC PRO DERMA CONTROL EMULSION 50 ML	BBE1PT9014	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	17.65	\N
8da702bb-7330-4dd9-860c-0926a68e8ff2	TESTER DOC PRO HYDRATION RECOV.OINTMENT 50 ML	BBE1PT9015	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	13.80	\N
25014d06-cb9e-4c3a-bd4d-15c520517099	TESTER DOC PRO ANTI BALM SPF50+ 50 ML	BBE1PT9016	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	13.80	\N
453a7f2a-21cc-41af-8525-6e4a759f0686	TESTER DOC PRO SKIN TONE BAL.EYE CREAM 15 ML	BBE1PT9017	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	30.75	\N
4a946bb1-4fb6-492c-a5ea-439f7f67161b	TESTER DOC PRO SKIN TONE BALANCING CREAM 50 ML	BBE1PT9018	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	30.75	\N
5d53e7ac-0c84-4821-ad69-978536024b5c	TESTER DOC PRO RICH MENO CREAM MASK 50 ML	BBE1PT9020	Testers	\N	t	2026-01-30 08:10:06.528	2026-01-30 08:10:06.528	21.50	\N
91198ca2-fb11-46da-93db-0197388879ce	AQUA SENSE HYALURONIC SPF50 5 ML	SKVPA001	Samples	\N	t	2026-01-30 08:10:06.53	2026-01-30 08:10:06.53	1.70	\N
6d0012e8-b5f9-4e35-b4fa-abb5fc6ddf8c	GLOW SENSE SPF50 5 ML	SKVPA002	Samples	\N	t	2026-01-30 08:10:06.53	2026-01-30 08:10:06.53	1.70	\N
bbea3ca2-fd26-4fce-b7d4-5110a407deeb	EVEN SENSE SPF50 5 ML	SKVPA003	Samples	\N	t	2026-01-30 08:10:06.53	2026-01-30 08:10:06.53	1.70	\N
b9f9c6c0-dbc4-4938-b083-e7148e2f6e7b	TRANSPARENT SENSE SPF50+ 5 ML	SKVPA004	Samples	\N	t	2026-01-30 08:10:06.53	2026-01-30 08:10:06.53	2.10	\N
ca1f95af-15f8-45a8-97b0-2d5db8a3c3f8	AQUA SENSE HYALURONIC SPF50 50 ML	SKVPT001	Testers	\N	t	2026-01-30 08:10:06.53	2026-01-30 08:10:06.53	8.66	\N
56409e77-3370-4c93-a676-ffe2f5890e73	GLOW SENSE SPF50 50 ML	SKVPT002	Testers	\N	t	2026-01-30 08:10:06.53	2026-01-30 08:10:06.53	8.66	\N
71bccdef-6241-4563-b38d-a3eedf021854	EVEN SENSE SPF50 5 ML	SKVPT003	Testers	\N	t	2026-01-30 08:10:06.53	2026-01-30 08:10:06.53	8.66	\N
73856cd9-a0f4-400a-b45e-3bb505ec1a12	TRANSPARENT SENSE SPF50+ 50 ML	SKVPT004	Testers	\N	t	2026-01-30 08:10:06.53	2026-01-30 08:10:06.53	11.04	\N
88597c50-9613-4710-a172-bb27597e3022	INVISIBLE SENSE SPRAY SPF50+ 200 ML	SKVPT005	Testers	\N	t	2026-01-30 08:10:06.53	2026-01-30 08:10:06.53	8.08	\N
49ad5ead-d1fa-4bac-9c69-25c407f3c569	SKINVISIBLES TESTER DISPLAY	SKVPE001	Displays	\N	t	2026-01-30 08:10:06.53	2026-01-30 08:10:06.53	38.00	\N
cd0bbbb0-4ef0-4ea0-84e9-574dde8aa7f8	FITA P/CABELO 10X60 CM, BRANCO C/BORDAD	BBPMT001	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	4.94	\N
6fa28538-dad1-4b23-8cc7-45ab587aa451	ROUPAO BRANCO C/BORDADO	BBPMT002	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	46.20	\N
832a6920-4aeb-4b36-a1f9-c4d8d8b54e83	TOALHAO MARQUESA 100X220CM C/BORDADO	BBPMT003	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	31.88	\N
722fb0d2-df4f-439e-b945-c3908a5ca87a	TOALHAO BANHO 70X140 CM C/BORDADO	BBPMT004	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	15.14	\N
1e009b6e-13e5-4463-a57f-9978f4403b1e	TOALHA 50X100 CM C/BORDADO	BBPMT005	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	8.64	\N
8fcb7442-6be0-455a-b86e-49e68644c8e8	TOALHETE 30X50CM	BBPMT016	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	2.40	\N
e4abdf26-c4f7-4c3d-a69d-6d20dddd07a4	SAIDA DE BANHO 50X70 C/BORDADO	BBPMT007	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	9.64	\N
873f6652-908e-466d-b85e-fef70abe2768	CHINELOS S/BORDADO	BBPMT009	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	6.48	\N
ce87fb8b-8a65-4cc7-ba6f-f8d34df723a4	MANTA POLAR 240 X 180 CM	BBPMT010	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	42.82	\N
92977e7f-4525-43fd-a390-7768f447f533	BATA BABOR XS (38)	BBPMT038	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	47.52	\N
1101a8c5-fcf5-4290-8f7f-47c437d744c0	BATA BABOR S (40)	BBPMT040	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	47.52	\N
9c207d04-7420-44fe-9e0a-eb1af83f1291	BATA BABOR M (42)	BBPMT042	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	47.52	\N
6bcbab2c-0baf-4d69-9a54-c3f360bcbb3e	BATA BABOR L (44)	BBPMT044	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	47.52	\N
f2377b01-1b80-485f-ab75-8f6dcc17d500	BATA BABOR XL (46)	BBPMT046	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	47.52	\N
36057f32-8976-4d25-97de-ddfb96cae36e	BATA BABOR XXL (48)	BBPMT048	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	47.52	\N
1715915c-4670-47c9-9143-182a5e573766	BATA BABOR XXXL(52)	BBPMT052	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	47.52	\N
9c09af3b-548e-4354-9292-15f30040a4de	CALCA SOFIA 42	BBPMT014	Texteis	\N	t	2026-01-30 08:10:06.532	2026-01-30 08:10:06.532	86.13	\N
081f238d-0c82-442b-bb39-56ce541c03c1	FICHA DE CLIENTE - ROSTO/CORPO	BBOT001	Outros	\N	t	2026-01-30 08:10:06.535	2026-01-30 08:10:06.535	0.19	\N
3e45ce9d-5ce2-4739-b77f-f262929c7cb3	PLACA ABERTO/FECHADO BABOR	BBOT009	Outros	\N	t	2026-01-30 08:10:06.535	2026-01-30 08:10:06.535	1.95	\N
f1304f1d-24ef-46df-b195-9fafc7881c20	VOUCHER OFERTA BABOR	BBPM301	Outros	\N	t	2026-01-30 08:10:06.535	2026-01-30 08:10:06.535	0.70	\N
c322198f-c099-412e-a6fd-a8c2edad1eb5	SACOS DE PAPEL BABOR	BBPS200	Outros	\N	t	2026-01-30 08:10:06.535	2026-01-30 08:10:06.535	0.29	\N
5f169781-b1f6-452f-bae0-ad65ae8f036a	BALLPOINT BABOR SEMINAR	BBZ1035	Outros	\N	t	2026-01-30 08:10:06.535	2026-01-30 08:10:06.535	0.67	\N
b84868d0-bc7a-4eba-9a0e-1f8cf59e7ec4	NOTEPAD BABOR	BBZ1036	Outros	\N	t	2026-01-30 08:10:06.535	2026-01-30 08:10:06.535	2.94	\N
9f6657f8-f91f-40ea-960d-3b696514d086	BABOR PAPERBAG BASIC	BBZ1116	Outros	\N	t	2026-01-30 08:10:06.535	2026-01-30 08:10:06.535	0.30	\N
5e577e62-ee3d-4216-b64c-954588fa0d4d	BABOR BIG BAG	BBZ1171	Outros	\N	t	2026-01-30 08:10:06.535	2026-01-30 08:10:06.535	2.34	\N
\.


--
-- Data for Name: Prospecto; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Prospecto" (id, "nomeEmpresa", "tipoNegocio", website, facebook, instagram, "nomeContacto", "cargoContacto", telefone, email, morada, cidade, "codigoPostal", latitude, longitude, estado, "dataUltimoContacto", "proximaAccao", "dataProximaAccao", notas, fonte, ativo, "createdAt", "updatedAt", "userId") FROM stdin;
cmkpcxir30003010as3xri7vp	Test Prospecto Updated	Salao	\N	\N	\N	Maria Test	\N	912345678	prospecto@test.com	\N	\N	\N	\N	\N	CONTACTADO	\N	\N	\N	\N	\N	f	2026-01-22 11:17:10.575	2026-01-22 11:17:11.111	cmkcnpx190000ogntlfp1peol
cmkqsd6h50007010g7dd4jrbf	Bia Lacerda Cabeleireiros	Estética	https://esteticaleticiasilva	\N	 @estetica_leticia_silva	Letícia Silva	\N	937176888	leticiadssilva240@gmail.com	Largo dos Condes da Ericeira 9 A	Ericeira	2655-272	38.9644225	-9.4167185	CONTACTADO	\N	ligar	2026-01-23 00:00:00	Já tinha ouvido falar da marca gostou bastante e tem interesse em introduzir a marca. Enviar simulação de produtos da linha HRS e Sensitive com e sem produtos de v.p.	\N	t	2026-01-23 11:17:01.577	2026-01-23 11:32:20.083	cmkcnpx190000ogntlfp1peol
cmkqwfefv00170121fnelm5ll	Andreia Barbosa Cabeleireiro e Estética	Estética	\N	\N	@andreiabce	Pedro	\N	914339892	andreiabarbosa@gmail.com	Av . da Liberdade 16 B	Odivelas	2620-315	38.805693	-9.1851782	REUNIAO	\N	Apresentação Babor	2026-01-27 00:00:00	\N	\N	t	2026-01-23 13:10:43.675	2026-01-23 13:10:43.675	cmkcnpx190000ogntlfp1peol
cmkv13v1000c801zslp9xij13	!TU Beauty Zone	Estética	\N	\N	@tu.beauty_zone	Ivanna	\N	914764081	\N	Praça dos Navegantes 13	Ericeira	2655-320	\N	\N	CONTACTADO	\N	Não tem interesse	2026-01-08 00:00:00	\N	\N	t	2026-01-26 10:32:48.083	2026-01-26 10:32:48.083	cmkcnpx190000ogntlfp1peol
cmkv53pve00c901zsohh83mjz	Amor Perfeito Beleza e Eventos	Estética	\N	\N	@amor.perfeito.beleza	\N	\N	964040506	\N	Largo Casal Vistoso 2 loa 5	Areeiro	1900-142	38.7427745	-9.1314185	NOVO	\N	Visitar	\N	\N	\N	t	2026-01-26 12:24:39.865	2026-01-26 12:27:59.82	cmkcnpx190000ogntlfp1peol
cmkv0f4qv00c701zstd2ufvik	Madalena Neves Estética	estetica	\N	\N	@madalenanevesestetica	Madalena Neves	\N	934479687	\N	Avenida 25 de Abril	Odivelas	\N	\N	\N	PERDIDO	2026-01-27 10:56:06.474	Não quer fazer introduções, de momento não tem interesse. 	2026-01-07 00:00:00	Foi aluna do CEN, já ouviu falar da marca. Ficou de experimentar as amostras 	\N	t	2026-01-26 10:13:34.279	2026-01-27 10:56:06.477	cmkcnpx190000ogntlfp1peol
cmkquzm86001701w3rub327u9	SF Estética Facial Corporal	Estética	\N	\N	 @esteticafacialcorporal	Sandra Ferreira	\N	935997737	sandra.ferr3011@gmail.com	Rua Vieira da Silva 11 B 	Odivelas	2675-214	38.8001151	-9.1800749	PERDIDO	2026-01-27 10:56:13.101	Não tem interesse	0026-01-23 00:00:00	Conhece a marca de momento tem outras marcas e não tem interesse. Se precisar retorna o contacto	\N	t	2026-01-23 12:30:27.654	2026-01-27 10:56:13.104	cmkcnpx190000ogntlfp1peol
cmkzdfln7002k01zikyuvegrh	Centro D'Estetica Rita Massano	Estetica 	\N	\N	\N	Rita Massano	Proprietária 	968045530	\N	Rua de Entrecampos 48 R/C drt	Lisboa	1700-159	38.7469568	-9.1466316	PERDIDO	\N	\N	2026-01-29 00:00:00	Não tem interesse , é fiel as marcas que usa	\N	t	2026-01-29 11:28:55.89	2026-01-29 11:28:55.89	cmkcnpx190000ogntlfp1peol
cmkzeavml000001wt94smfwa6	Estudio 86	Cabeleireiro- estetica 	\N	\N	\N	Fernanda	Esteticista 	213140669	\N	Av. Duque de Ávila 86	Lisboa	1050-084	38.7352204	-9.1503712	CONTACTADO	\N	Aguardar feedback	2026-01-29 00:00:00	Fernanda, tirou formação no CEN, de momento está a experimentar outras marcas. Liga se tiver interesse	\N	t	2026-01-29 11:53:15.12	2026-01-29 11:53:15.12	cmkcnpx190000ogntlfp1peol
cmkzefh1i000101wtu1phur1r	Corpo e Alma	Estetica 	\N	\N	\N	Fátima 	Esteticista 	927580801	\N	Rua António Enes 8	Lisboa	1050-023	38.7342254	-9.1476394	PERDIDO	\N	Não tem interesse 	2026-01-29 00:00:00	Não está interessada	\N	t	2026-01-29 11:56:49.542	2026-01-29 11:56:49.542	cmkcnpx190000ogntlfp1peol
cmkzeksjf000001x6o11sc89o	Cosmo Clinic	Estetica 	\N	\N	\N	Sabrina	Esteticista 	935085990	\N	Rua Filipe Folque 30 C	Lisboa 	\N	38.7349787	-9.1478939	PERDIDO	\N	\N	2026-01-29 00:00:00	A clínica não faz tratamentos com cosmetica apenas injectáveis. 	\N	t	2026-01-29 12:00:57.692	2026-01-29 12:00:57.692	cmkcnpx190000ogntlfp1peol
cmkzes9as000101x6370i8ibf	Noemie Flor Estética 	Estetica 	\N	\N	\N	Noemi Flor	Proprietária 	963781880	\N	Av Duque de Ávila  28 2o andrar sala 211	Lisboa	1000-141	38.7351499	-9.1520215	CONTACTADO	\N	Ligar as 13.30h	2026-01-29 00:00:00	\N	\N	t	2026-01-29 12:06:46.036	2026-01-29 12:06:46.036	cmkcnpx190000ogntlfp1peol
\.


--
-- Data for Name: ProspectoTactic; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ProspectoTactic" (id, "prospectoId", tactics, provider, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ReconciliacaoMensal; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."ReconciliacaoMensal" (id, mes, ano, "nomeArquivo", "caminhoArquivo", "dataInicio", "dataFim", "totalBrutoPdf", "totalDescontosPdf", "totalLiquidoPdf", "totalSistema", diferenca, "totalItens", "itensCorretos", "itensComProblema", estado, notas, "dataUpload", "dataRevisao", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RotaSalva; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."RotaSalva" (id, nome, data, "origemLatitude", "origemLongitude", "origemEndereco", locais, "distanciaTotal", "duracaoTotal", concluida, "createdAt", "updatedAt", paragens, "custoPortagens", "numPortagens", "custoCombuistivel", "consumoMedio", "precoLitro", "custoEstacionamento", "custoTotal", "custoReal", "notasCustos", "userId") FROM stdin;
\.


--
-- Data for Name: Tarefa; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Tarefa" (id, titulo, descricao, tipo, prioridade, estado, "dataVencimento", "dataLembrete", "dataConclusao", "clienteId", "prospectoId", "createdAt", "updatedAt", "userId") FROM stdin;
cml0noc0h000001wxb87v7089	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 09:03:24.723	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 09:03:25.648	2026-01-30 09:03:25.648	\N
cml0noc39000101wxyrgdo1qu	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 09:03:24.723	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 09:03:25.749	2026-01-30 09:03:25.749	\N
cml0noc61000201wx6ows0v6k	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 09:03:24.723	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 09:03:25.849	2026-01-30 09:03:25.849	\N
cml12ddzc000f01va0f3ntf1x	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 7 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 15:54:48.787	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 15:54:49.223	2026-01-30 15:54:49.223	\N
cml12de3l000g01vaw1qi8irk	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 7 dias sem actualizacao.	Telefonema	ALTA	PENDENTE	2026-01-31 15:54:48.787	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 15:54:49.377	2026-01-30 15:54:49.377	\N
cml12de4s000h01vayg4eumfb	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 15:54:48.787	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 15:54:49.42	2026-01-30 15:54:49.42	\N
cmkn6k6k1000001wutm4cjlwp	Contactar ANA CRISTINA CHAGAS	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkk3ocbv000101vjx115msl5	\N	2026-01-20 22:43:18.193	2026-01-20 22:43:18.193	cmkcnpx190000ogntlfp1peol
cml0o16x300000106lmn8cvqc	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 09:13:23.082	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 09:13:25.574	2026-01-30 09:13:25.574	\N
cml0o170500010106nf51zr6v	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 09:13:23.082	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 09:13:25.685	2026-01-30 09:13:25.685	\N
cml0o173600020106a4loghhu	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 09:13:23.082	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 09:13:25.794	2026-01-30 09:13:25.794	\N
cml15di97000001xndoffsgnw	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 7 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 17:18:50.355	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 17:18:53.61	2026-01-30 17:18:53.61	\N
cml15diew000101xnngajrddr	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 7 dias sem actualizacao.	Telefonema	ALTA	PENDENTE	2026-01-31 17:18:50.355	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 17:18:53.816	2026-01-30 17:18:53.816	\N
cml15dik5000201xnrnolr415	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 17:18:50.355	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 17:18:54.005	2026-01-30 17:18:54.005	\N
cmkon0373002m01wm0hm4yo5l	Contactar Olga Pimentel	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-24 23:11:20.286	\N	\N	cmkomlf4i002j01wmrnup3tb8	\N	2026-01-21 23:11:20.367	2026-01-21 23:11:20.367	cmkcnpx190000ogntlfp1peol
cml0ocz8000060106nhzzqvo3	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 09:22:34.475	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 09:22:35.472	2026-01-30 09:22:35.472	\N
cml0oczau0007010654m38jsq	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 09:22:34.475	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 09:22:35.574	2026-01-30 09:22:35.574	\N
cml0oczd500080106i1vrv2xb	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 09:22:34.475	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 09:22:35.657	2026-01-30 09:22:35.657	\N
cml15rv63000501xnxuakzqow	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 7 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 17:30:02.125	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 17:30:03.531	2026-01-30 17:30:03.531	\N
cml15rv86000601xncsbkgv9a	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 7 dias sem actualizacao.	Telefonema	ALTA	PENDENTE	2026-01-31 17:30:02.125	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 17:30:03.605	2026-01-30 17:30:03.605	\N
cml15rv8e000701xntnowmvms	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 17:30:02.125	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 17:30:03.614	2026-01-30 17:30:03.614	\N
cml0odr7r000c01066qu8lni8	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 09:23:11.051	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 09:23:11.751	2026-01-30 09:23:11.751	\N
cml0odrb8000d0106o09fawuw	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 09:23:11.051	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 09:23:11.876	2026-01-30 09:23:11.876	\N
cml0odre0000e01066r718nuo	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 09:23:11.051	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 09:23:11.975	2026-01-30 09:23:11.975	\N
cml15yh4f000001ykkthd8kp4	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 7 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 17:35:05.309	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 17:35:11.918	2026-01-30 17:35:11.918	\N
cml15yh5u000101ykqbpfspeo	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 7 dias sem actualizacao.	Telefonema	ALTA	PENDENTE	2026-01-31 17:35:05.309	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 17:35:11.97	2026-01-30 17:35:11.97	\N
cml15yh8p000201ykyg9u8m1t	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 17:35:05.309	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 17:35:12.073	2026-01-30 17:35:12.073	\N
cml0tnayp000001vc8q1p8hib	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 7 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 11:50:32.032	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 11:50:35.329	2026-01-30 11:50:35.329	\N
cml0tnb1h000101vczb70r6ya	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 11:50:32.032	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 11:50:35.429	2026-01-30 11:50:35.429	\N
cml0tnb71000201vcxnmdbren	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 11:50:32.032	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 11:50:35.628	2026-01-30 11:50:35.628	\N
cml17z4gp0000012fbwucz5f5	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 7 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 18:31:40.299	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 18:31:41.401	2026-01-30 18:31:41.401	\N
cml17z4jg0001012fv2i3vntw	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 7 dias sem actualizacao.	Telefonema	ALTA	PENDENTE	2026-01-31 18:31:40.299	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 18:31:41.5	2026-01-30 18:31:41.5	\N
cml17z4l40002012fi3btuzwf	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 18:31:40.299	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 18:31:41.56	2026-01-30 18:31:41.56	\N
cml0u2r7n000001wmwmsrpqu5	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 7 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 12:02:33.132	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 12:02:36.227	2026-01-30 12:02:36.227	\N
cml0u2rd8000101wmfru665bd	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 12:02:33.132	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 12:02:36.428	2026-01-30 12:02:36.428	\N
cml0u2rj1000201wm36dg73pt	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 12:02:33.132	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 12:02:36.637	2026-01-30 12:02:36.637	\N
cml17zvmg0005012feyy54r1b	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 7 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 18:32:16.202	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 18:32:16.6	2026-01-30 18:32:16.6	\N
cml17zvp70006012fr4cd747s	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 7 dias sem actualizacao.	Telefonema	ALTA	PENDENTE	2026-01-31 18:32:16.202	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 18:32:16.699	2026-01-30 18:32:16.699	\N
cml17zvqu0007012fdah6a538	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 18:32:16.202	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 18:32:16.757	2026-01-30 18:32:16.757	\N
cml0xxoy9000001va6iarp90a	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 7 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 13:50:36.577	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 13:50:38.48	2026-01-30 13:50:38.48	\N
cml0xxp3s000101va0filtf89	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 7 dias sem actualizacao.	Telefonema	ALTA	PENDENTE	2026-01-31 13:50:36.577	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 13:50:38.68	2026-01-30 13:50:38.68	\N
cml0xxp6k000201vaxcyiazpg	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 13:50:36.577	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 13:50:38.78	2026-01-30 13:50:38.78	\N
cml1aj4820000011lf2g4482t	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 7 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 19:43:11.64	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 19:43:13.442	2026-01-30 19:43:13.442	\N
cml1aj4fz0001011llvkx26m4	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 7 dias sem actualizacao.	Telefonema	ALTA	PENDENTE	2026-01-31 19:43:11.64	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 19:43:13.727	2026-01-30 19:43:13.727	\N
cml1aj4tu0002011l86nv8dq1	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 19:43:11.64	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 19:43:14.226	2026-01-30 19:43:14.226	\N
cml0z3vgr000501vazc6oe6go	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 7 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 14:23:24.505	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 14:23:26.474	2026-01-30 14:23:26.474	\N
cml0z3vqc000601vad4e18djm	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 7 dias sem actualizacao.	Telefonema	ALTA	PENDENTE	2026-01-31 14:23:24.505	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 14:23:26.82	2026-01-30 14:23:26.82	\N
cml0z3w4f000701vauln81iw0	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 14:23:24.505	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 14:23:27.327	2026-01-30 14:23:27.327	\N
cmkn6k6mz000101wueqel5pf5	Contactar SPIRIT DAY SPA- MELISSA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkcnpxd40038ogntjuwfp2oj	\N	2026-01-20 22:43:18.299	2026-01-20 22:43:18.299	cmkcnpx190000ogntlfp1peol
cmkn6k6p9000201wub3robfft	Contactar GLAMOUR	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkcnpx38000fognt09x3o61e	\N	2026-01-20 22:43:18.38	2026-01-20 22:43:18.38	cmkcnpx190000ogntlfp1peol
cmkn6k6s4000301wue65sjmfz	Contactar IVONE RAMOS	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkcnpx4n0010ogntlgsvrd29	\N	2026-01-20 22:43:18.483	2026-01-20 22:43:18.483	cmkcnpx190000ogntlfp1peol
cmkn6k6ux000401wuf4tk0k2j	Contactar FILIPA DANIELA PEREIRA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkk4k9ba000501vj4ybqtwvg	\N	2026-01-20 22:43:18.585	2026-01-20 22:43:18.585	cmkcnpx190000ogntlfp1peol
cmkn6k70c000501wu0gyxnzt4	Contactar PAULA SANTANA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkcnpx5p0019ognt0dfjus98	\N	2026-01-20 22:43:18.78	2026-01-20 22:43:18.78	cmkcnpx190000ogntlfp1peol
cmkn6k75o000601wuw37v56g4	Contactar Pura Beleza	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkcnpx3c000hogntfv3f1nr9	\N	2026-01-20 22:43:18.972	2026-01-20 22:43:18.972	cmkcnpx190000ogntlfp1peol
cmkn6k78o000701wu2jut6gq7	Contactar FISIBELA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkcnpx3g000jogntg4abd8u8	\N	2026-01-20 22:43:19.08	2026-01-20 22:43:19.08	cmkcnpx190000ogntlfp1peol
cmkn6k7bu000801wusbu7mkea	Contactar AGILREQUINTE	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkk41coe000301vjs2ey859r	\N	2026-01-20 22:43:19.193	2026-01-20 22:43:19.193	cmkcnpx190000ogntlfp1peol
cmkn6k7ek000901wub71fu5qs	Contactar SANDRA LUZ - DEZ STUDIO	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkk57s2v000f01vjpcw5edlt	\N	2026-01-20 22:43:19.291	2026-01-20 22:43:19.291	cmkcnpx190000ogntlfp1peol
cmkn6k835000a01wuffxtzdjh	Contactar Silkare	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd2khtw0003pontk0fsp8w4	\N	2026-01-20 22:43:20.177	2026-01-20 22:43:20.177	cmkcnpx190000ogntlfp1peol
cmkn6k8c1000b01wubpcafb3m	Contactar Isaura	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd2khu20005pontjgu03va8	\N	2026-01-20 22:43:20.497	2026-01-20 22:43:20.497	cmkcnpx190000ogntlfp1peol
cmkn6k8k2000c01wuar8qwit4	Contactar MARIA TERESA PINHO DUARTE	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsti0000cynty9veowk8	\N	2026-01-20 22:43:20.786	2026-01-20 22:43:20.786	cmkcnpx190000ogntlfp1peol
cmkn6k8mv000d01wu7ll68l72	Contactar TRINDADE DA COSTA LUIS	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qstz0001cynts3nac09o	\N	2026-01-20 22:43:20.887	2026-01-20 22:43:20.887	cmkcnpx190000ogntlfp1peol
cmkn6k931000e01wuc8zqffkt	Contactar PAULA GRACA J.SILVA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsu40002cyntmtwkbs8f	\N	2026-01-20 22:43:21.469	2026-01-20 22:43:21.469	cmkcnpx190000ogntlfp1peol
cmkn6k9jw000g01wu5vydxlnq	Contactar INSTITUTO DE BELEZA CAB.LDA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsu70003cyntf50v98ro	\N	2026-01-20 22:43:22.076	2026-01-20 22:43:22.076	cmkcnpx190000ogntlfp1peol
cmkn6k9pk000h01wuj5zwehox	Contactar LURDES MARTA-ESTETICA E PERFUMARIA, LDA.	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsu90004cyntoujdyvh6	\N	2026-01-20 22:43:22.28	2026-01-20 22:43:22.28	cmkcnpx190000ogntlfp1peol
cmkn6k9vo000i01wuw48gtd95	Contactar LUCIA BATISTA UNIPESSOAL LDA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsug0007cynt78amxldi	\N	2026-01-20 22:43:22.5	2026-01-20 22:43:22.5	cmkcnpx190000ogntlfp1peol
cmkn6k9yb000j01wuvira7hfd	Contactar ANA MARIA MAIA VILAS	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsui0008cynt0g8nss02	\N	2026-01-20 22:43:22.594	2026-01-20 22:43:22.594	cmkcnpx190000ogntlfp1peol
cmkn6ka0r000k01wuiqmiexy6	Contactar ANABELA DOMINGUES PEREIRA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsul0009cynts5akpdj7	\N	2026-01-20 22:43:22.683	2026-01-20 22:43:22.683	cmkcnpx190000ogntlfp1peol
cmkn6ka3e000l01wugv395edj	Contactar ANDREIA DORIA ALVES ALFREDO BENTO	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsun000acyntg6r2psqb	\N	2026-01-20 22:43:22.778	2026-01-20 22:43:22.778	cmkcnpx190000ogntlfp1peol
cmkn6ka8x000m01wufnw76bw9	Contactar SILVIA RODRIGUES NETO	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkcnpx500013ogntjiccf4oy	\N	2026-01-20 22:43:22.977	2026-01-20 22:43:22.977	cmkcnpx190000ogntlfp1peol
cmkn6kabn000o01wugpa6ulf2	Contactar TERESA LEONOR FAIA PEREIRA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsur000ccyntanbgl2cn	\N	2026-01-20 22:43:23.075	2026-01-20 22:43:23.075	cmkcnpx190000ogntlfp1peol
cmkn6kabx000p01wu9ttqgilp	Contactar KRISTELL DA GRAÇA RODRIGUES RIBEIRO	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsuy000fcynt35aeoahl	\N	2026-01-20 22:43:23.085	2026-01-20 22:43:23.085	cmkcnpx190000ogntlfp1peol
cmkn6kaec000q01wuu1n6lyyc	Contactar CARLA FERREIRA, SAUDE E BELEZA, UNIPESSOAL LDA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsv3000hcynt4kn5cdz6	\N	2026-01-20 22:43:23.172	2026-01-20 22:43:23.172	cmkcnpx190000ogntlfp1peol
cmkn6kai0000r01wujq1jm0i1	Contactar JOANA SIMÕES 	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkcnpxa3002bogntjck4ynlc	\N	2026-01-20 22:43:23.304	2026-01-20 22:43:23.304	cmkcnpx190000ogntlfp1peol
cmkn6kak0000s01wukdw9p6i6	Contactar INSTANTES DISTANTES- CARLA RAPOSO	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkcnpx9j0026ogntdzgxb566	\N	2026-01-20 22:43:23.376	2026-01-20 22:43:23.376	cmkcnpx190000ogntlfp1peol
cmkn6kamv000t01wu9uq460bg	Contactar SETIMA ESSENCIA- CELIA VICENTE	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkcnpx4c000wogntmcv0avh1	\N	2026-01-20 22:43:23.479	2026-01-20 22:43:23.479	cmkcnpx190000ogntlfp1peol
cmkn6kan5000u01wuemov7mxo	Contactar ANA CAMEIRA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkcnpx5x001bognt92v67fth	\N	2026-01-20 22:43:23.489	2026-01-20 22:43:23.489	cmkcnpx190000ogntlfp1peol
cmkn6kaq6000v01wuhcz66fw7	Contactar NUTRILEIRIA UNIPESSOAL LDA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsv7000jcynt6h6r7zv4	\N	2026-01-20 22:43:23.598	2026-01-20 22:43:23.598	cmkcnpx190000ogntlfp1peol
cmkn6kas8000w01wur0xrxqwm	Contactar SUSANA ISABEL ALMEIDA RODRIGUES PINTO	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsva000kcyntjc5a49nb	\N	2026-01-20 22:43:23.672	2026-01-20 22:43:23.672	cmkcnpx190000ogntlfp1peol
cmkn6kasl000x01wur89ou6pl	Contactar ELISABETE COSTA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkk3uyw5000201vjvh49g3fi	\N	2026-01-20 22:43:23.685	2026-01-20 22:43:23.685	cmkcnpx190000ogntlfp1peol
cmkn6kasz000y01wu77scnj9n	Contactar SUSANA LOPES CABELEIREIROS LDA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsvx000vcyntcezpxzo8	\N	2026-01-20 22:43:23.699	2026-01-20 22:43:23.699	cmkcnpx190000ogntlfp1peol
cmkn6kat8000z01wuj4cjs5nf	Contactar ELEGANCIA SEM FRONTEIRAS	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkk44agl000401vjii42zr9o	\N	2026-01-20 22:43:23.708	2026-01-20 22:43:23.708	cmkcnpx190000ogntlfp1peol
cmkn6kav6001001wu47olxxhd	Contactar CUIDAME CABELEIREIRO E ESTÉTICA, UNIP. LDA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsvz000wcynt9w0ybvrb	\N	2026-01-20 22:43:23.778	2026-01-20 22:43:23.778	cmkcnpx190000ogntlfp1peol
cmkn6kaxv001101wu3m8tkdxy	Contactar Neuza Godinho	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkk4mqro000601vjd06qdwnb	\N	2026-01-20 22:43:23.875	2026-01-20 22:43:23.875	cmkcnpx190000ogntlfp1peol
cmkn6kb64001501wu1ldkxj17	Contactar HELENA CRISTINA F. MATEUS	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-23 22:43:13.383	\N	\N	cmkd6qsvc000lcyntxxe35xnx	\N	2026-01-20 22:43:24.172	2026-01-20 22:43:24.172	cmkcnpx190000ogntlfp1peol
cmkon0386002n01wm3ziavzuc	Contactar Olivia Almeida	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-24 23:11:20.286	\N	\N	cmkomhy8g002g01wm3kbc57ck	\N	2026-01-21 23:11:20.406	2026-01-21 23:11:20.406	cmkcnpx190000ogntlfp1peol
cmkvb0msb00cf01zs725u43ji	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-27 15:10:12.75	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-26 15:10:13.595	2026-01-26 15:10:13.595	cmkcnpx190000ogntlfp1peol
cmkvb2luk00dt01zsseyp6cxx	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-27 15:11:44.883	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-26 15:11:45.692	2026-01-26 15:11:45.692	cmkcnpx190000ogntlfp1peol
cmkwb1a6d00f101zsq97kqnxz	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-28 07:58:28.76	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-27 07:58:30.085	2026-01-27 07:58:30.085	cmkcnpx190000ogntlfp1peol
cmkwhe61x00gy01zsnzjdnzs2	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-28 10:56:28.795	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-27 10:56:28.965	2026-01-27 10:56:28.965	cmkcnpx190000ogntlfp1peol
cmkwrcsjp00i701zsp5fgvzwb	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-28 15:35:19.273	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-27 15:35:20.965	2026-01-27 15:35:20.965	cmkcnpx190000ogntlfp1peol
cmkwrdky000jf01zsfqetst7d	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-28 15:35:57.583	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-27 15:35:57.768	2026-01-27 15:35:57.768	cmkcnpx190000ogntlfp1peol
cmkwrdq4x00kn01zse3v9i653	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-28 15:36:04.435	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-27 15:36:04.497	2026-01-27 15:36:04.497	cmkcnpx190000ogntlfp1peol
cmkwvvd8y00lv01zsftlwku59	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-28 17:41:45.299	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-27 17:41:46.066	2026-01-27 17:41:46.066	cmkcnpx190000ogntlfp1peol
cmkx0oxst00n301zs7usv8q35	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-28 19:56:42.272	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-27 19:56:44.189	2026-01-27 19:56:44.189	cmkcnpx190000ogntlfp1peol
cmkx0qu5k00ob01zsudovfeo2	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-28 19:58:12.666	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-27 19:58:12.776	2026-01-27 19:58:12.776	cmkcnpx190000ogntlfp1peol
cmkx0vz3y00pj01zshqdcnq6d	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-28 20:02:12.36	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-27 20:02:12.478	2026-01-27 20:02:12.478	cmkcnpx190000ogntlfp1peol
cmkx14px400qr01zscc2y8s98	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-28 20:09:00.368	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-27 20:09:00.472	2026-01-27 20:09:00.472	cmkcnpx190000ogntlfp1peol
cmkx16agt00rz01zsai2hxpg8	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-28 20:10:12.888	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-27 20:10:13.757	2026-01-27 20:10:13.757	cmkcnpx190000ogntlfp1peol
cmky2v0tw000001zsmxdaajz0	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 13:45:08.955	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 13:45:13.46	2026-01-28 13:45:13.46	cmkcnpx190000ogntlfp1peol
cmky2v0u9000101zsgchd69c8	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 13:45:08.955	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 13:45:13.473	2026-01-28 13:45:13.473	cmkcnpx190000ogntlfp1peol
cmky2v0va000201zsn1al74w5	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 13:45:08.955	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 13:45:13.51	2026-01-28 13:45:13.51	cmkcnpx190000ogntlfp1peol
cmky2wo09002t01zsmk9ishc3	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 13:46:28.533	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 13:46:30.153	2026-01-28 13:46:30.153	cmkcnpx190000ogntlfp1peol
cmky2wo7l002u01zscard7wd9	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 13:46:28.533	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 13:46:30.416	2026-01-28 13:46:30.416	cmkcnpx190000ogntlfp1peol
cmky2woa7002v01zsrawwszx9	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 13:46:28.533	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 13:46:30.511	2026-01-28 13:46:30.511	cmkcnpx190000ogntlfp1peol
cmky2y86s004301zshhfkdupr	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 13:47:41.905	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 13:47:42.964	2026-01-28 13:47:42.964	cmkcnpx190000ogntlfp1peol
cmky2y897004401zst0ueevmo	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 13:47:41.905	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 13:47:43.051	2026-01-28 13:47:43.051	cmkcnpx190000ogntlfp1peol
cmky2y89i004501zsx6w5mse2	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 13:47:41.905	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 13:47:43.061	2026-01-28 13:47:43.061	cmkcnpx190000ogntlfp1peol
cmky3gh4i005g01zsbtm993ps	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 14:01:53.46	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 14:01:54.354	2026-01-28 14:01:54.354	cmkcnpx190000ogntlfp1peol
cmky3gh6e005h01zsxkyely8b	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 14:01:53.46	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 14:01:54.422	2026-01-28 14:01:54.422	cmkcnpx190000ogntlfp1peol
cmky3gh79005i01zsoyg4c65c	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 14:01:53.46	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 14:01:54.453	2026-01-28 14:01:54.453	cmkcnpx190000ogntlfp1peol
cmky9ja5g006q01zsdzd81csn	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 16:52:01.37	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 16:52:02.98	2026-01-28 16:52:02.98	cmkcnpx190000ogntlfp1peol
cmkn6kb3b001301wuszxkziww	Contactar VITASLIM 	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	CONCLUIDA	2026-01-23 22:43:13.383	\N	2026-01-28 19:51:51.268	cmkk3bqum000001vj1s5nbkv2	\N	2026-01-20 22:43:24.071	2026-01-28 19:51:51.272	cmkcnpx190000ogntlfp1peol
cmky9ja7x006r01zse9nynlmk	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 16:52:01.37	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 16:52:03.069	2026-01-28 16:52:03.069	cmkcnpx190000ogntlfp1peol
cmky9jaaa006s01zs8dmkdclu	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 16:52:01.37	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 16:52:03.154	2026-01-28 16:52:03.154	cmkcnpx190000ogntlfp1peol
cmkn6kb3p001401wu5had913r	Contactar LA DONNA - ESTETICA & CABELEIREIRO UNIPESSOAL LDA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	CONCLUIDA	2026-01-23 22:43:13.383	\N	2026-01-28 19:51:47.292	cmkd6qsvi000ocyntovbzv27e	\N	2026-01-20 22:43:24.085	2026-01-28 19:51:47.297	cmkcnpx190000ogntlfp1peol
cmkn6kay8001201wu7119qq8y	Contactar CRISTINA   BRITO	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	CONCLUIDA	2026-01-23 22:43:13.383	\N	2026-01-28 19:51:53.628	cmkd6qsw4000xcyntvgwmxu3v	\N	2026-01-20 22:43:23.888	2026-01-28 19:51:53.632	cmkcnpx190000ogntlfp1peol
cmkyfzaay008001zsoq5hy1rz	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 19:52:27.273	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 19:52:27.37	2026-01-28 19:52:27.37	cmkcnpx190000ogntlfp1peol
cmkyfzab5008101zsqreop7jc	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 19:52:27.273	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 19:52:27.377	2026-01-28 19:52:27.377	cmkcnpx190000ogntlfp1peol
cmkyfzabd008201zstcy1qlbd	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 19:52:27.273	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 19:52:27.385	2026-01-28 19:52:27.385	cmkcnpx190000ogntlfp1peol
cmkyfzadx008301zs3ca9szqt	Contactar LA DONNA - ESTETICA & CABELEIREIRO UNIPESSOAL LDA	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-31 19:52:27.273	\N	\N	cmkd6qsvi000ocyntovbzv27e	\N	2026-01-28 19:52:27.477	2026-01-28 19:52:27.477	cmkcnpx190000ogntlfp1peol
cmkyfzae4008401zshv9df9pp	Contactar CRISTINA   BRITO	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-31 19:52:27.273	\N	\N	cmkd6qsw4000xcyntvgwmxu3v	\N	2026-01-28 19:52:27.484	2026-01-28 19:52:27.484	cmkcnpx190000ogntlfp1peol
cmkyfzae9008501zsxtigsr7k	Contactar VITASLIM 	Auto-criada: Cliente nunca foi contactado.	Telefonema	MEDIA	PENDENTE	2026-01-31 19:52:27.273	\N	\N	cmkk3bqum000001vj1s5nbkv2	\N	2026-01-28 19:52:27.489	2026-01-28 19:52:27.489	cmkcnpx190000ogntlfp1peol
cmkyg7xkh009d01zstgdpxsxz	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 19:59:08.864	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 19:59:10.769	2026-01-28 19:59:10.769	cmkcnpx190000ogntlfp1peol
cmkyg7xmo009e01zssdtxe5v8	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 19:59:08.864	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 19:59:10.848	2026-01-28 19:59:10.848	cmkcnpx190000ogntlfp1peol
cmkyg7xpo009f01zsxxz84q62	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 19:59:08.864	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 19:59:10.956	2026-01-28 19:59:10.956	cmkcnpx190000ogntlfp1peol
cmkygcjam00an01zsj8cfdtwe	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 20:02:44.152	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 20:02:45.55	2026-01-28 20:02:45.55	cmkcnpx190000ogntlfp1peol
cmkygcjck00ao01zsrlth9l0a	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 20:02:44.152	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 20:02:45.62	2026-01-28 20:02:45.62	cmkcnpx190000ogntlfp1peol
cmkygcjcu00ap01zs76ymkc4d	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 20:02:44.152	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 20:02:45.63	2026-01-28 20:02:45.63	cmkcnpx190000ogntlfp1peol
cmkyjqd0l00000101rg02k1u9	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 21:37:28.652	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 21:37:29.444	2026-01-28 21:37:29.444	cmkcnpx190000ogntlfp1peol
cmkyjqd0t00010101p2vw1yye	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 21:37:28.652	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 21:37:29.453	2026-01-28 21:37:29.453	cmkcnpx190000ogntlfp1peol
cmkyjqd3m00020101psssxmbr	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 21:37:28.652	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 21:37:29.553	2026-01-28 21:37:29.553	cmkcnpx190000ogntlfp1peol
cmkyjz5u7001a0101qcwmaa7s	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 21:44:19.851	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 21:44:20.047	2026-01-28 21:44:20.047	cmkcnpx190000ogntlfp1peol
cmkyjz5wr001b01011snyw04r	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 21:44:19.851	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 21:44:20.138	2026-01-28 21:44:20.138	cmkcnpx190000ogntlfp1peol
cmkyjz5x1001c01015cg6lmz9	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 21:44:19.851	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 21:44:20.149	2026-01-28 21:44:20.149	cmkcnpx190000ogntlfp1peol
cmkykq321002n0101o5ze7y6v	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 22:05:14.756	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 22:05:16.153	2026-01-28 22:05:16.153	cmkcnpx190000ogntlfp1peol
cmkykq32f002o0101k6dp06es	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 22:05:14.756	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 22:05:16.167	2026-01-28 22:05:16.167	cmkcnpx190000ogntlfp1peol
cmkykq34o002p0101cv7a1e92	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 22:05:14.756	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 22:05:16.248	2026-01-28 22:05:16.248	cmkcnpx190000ogntlfp1peol
cmkykq7j4003x0101nlwbudln	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 22:05:21.864	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 22:05:21.952	2026-01-28 22:05:21.952	cmkcnpx190000ogntlfp1peol
cmkykq7jl003y0101ll9hxzgq	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 22:05:21.864	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 22:05:21.969	2026-01-28 22:05:21.969	cmkcnpx190000ogntlfp1peol
cmkykq7js003z0101rz9d4z9n	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 22:05:21.864	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 22:05:21.976	2026-01-28 22:05:21.976	cmkcnpx190000ogntlfp1peol
cmkykqa8a00570101orq99w8g	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 22:05:25.271	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 22:05:25.45	2026-01-28 22:05:25.45	cmkcnpx190000ogntlfp1peol
cmkykqa8l005801017hdbwrmc	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 22:05:25.271	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 22:05:25.461	2026-01-28 22:05:25.461	cmkcnpx190000ogntlfp1peol
cmkykqa8t005901011t6bn8rq	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 22:05:25.271	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 22:05:25.469	2026-01-28 22:05:25.469	cmkcnpx190000ogntlfp1peol
cmkylu3ap000301x64lwr1k27	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 22:36:21.41	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 22:36:22.705	2026-01-28 22:36:22.705	cmkcnpx190000ogntlfp1peol
cmkylu3b0000401x6ylnf52fa	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 22:36:21.41	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 22:36:22.716	2026-01-28 22:36:22.716	cmkcnpx190000ogntlfp1peol
cmkylu3by000501x6v0qdv0r0	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 22:36:21.41	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 22:36:22.75	2026-01-28 22:36:22.75	cmkcnpx190000ogntlfp1peol
cmkymwwza000001wtfazx10sa	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:06:31.911	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 23:06:34.101	2026-01-28 23:06:34.101	cmkcnpx190000ogntlfp1peol
cmkymwx21000101wtyixmciy1	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:06:31.911	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 23:06:34.201	2026-01-28 23:06:34.201	cmkcnpx190000ogntlfp1peol
cmkymwx2y000201wtw83as9z5	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:06:31.911	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 23:06:34.233	2026-01-28 23:06:34.233	cmkcnpx190000ogntlfp1peol
cmkymyntw001a01wtjc2fq67c	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:07:53.376	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 23:07:55.556	2026-01-28 23:07:55.556	cmkcnpx190000ogntlfp1peol
cmkymynx4001b01wtiee1v1uq	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:07:53.376	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 23:07:55.671	2026-01-28 23:07:55.671	cmkcnpx190000ogntlfp1peol
cmkymynxo001c01wtsqvznjqo	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:07:53.376	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 23:07:55.692	2026-01-28 23:07:55.692	cmkcnpx190000ogntlfp1peol
cmkyn47y3000001zqmi8waylw	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:12:12.595	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 23:12:14.906	2026-01-28 23:12:14.906	cmkcnpx190000ogntlfp1peol
cmkyn480f000101zqf2vitj3a	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:12:12.595	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 23:12:14.991	2026-01-28 23:12:14.991	cmkcnpx190000ogntlfp1peol
cmkyn483e000201zqae3udjh7	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:12:12.595	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 23:12:15.098	2026-01-28 23:12:15.098	cmkcnpx190000ogntlfp1peol
cmkyn5n0t001a01zq1bz0pnkc	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:13:20.631	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 23:13:21.101	2026-01-28 23:13:21.101	cmkcnpx190000ogntlfp1peol
cmkyn5n3l001b01zqogpvqe6q	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:13:20.631	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 23:13:21.201	2026-01-28 23:13:21.201	cmkcnpx190000ogntlfp1peol
cmkyn5n63001c01zqqrxoyi9b	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:13:20.631	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 23:13:21.291	2026-01-28 23:13:21.291	cmkcnpx190000ogntlfp1peol
cmkyn5tew002k01zqyz33yue5	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:13:29.288	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 23:13:29.384	2026-01-28 23:13:29.384	cmkcnpx190000ogntlfp1peol
cmkyn5tf6002l01zqdj3wx19m	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:13:29.288	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 23:13:29.394	2026-01-28 23:13:29.394	cmkcnpx190000ogntlfp1peol
cmkyn5tfe002m01zq4nsga8ux	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:13:29.288	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 23:13:29.401	2026-01-28 23:13:29.401	cmkcnpx190000ogntlfp1peol
cmkynjt1u003u01zqmoxw90vn	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:24:20.693	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-28 23:24:22.097	2026-01-28 23:24:22.097	cmkcnpx190000ogntlfp1peol
cmkynjt4e003v01zqdcrn66em	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:24:20.693	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-28 23:24:22.19	2026-01-28 23:24:22.19	cmkcnpx190000ogntlfp1peol
cmkynjt4s003w01zq04sw1abc	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-29 23:24:20.693	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-28 23:24:22.203	2026-01-28 23:24:22.203	cmkcnpx190000ogntlfp1peol
cmkyp0uap000001xhpp2pjbxs	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 00:05:34.284	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 00:05:36.48	2026-01-29 00:05:36.48	cmkcnpx190000ogntlfp1peol
cmkyp0udo000101xh60xnzay8	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 00:05:34.284	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 00:05:36.588	2026-01-29 00:05:36.588	cmkcnpx190000ogntlfp1peol
cmkyp0ue7000201xh7q1u57t8	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 00:05:34.284	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 00:05:36.607	2026-01-29 00:05:36.607	cmkcnpx190000ogntlfp1peol
cmkyp93bl003001xhqevwtz0e	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 00:12:00.302	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 00:12:01.425	2026-01-29 00:12:01.425	cmkcnpx190000ogntlfp1peol
cmkyp93d9003101xhxp0kn0xi	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 00:12:00.302	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 00:12:01.485	2026-01-29 00:12:01.485	cmkcnpx190000ogntlfp1peol
cmkyp93di003201xhn2vflgln	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 00:12:00.302	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 00:12:01.494	2026-01-29 00:12:01.494	cmkcnpx190000ogntlfp1peol
cmkzcabrz000001zih2eor9m6	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 10:56:47.952	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 10:56:50.206	2026-01-29 10:56:50.206	cmkcnpx190000ogntlfp1peol
cmkzcabuj000101zibo6dbgky	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 10:56:47.952	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 10:56:50.298	2026-01-29 10:56:50.298	cmkcnpx190000ogntlfp1peol
cmkzcac04000201zijzdex4di	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 10:56:47.952	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 10:56:50.5	2026-01-29 10:56:50.5	cmkcnpx190000ogntlfp1peol
cmkzcwu2b001a01zikpsytpvf	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 11:14:20.096	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 11:14:20.339	2026-01-29 11:14:20.339	cmkcnpx190000ogntlfp1peol
cmkzcwu2l001b01ziq9o1t5p2	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 11:14:20.096	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 11:14:20.349	2026-01-29 11:14:20.349	cmkcnpx190000ogntlfp1peol
cmkzcwu2r001c01zigozw6qvm	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 11:14:20.096	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 11:14:20.355	2026-01-29 11:14:20.355	cmkcnpx190000ogntlfp1peol
cmkzdgmeq002l01zi9j307uyw	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 11:29:42.239	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 11:29:43.538	2026-01-29 11:29:43.538	cmkcnpx190000ogntlfp1peol
cmkzdgmhn002m01zijouptfwo	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 11:29:42.239	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 11:29:43.643	2026-01-29 11:29:43.643	cmkcnpx190000ogntlfp1peol
cmkzdgmi7002n01zicvy0gi15	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 2 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 11:29:42.239	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 11:29:43.663	2026-01-29 11:29:43.663	cmkcnpx190000ogntlfp1peol
cmkzfuznr000201x64kjbzgrf	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 12:36:51.485	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 12:36:53.126	2026-01-29 12:36:53.126	cmkcnpx190000ogntlfp1peol
cmkzfuzvz000301x6fcivjtuy	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 5 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 12:36:51.485	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 12:36:53.423	2026-01-29 12:36:53.423	cmkcnpx190000ogntlfp1peol
cmkzfuzys000401x6awonrjyh	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 12:36:51.485	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 12:36:53.523	2026-01-29 12:36:53.523	cmkcnpx190000ogntlfp1peol
cmkzhkhv7000001yg71o4vvah	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 13:24:37.355	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 13:24:42.738	2026-01-29 13:24:42.738	cmkcnpx190000ogntlfp1peol
cmkzhki0p000101ygbxccwbqu	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 13:24:37.355	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 13:24:42.937	2026-01-29 13:24:42.937	cmkcnpx190000ogntlfp1peol
cmkzhkibv000201ygcwggao0y	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 13:24:37.355	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 13:24:43.338	2026-01-29 13:24:43.338	cmkcnpx190000ogntlfp1peol
cmkzhrlcn000001sxin3mfvmi	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 13:30:09.324	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 13:30:13.846	2026-01-29 13:30:13.846	cmkcnpx190000ogntlfp1peol
cmkzhrld5000101sxpjpntst4	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 13:30:09.324	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 13:30:13.865	2026-01-29 13:30:13.865	cmkcnpx190000ogntlfp1peol
cmkzhrli7000201sx9ter2uci	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 13:30:09.324	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 13:30:14.047	2026-01-29 13:30:14.047	cmkcnpx190000ogntlfp1peol
cmkzl4w3g000001xs7gglhnrk	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 15:04:29.034	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 15:04:33.148	2026-01-29 15:04:33.148	cmkcnpx190000ogntlfp1peol
cmkzl4w63000101xsxznqzw5m	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 15:04:29.034	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 15:04:33.243	2026-01-29 15:04:33.243	cmkcnpx190000ogntlfp1peol
cmkzl4w8n000201xsfstt0cof	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 15:04:29.034	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 15:04:33.335	2026-01-29 15:04:33.335	cmkcnpx190000ogntlfp1peol
cmkzlqky10000011s3oj6n7sk	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 15:21:17.591	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 15:21:25.128	2026-01-29 15:21:25.128	cmkcnpx190000ogntlfp1peol
cmkzlql0v0001011svv67sly8	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 15:21:17.591	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 15:21:25.231	2026-01-29 15:21:25.231	cmkcnpx190000ogntlfp1peol
cmkzlql590002011sl4y4bhzp	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 15:21:17.591	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 15:21:25.389	2026-01-29 15:21:25.389	cmkcnpx190000ogntlfp1peol
cmkzn02sb000001xljtrffvlg	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 15:56:44.487	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 15:56:47.77	2026-01-29 15:56:47.77	cmkcnpx190000ogntlfp1peol
cmkzn02uy000101xlyk7db2si	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 15:56:44.487	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 15:56:47.866	2026-01-29 15:56:47.866	cmkcnpx190000ogntlfp1peol
cmkzn02xo000201xl7tp2gb23	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 15:56:44.487	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 15:56:47.964	2026-01-29 15:56:47.964	cmkcnpx190000ogntlfp1peol
cmkzn4c48000001ztffuh7cht	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:00:01.493	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 16:00:06.487	2026-01-29 16:00:06.487	cmkcnpx190000ogntlfp1peol
cmkzn4c9l000101zt0bf6b6lf	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:00:01.493	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 16:00:06.681	2026-01-29 16:00:06.681	cmkcnpx190000ogntlfp1peol
cmkzn4ccb000201zt2c0n6q0p	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:00:01.493	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 16:00:06.778	2026-01-29 16:00:06.778	cmkcnpx190000ogntlfp1peol
cmkznau51001a01zticxnu5bh	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:05:08.796	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 16:05:09.781	2026-01-29 16:05:09.781	cmkcnpx190000ogntlfp1peol
cmkznauws001b01ztkz1d3wwh	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:05:08.796	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 16:05:10.779	2026-01-29 16:05:10.779	cmkcnpx190000ogntlfp1peol
cmkznauzk001c01ztt9nq9b4v	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:05:08.796	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 16:05:10.88	2026-01-29 16:05:10.88	cmkcnpx190000ogntlfp1peol
cmkznbhv9002k01ztmm81etp2	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:05:40.09	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 16:05:40.533	2026-01-29 16:05:40.533	cmkcnpx190000ogntlfp1peol
cmkznbhy0002l01ztzo6gutj8	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:05:40.09	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 16:05:40.632	2026-01-29 16:05:40.632	cmkcnpx190000ogntlfp1peol
cmkznbhzc002m01ztb0357ne9	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:05:40.09	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 16:05:40.68	2026-01-29 16:05:40.68	cmkcnpx190000ogntlfp1peol
cmkznd7ej003u01zt92ichb10	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:06:59.022	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 16:07:00.282	2026-01-29 16:07:00.282	cmkcnpx190000ogntlfp1peol
cmkznd7es003v01ztycp5vmxc	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:06:59.022	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 16:07:00.292	2026-01-29 16:07:00.292	cmkcnpx190000ogntlfp1peol
cmkznd7f5003w01zt65gsys6h	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:06:59.022	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 16:07:00.305	2026-01-29 16:07:00.305	cmkcnpx190000ogntlfp1peol
cmkzneq55005401ztrnuppn38	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:08:10.131	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 16:08:11.225	2026-01-29 16:08:11.225	cmkcnpx190000ogntlfp1peol
cmkzneq5h005501ztnmc0tn84	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:08:10.131	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 16:08:11.237	2026-01-29 16:08:11.237	cmkcnpx190000ogntlfp1peol
cmkzneq5s005601zt5b9so113	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 16:08:10.131	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 16:08:11.248	2026-01-29 16:08:11.248	cmkcnpx190000ogntlfp1peol
cmkzpma1x006e01ztnei2k17p	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 17:10:01.544	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 17:10:02.853	2026-01-29 17:10:02.853	cmkcnpx190000ogntlfp1peol
cmkzpma6v006f01zt2eep86he	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 17:10:01.544	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 17:10:03.031	2026-01-29 17:10:03.031	cmkcnpx190000ogntlfp1peol
cmkzpmaia006g01zta65va4hd	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 17:10:01.544	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 17:10:03.442	2026-01-29 17:10:03.442	cmkcnpx190000ogntlfp1peol
cmkzpnaay007o01ztwp9e4uvc	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 17:10:49.002	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 17:10:49.834	2026-01-29 17:10:49.834	cmkcnpx190000ogntlfp1peol
cmkzpnacb007p01ztty61hk1i	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 17:10:49.002	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 17:10:49.883	2026-01-29 17:10:49.883	cmkcnpx190000ogntlfp1peol
cmkzpnadq007q01zt0vzq3870	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 17:10:49.002	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 17:10:49.933	2026-01-29 17:10:49.933	cmkcnpx190000ogntlfp1peol
cmkzr6o90000001zmea4iudkc	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 17:53:52.611	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 17:53:53.987	2026-01-29 17:53:53.987	cmkcnpx190000ogntlfp1peol
cmkzr6py5000101zmcrjbu6hd	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 17:53:52.611	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 17:53:56.189	2026-01-29 17:53:56.189	cmkcnpx190000ogntlfp1peol
cmkzr6q3m000201zmwa4k7v70	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 17:53:52.611	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 17:53:56.386	2026-01-29 17:53:56.386	cmkcnpx190000ogntlfp1peol
cmkzurnw2000001vow6ucxpcv	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 19:34:10.046	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 19:34:12.145	2026-01-29 19:34:12.145	cmkcnpx190000ogntlfp1peol
cmkzuro6i000101voek6c1nf7	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 19:34:10.046	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 19:34:12.522	2026-01-29 19:34:12.522	cmkcnpx190000ogntlfp1peol
cmkzuroc3000201voififz1nx	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 19:34:10.046	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 19:34:12.723	2026-01-29 19:34:12.723	cmkcnpx190000ogntlfp1peol
cmkzv9bxv000001w4iw3t48wh	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 19:47:53.871	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 19:47:56.466	2026-01-29 19:47:56.466	cmkcnpx190000ogntlfp1peol
cmkzv9c0a000101w4l4ukfd4m	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 19:47:53.871	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 19:47:56.553	2026-01-29 19:47:56.553	cmkcnpx190000ogntlfp1peol
cmkzv9c0g000201w4sj3pjhgc	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 19:47:53.871	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 19:47:56.56	2026-01-29 19:47:56.56	cmkcnpx190000ogntlfp1peol
cmkzw5dhn001g01w4klul4vgy	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 20:12:50.077	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 20:12:51.467	2026-01-29 20:12:51.467	cmkcnpx190000ogntlfp1peol
cmkzw5dhw001h01w4vwmey6u7	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 20:12:50.077	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 20:12:51.476	2026-01-29 20:12:51.476	cmkcnpx190000ogntlfp1peol
cmkzw5djk001i01w492m6lnzt	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 20:12:50.077	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 20:12:51.535	2026-01-29 20:12:51.535	cmkcnpx190000ogntlfp1peol
cmkzxwb2e002q01w42ttxp6uz	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 21:01:46.064	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 21:01:47.654	2026-01-29 21:01:47.654	cmkcnpx190000ogntlfp1peol
cmkzxwb7c002r01w4lec05lxq	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 21:01:46.064	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 21:01:47.832	2026-01-29 21:01:47.832	cmkcnpx190000ogntlfp1peol
cmkzxwb80002s01w45t382mkp	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 21:01:46.064	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 21:01:47.856	2026-01-29 21:01:47.856	cmkcnpx190000ogntlfp1peol
cml026y7u000001v9yc9ptyex	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:02:01.53	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 23:02:02.68	2026-01-29 23:02:02.68	cmkcnpx190000ogntlfp1peol
cml026ydc000101v9wv3p7fmm	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:02:01.53	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 23:02:02.88	2026-01-29 23:02:02.88	cmkcnpx190000ogntlfp1peol
cml026yg3000201v9ajebeo6f	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:02:01.53	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 23:02:02.979	2026-01-29 23:02:02.979	cmkcnpx190000ogntlfp1peol
cml027f42001a01v9uudw4jv7	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:02:23.478	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 23:02:24.578	2026-01-29 23:02:24.578	cmkcnpx190000ogntlfp1peol
cml027f4d001b01v90eue5e2c	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:02:23.478	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 23:02:24.589	2026-01-29 23:02:24.589	cmkcnpx190000ogntlfp1peol
cml027f4i001c01v92fbc9l71	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:02:23.478	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 23:02:24.594	2026-01-29 23:02:24.594	cmkcnpx190000ogntlfp1peol
cml029tx0002k01v9baej0zeg	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:04:16.48	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 23:04:17.076	2026-01-29 23:04:17.076	cmkcnpx190000ogntlfp1peol
cml029tzs002l01v9e43bgjr4	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:04:16.48	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 23:04:17.176	2026-01-29 23:04:17.176	cmkcnpx190000ogntlfp1peol
cml029tzz002m01v9vx4p48um	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:04:16.48	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 23:04:17.183	2026-01-29 23:04:17.183	cmkcnpx190000ogntlfp1peol
cml02aywj003u01v9uqsr3mw4	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:05:08.08	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 23:05:10.195	2026-01-29 23:05:10.195	cmkcnpx190000ogntlfp1peol
cml02ayyy003v01v9iytbwbzk	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:05:08.08	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 23:05:10.282	2026-01-29 23:05:10.282	cmkcnpx190000ogntlfp1peol
cml02az1v003w01v9su3uki7f	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:05:08.08	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 23:05:10.387	2026-01-29 23:05:10.387	cmkcnpx190000ogntlfp1peol
cml02e9pv005401v9csi1k9eu	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:07:41.989	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 23:07:44.179	2026-01-29 23:07:44.179	cmkcnpx190000ogntlfp1peol
cml02e9q6005501v9gy40azlt	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:07:41.989	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 23:07:44.19	2026-01-29 23:07:44.19	cmkcnpx190000ogntlfp1peol
cml02e9si005601v9d7g2m9mk	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:07:41.989	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 23:07:44.274	2026-01-29 23:07:44.274	cmkcnpx190000ogntlfp1peol
cml02lcta006e01v9s58g73ke	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:13:13.795	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 23:13:14.782	2026-01-29 23:13:14.782	cmkcnpx190000ogntlfp1peol
cml02lctt006f01v9surectbn	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:13:13.795	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 23:13:14.801	2026-01-29 23:13:14.801	cmkcnpx190000ogntlfp1peol
cml02lcvv006g01v97pz2w2v1	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:13:13.795	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 23:13:14.875	2026-01-29 23:13:14.875	cmkcnpx190000ogntlfp1peol
cml02ndt5007o01v9zl279iwy	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:14:49.191	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 23:14:49.384	2026-01-29 23:14:49.384	cmkcnpx190000ogntlfp1peol
cml02ndvo007p01v9b20pa88h	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:14:49.191	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 23:14:49.476	2026-01-29 23:14:49.476	cmkcnpx190000ogntlfp1peol
cml02ndvw007q01v98823o9ik	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:14:49.191	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 23:14:49.484	2026-01-29 23:14:49.484	cmkcnpx190000ogntlfp1peol
cml043bii00000115ut6l20qn	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:55:11.025	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 23:55:12.521	2026-01-29 23:55:12.521	cmkcnpx190000ogntlfp1peol
cml043bo600010115eugrjwxp	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:55:11.025	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 23:55:12.726	2026-01-29 23:55:12.726	cmkcnpx190000ogntlfp1peol
cml043bqx000201158ckifwd7	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:55:11.025	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 23:55:12.825	2026-01-29 23:55:12.825	cmkcnpx190000ogntlfp1peol
cml043gly001a0115nauubost	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:55:18.819	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 23:55:19.126	2026-01-29 23:55:19.126	cmkcnpx190000ogntlfp1peol
cml043gm5001b0115pubg956g	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:55:18.819	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 23:55:19.133	2026-01-29 23:55:19.133	cmkcnpx190000ogntlfp1peol
cml043gmf001c0115izqn0um8	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:55:18.819	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 23:55:19.143	2026-01-29 23:55:19.143	cmkcnpx190000ogntlfp1peol
cml0499ss002k0115v4gouhzk	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:59:48.332	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-29 23:59:50.235	2026-01-29 23:59:50.235	cmkcnpx190000ogntlfp1peol
cml0499v7002l0115tqzdx2mp	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:59:48.332	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-29 23:59:50.323	2026-01-29 23:59:50.323	cmkcnpx190000ogntlfp1peol
cml0499ve002m0115601i33xq	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-30 23:59:48.332	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-29 23:59:50.33	2026-01-29 23:59:50.33	cmkcnpx190000ogntlfp1peol
cml04av4a003u0115hdldtutr	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:01:03.928	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 00:01:04.521	2026-01-30 00:01:04.521	cmkcnpx190000ogntlfp1peol
cml04av71003v0115n0pqrdcn	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:01:03.928	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 00:01:04.621	2026-01-30 00:01:04.621	cmkcnpx190000ogntlfp1peol
cml04av9s003w011518nsx9ad	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:01:03.928	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 00:01:04.72	2026-01-30 00:01:04.72	cmkcnpx190000ogntlfp1peol
cml04bqop007v0115kh6ywqk7	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:01:44.421	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 00:01:45.433	2026-01-30 00:01:45.433	cmkcnpx190000ogntlfp1peol
cml04bqp2007w0115c4hadlhv	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:01:44.421	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 00:01:45.445	2026-01-30 00:01:45.445	cmkcnpx190000ogntlfp1peol
cml04bqrd007x01156ocx8c30	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:01:44.421	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 00:01:45.529	2026-01-30 00:01:45.529	cmkcnpx190000ogntlfp1peol
cml04cdag00950115yjrtvd9u	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:02:14.236	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 00:02:14.728	2026-01-30 00:02:14.728	cmkcnpx190000ogntlfp1peol
cml04cdfu00960115uobgajn6	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:02:14.236	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 00:02:14.922	2026-01-30 00:02:14.922	cmkcnpx190000ogntlfp1peol
cml04cdil0097011529elq47f	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:02:14.236	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 00:02:15.021	2026-01-30 00:02:15.021	cmkcnpx190000ogntlfp1peol
cml04g79100ag01155rtc5vhl	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:05:11.547	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 00:05:13.525	2026-01-30 00:05:13.525	cmkcnpx190000ogntlfp1peol
cml04g7eg00ah0115m0tdsav8	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:05:11.547	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 00:05:13.72	2026-01-30 00:05:13.72	cmkcnpx190000ogntlfp1peol
cml04g7er00ai0115adtbv948	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:05:11.547	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 00:05:13.731	2026-01-30 00:05:13.731	cmkcnpx190000ogntlfp1peol
cml04g8na00aj0115zwb59hd6	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:05:15.033	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 00:05:15.334	2026-01-30 00:05:15.334	cmkcnpx190000ogntlfp1peol
cml04g8ni00ak0115rdkaxv42	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 6 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:05:15.033	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 00:05:15.342	2026-01-30 00:05:15.342	cmkcnpx190000ogntlfp1peol
cml04g8ps00al01154u1di0yk	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 3 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 00:05:15.033	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 00:05:15.424	2026-01-30 00:05:15.424	cmkcnpx190000ogntlfp1peol
cml10etxl000a01va5jc0fghf	Agendar reuniao/demonstracao	Auto-criada: Bia Lacerda Cabeleireiros esta no estado "CONTACTADO" ha 7 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 14:59:55.48	\N	\N	\N	cmkqsd6h50007010g7dd4jrbf	2026-01-30 14:59:57.321	2026-01-30 14:59:57.321	\N
cml10ety5000b01vatg5t6g8t	Enviar proposta pos-reuniao	Auto-criada: Andreia Barbosa Cabeleireiro e Estética esta no estado "REUNIAO" ha 7 dias sem actualizacao.	Telefonema	ALTA	PENDENTE	2026-01-31 14:59:55.48	\N	\N	\N	cmkqwfefv00170121fnelm5ll	2026-01-30 14:59:57.34	2026-01-30 14:59:57.34	\N
cml10etz5000c01va1eew6huw	Fazer primeiro contacto	Auto-criada: Amor Perfeito Beleza e Eventos esta no estado "NOVO" ha 4 dias sem actualizacao.	Telefonema	MEDIA	PENDENTE	2026-01-31 14:59:55.48	\N	\N	\N	cmkv53pve00c901zsohh83mjz	2026-01-30 14:59:57.377	2026-01-30 14:59:57.377	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."User" (id, name, email, password, "createdAt", "updatedAt", "lastLoginAt", role, status) FROM stdin;
masteradmin001	Dev Admin	dev@rafaelcardoso.co.uk	$2b$10$hiPvEvVBblSLVmW4nVAbXOIjdPcu83NFTVlMzXYrb8N5xafuj3Szm	2026-01-30 08:33:08.509	2026-01-30 09:22:33.649	2026-01-30 09:22:33.592	MASTERADMIN	ACTIVE
test-seller-001	Test Seller	seller@test.com	$2b$10$knFEkwJI3gxjsZfZa8efRe3/HjLHZKf9XI72ic8OF.PyZRtSzQbte	2026-01-30 12:35:28.029	2026-01-30 12:35:28.029	\N	SELLER	ACTIVE
cmkcnpx190000ogntlfp1peol	Carolina	carolina	$2b$10$tIQbRVuS5FaVjfU0fCIH1uSip1kwEpMwDGSImmkSCUI153m.oa8GW	2026-01-13 13:58:11.305	2026-01-30 13:50:29.634	2026-01-30 13:50:29.592	ADMIN	ACTIVE
\.


--
-- Data for Name: Venda; Type: TABLE DATA; Schema: public; Owner: carolina
--

COPY public."Venda" (id, "clienteId", valor1, valor2, total, mes, ano, notas, "createdAt", "updatedAt", "objetivoVarioId") FROM stdin;
cmkcnpx550014ognt2d6u9o8c	cmkcnpx500013ogntjiccf4oy	310.46	\N	310.46	1	2025	\N	2026-01-13 13:58:11.465	2026-01-13 13:58:11.465	\N
cmkk58lh6000g01vjpttulwbh	cmkk57s2v000f01vjpcw5edlt	158.45	\N	158.45	1	2026	\N	2026-01-18 19:42:59.514	2026-01-18 19:42:59.514	\N
cmkcnpx5t001aognt997hjh2u	cmkcnpx5p0019ognt0dfjus98	30.09	320.22	350.31	2	2025	\N	2026-01-13 13:58:11.489	2026-01-13 13:58:11.489	\N
cmkcnpx60001cogntb9mwanw3	cmkcnpx5x001bognt92v67fth	81.77	\N	81.77	3	2025	\N	2026-01-13 13:58:11.496	2026-01-13 13:58:11.496	\N
cmkomc8bd002e01wma5ovtbr5	cmkd6qsv7000jcynt6h6r7zv4	1027.82	\N	1027.82	1	2026	\N	2026-01-21 22:52:47.257	2026-01-21 22:52:47.257	\N
cmkomnigl002k01wm6e8uwn4c	cmkomlf4i002j01wmrnup3tb8	69.91	\N	69.91	1	2026	\N	2026-01-21 23:01:33.621	2026-01-21 23:01:33.621	\N
cmkqownqe00000104lj530grk	cmkd6qsvx000vcyntcezpxzo8	359.00	\N	359.00	1	2026	\N	2026-01-23 09:40:11.941	2026-01-23 09:40:11.941	\N
cmkk51bwl000701vjn92qbht2	cmkcnpx3g000jogntg4abd8u8	297.17	\N	297.17	1	2026	\N	2026-01-18 19:37:20.517	2026-01-23 19:28:30.512	\N
cmkk54q48000b01vjjkuezvqx	cmkd6qsu40002cyntmtwkbs8f	503.47	\N	503.47	1	2026	\N	2026-01-18 19:39:58.904	2026-01-23 19:32:17.389	\N
cmkcnpx9n0027ognt362hpjov	cmkcnpx9j0026ogntdzgxb566	275.74	\N	275.74	3	2025	\N	2026-01-13 13:58:11.627	2026-01-13 13:58:11.627	\N
cmkcnpxa7002cogntlctcnu8s	cmkcnpxa3002bogntjck4ynlc	416.35	\N	416.35	3	2025	\N	2026-01-13 13:58:11.647	2026-01-13 13:58:11.647	\N
cmkcnpxb3002kognt5kzq62ob	cmkcnpxa3002bogntjck4ynlc	88.38	\N	88.38	1	2025	\N	2026-01-13 13:58:11.679	2026-01-13 13:58:11.679	\N
cmkcnpxbk002pognt287iiadh	cmkcnpx9j0026ogntdzgxb566	787.87	\N	787.87	1	2025	\N	2026-01-13 13:58:11.696	2026-01-13 13:58:11.696	\N
cmkcnpxc7002xogntx0kle0ct	cmkcnpx4c000wogntmcv0avh1	281.49	\N	281.49	1	2025	\N	2026-01-13 13:58:11.719	2026-01-13 13:58:11.719	\N
cmkcnpxck0031ogntmolc3xdi	cmkcnpx9j0026ogntdzgxb566	654.91	\N	654.91	2	2025	\N	2026-01-13 13:58:11.732	2026-01-13 13:58:11.732	\N
cmkcnpxcn0032ognt09ucw0a0	cmkcnpx3c000hogntfv3f1nr9	160.67	\N	160.67	3	2025	\N	2026-01-13 13:58:11.735	2026-01-13 13:58:11.735	\N
cmkcnpxcv0035ogntmshln9i0	cmkcnpx3c000hogntfv3f1nr9	218.18	\N	218.18	2	2025	\N	2026-01-13 13:58:11.743	2026-01-13 13:58:11.743	\N
cmkcnpxd70039ogntx2pvs4wt	cmkcnpxd40038ogntjuwfp2oj	177.56	\N	177.56	2	2025	\N	2026-01-13 13:58:11.755	2026-01-13 13:58:11.755	\N
cmkcnpxeb003gogntlxsk5ufq	cmkcnpx3c000hogntfv3f1nr9	317.93	\N	317.93	1	2025	\N	2026-01-13 13:58:11.795	2026-01-13 13:58:11.795	\N
cmkk528ue000801vjsdge2zwd	cmkcnpx4c000wogntmcv0avh1	178.54	\N	178.54	1	2026	\N	2026-01-18 19:38:03.206	2026-01-18 19:38:03.206	\N
cmkomu09v002l01wm7pbnmbmu	cmkk44agl000401vjii42zr9o	221.43	\N	221.43	1	2026	\N	2026-01-21 23:06:36.643	2026-01-21 23:06:36.643	\N
cmkqrzr5i0002010gssp8fnr2	cmkd6qsug0007cynt78amxldi	658.26	\N	658.26	1	2026	\N	2026-01-23 11:06:35.19	2026-01-23 11:06:35.19	\N
cmkom5zd4002b01wmiex435cb	cmkk3uyw5000201vjvh49g3fi	724.91	\N	724.91	1	2026	\N	2026-01-21 22:47:55.72	2026-01-23 19:31:17.083	\N
cmkomeiey002f01wmxri5u1c8	cmkd6qstz0001cynts3nac09o	805.52	\N	805.52	1	2026	\N	2026-01-21 22:54:33.658	2026-01-23 19:32:59.973	\N
cmkzw54bj001a01w4ihm1uiaz	cmkd2khtw0003pontk0fsp8w4	367.60	\N	367.60	1	2026	\N	2026-01-29 20:12:39.583	2026-01-29 20:12:39.583	\N
cmkd2khx8000mpontkho0eqnh	cmkcnpx5x001bognt92v67fth	61.26	49.90	111.16	4	2025	\N	2026-01-13 20:53:52.7	2026-01-13 20:53:52.7	\N
cmkd2khxs000rponta3mqrsa8	cmkcnpx5x001bognt92v67fth	89.19	\N	89.19	6	2025	\N	2026-01-13 20:53:52.72	2026-01-13 20:53:52.72	\N
cmkd2khyo0010pontw30j4xet	cmkcnpx4c000wogntmcv0avh1	101.00	203.88	304.88	6	2025	\N	2026-01-13 20:53:52.752	2026-01-13 20:53:52.752	\N
cmkd2khz30014pontb5gmen9b	cmkd2khtw0003pontk0fsp8w4	835.08	\N	835.08	4	2025	\N	2026-01-13 20:53:52.767	2026-01-13 20:53:52.767	\N
cmkd2khzl0019pontad1ealgq	cmkcnpx3c000hogntfv3f1nr9	258.43	\N	258.43	6	2025	\N	2026-01-13 20:53:52.785	2026-01-13 20:53:52.785	\N
cmkd2khzw001cpontl212ju4v	cmkcnpx4n0010ogntlgsvrd29	495.74	\N	495.74	6	2025	\N	2026-01-13 20:53:52.796	2026-01-13 20:53:52.796	\N
cmkd2ki0a001gpontkgevyzke	cmkd2khu20005pontjgu03va8	158.32	\N	158.32	4	2025	\N	2026-01-13 20:53:52.81	2026-01-13 20:53:52.81	\N
cmkd2ki0o001kpont9d4msdky	cmkd2khu20005pontjgu03va8	24.55	\N	24.55	5	2025	\N	2026-01-13 20:53:52.824	2026-01-13 20:53:52.824	\N
cmkd2ki0q001lpontewjiz22x	cmkcnpx9j0026ogntdzgxb566	455.05	\N	455.05	6	2025	\N	2026-01-13 20:53:52.826	2026-01-13 20:53:52.826	\N
cmkd2ki1g001spont67edcfkf	cmkcnpx3c000hogntfv3f1nr9	561.34	\N	561.34	4	2025	\N	2026-01-13 20:53:52.852	2026-01-13 20:53:52.852	\N
cmkd2ki1j001tpontgl2xa5gk	cmkcnpx4c000wogntmcv0avh1	85.96	\N	85.96	5	2025	\N	2026-01-13 20:53:52.855	2026-01-13 20:53:52.855	\N
cmkd2ki1u001wpont6u86524b	cmkcnpx5p0019ognt0dfjus98	20.67	412.08	432.75	5	2025	\N	2026-01-13 20:53:52.866	2026-01-13 20:53:52.866	\N
cmkom7p6l002c01wmfo3teplj	cmkk3uyw5000201vjvh49g3fi	747.84	\N	747.84	1	2026	\N	2026-01-21 22:49:15.837	2026-01-21 22:49:15.837	\N
cmkd2ki2f0021pontkdic8m0e	cmkcnpx9j0026ogntdzgxb566	454.66	\N	454.66	5	2025	\N	2026-01-13 20:53:52.887	2026-01-13 20:53:52.887	\N
cmkd2ki310024pont438370w3	cmkcnpx3g000jogntg4abd8u8	559.78	\N	559.78	5	2025	\N	2026-01-13 20:53:52.909	2026-01-13 20:53:52.909	\N
cmkk53gzd000901vj8dqnoh6v	cmkk4mqro000601vjd06qdwnb	352.82	\N	352.82	1	2026	\N	2026-01-18 19:39:00.409	2026-01-23 19:30:19.496	\N
cmkvauue400ca01zs14bdsdix	cmkd6qsvi000ocyntovbzv27e	412.00	\N	412.00	1	2026	compra reverte em curso de Microagulhamento	2026-01-26 15:05:43.516	2026-01-26 15:05:43.516	\N
cml0o32wj00050106gpo59518	cmkcnpx5x001bognt92v67fth	68.63	\N	68.63	1	2026	\N	2026-01-30 09:14:53.683	2026-01-30 09:14:53.683	\N
cmkd2ki4f002hpont9sr9v9eu	cmkcnpx3g000jogntg4abd8u8	162.85	\N	162.85	9	2025	\N	2026-01-13 20:53:52.959	2026-01-13 20:53:52.959	\N
cmkd2ki4k002ipont2gr9sbpf	cmkcnpx3g000jogntg4abd8u8	186.81	\N	186.81	7	2025	\N	2026-01-13 20:53:52.964	2026-01-13 20:53:52.964	\N
cmkd2ki5f002qponty955mqdt	cmkcnpx9j0026ogntdzgxb566	714.82	518.25	1233.07	7	2025	\N	2026-01-13 20:53:52.994	2026-01-13 20:53:52.994	\N
cmkd2ki5r002tpont9v5pqa83	cmkcnpx4n0010ogntlgsvrd29	673.46	\N	673.46	9	2025	\N	2026-01-13 20:53:53.007	2026-01-13 20:53:53.007	\N
cmkd2ki5v002upont5j1bqy4n	cmkcnpx500013ogntjiccf4oy	414.81	\N	414.81	7	2025	\N	2026-01-13 20:53:53.011	2026-01-13 20:53:53.011	\N
cmkd2ki7u003apontvy2jh62d	cmkcnpx3c000hogntfv3f1nr9	354.56	\N	354.56	7	2025	\N	2026-01-13 20:53:53.082	2026-01-13 20:53:53.082	\N
cmkd2ki87003epontj2eaelw5	cmkcnpx3c000hogntfv3f1nr9	504.02	\N	504.02	9	2025	\N	2026-01-13 20:53:53.095	2026-01-13 20:53:53.095	\N
cmkd2ki89003fpontbd1zulna	cmkcnpx5x001bognt92v67fth	112.09	\N	112.09	7	2025	\N	2026-01-13 20:53:53.097	2026-01-13 20:53:53.097	\N
cmkk56582000e01vj2v4c4eev	cmkcnpx9j0026ogntdzgxb566	931.55	\N	931.55	1	2026	\N	2026-01-18 19:41:05.138	2026-01-18 19:41:05.138	\N
cmkd2kiac003upont0xl6v6p3	cmkcnpx3g000jogntg4abd8u8	192.81	185.89	328.80	11	2025	\N	2026-01-13 20:53:53.172	2026-01-13 20:53:53.172	\N
cmkd2kiah003vponts345y1lz	cmkcnpx3g000jogntg4abd8u8	733.96	84.45	818.41	10	2025	\N	2026-01-13 20:53:53.177	2026-01-13 20:53:53.177	\N
cmkd2kib2003zpont0l0ynn7p	cmkcnpx4n0010ogntlgsvrd29	1211.69	20.41	1232.10	10	2025	\N	2026-01-13 20:53:53.198	2026-01-13 20:53:53.198	\N
cmkomjpeu002i01wmz39rhger	cmkd6qsui0008cynt0g8nss02	252.38	\N	252.38	1	2026	\N	2026-01-21 22:58:36.006	2026-01-28 22:12:39.44	\N
cmkom9f8g002d01wma0sakbhs	cmkd6qsw4000xcyntvgwmxu3v	1059.24	\N	1059.24	1	2026	\N	2026-01-21 22:50:36.256	2026-01-28 22:33:20.645	\N
cmkd2kic40048pontf04sjjbi	cmkd2khtw0003pontk0fsp8w4	210.09	\N	220.10	11	2025	\N	2026-01-13 20:53:53.236	2026-01-13 20:53:53.236	\N
cmkd2kice004apontosgvu2rb	cmkcnpx500013ogntjiccf4oy	440.45	\N	440.45	11	2025	\N	2026-01-13 20:53:53.246	2026-01-13 20:53:53.246	\N
cmkd2kicm004cpont7joiaadu	cmkcnpx3c000hogntfv3f1nr9	869.25	20.41	889.66	10	2025	\N	2026-01-13 20:53:53.254	2026-01-13 20:53:53.254	\N
cmkd2kicq004dponte8cb3f7p	cmkcnpx3c000hogntfv3f1nr9	553.66	\N	537.90	11	2025	\N	2026-01-13 20:53:53.258	2026-01-13 20:53:53.258	\N
cmkd2kidf004jpont0iivrs55	cmkcnpx38000fognt09x3o61e	193.58	\N	201.04	11	2025	\N	2026-01-13 20:53:53.283	2026-01-13 20:53:53.283	\N
cmkd2kieh004rpont053dcujs	cmkcnpx5x001bognt92v67fth	60.56	\N	60.56	10	2025	\N	2026-01-13 20:53:53.321	2026-01-13 20:53:53.321	\N
\.


--
-- Name: AcordoParceria AcordoParceria_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."AcordoParceria"
    ADD CONSTRAINT "AcordoParceria_pkey" PRIMARY KEY (id);


--
-- Name: Amostra Amostra_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Amostra"
    ADD CONSTRAINT "Amostra_pkey" PRIMARY KEY (id);


--
-- Name: CampanhaProduto CampanhaProduto_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."CampanhaProduto"
    ADD CONSTRAINT "CampanhaProduto_pkey" PRIMARY KEY (id);


--
-- Name: CampanhaVenda CampanhaVenda_campanhaId_vendaId_key; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."CampanhaVenda"
    ADD CONSTRAINT "CampanhaVenda_campanhaId_vendaId_key" UNIQUE ("campanhaId", "vendaId");


--
-- Name: CampanhaVenda CampanhaVenda_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."CampanhaVenda"
    ADD CONSTRAINT "CampanhaVenda_pkey" PRIMARY KEY (id);


--
-- Name: Campanha Campanha_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Campanha"
    ADD CONSTRAINT "Campanha_pkey" PRIMARY KEY (id);


--
-- Name: ClienteHealth ClienteHealth_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ClienteHealth"
    ADD CONSTRAINT "ClienteHealth_pkey" PRIMARY KEY (id);


--
-- Name: ClienteInsight ClienteInsight_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ClienteInsight"
    ADD CONSTRAINT "ClienteInsight_pkey" PRIMARY KEY (id);


--
-- Name: ClienteSegmento ClienteSegmento_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ClienteSegmento"
    ADD CONSTRAINT "ClienteSegmento_pkey" PRIMARY KEY (id);


--
-- Name: Cliente Cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Cliente"
    ADD CONSTRAINT "Cliente_pkey" PRIMARY KEY (id);


--
-- Name: Cobranca Cobranca_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Cobranca"
    ADD CONSTRAINT "Cobranca_pkey" PRIMARY KEY (id);


--
-- Name: Cobranca Cobranca_vendaId_key; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Cobranca"
    ADD CONSTRAINT "Cobranca_vendaId_key" UNIQUE ("vendaId");


--
-- Name: Comunicacao Comunicacao_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Comunicacao"
    ADD CONSTRAINT "Comunicacao_pkey" PRIMARY KEY (id);


--
-- Name: Configuracao Configuracao_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Configuracao"
    ADD CONSTRAINT "Configuracao_pkey" PRIMARY KEY (id);


--
-- Name: Devolucao Devolucao_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Devolucao"
    ADD CONSTRAINT "Devolucao_pkey" PRIMARY KEY (id);


--
-- Name: ImagemDevolucao ImagemDevolucao_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ImagemDevolucao"
    ADD CONSTRAINT "ImagemDevolucao_pkey" PRIMARY KEY (id);


--
-- Name: ImpersonationLog ImpersonationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ImpersonationLog"
    ADD CONSTRAINT "ImpersonationLog_pkey" PRIMARY KEY (id);


--
-- Name: ItemDevolucao ItemDevolucao_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemDevolucao"
    ADD CONSTRAINT "ItemDevolucao_pkey" PRIMARY KEY (id);


--
-- Name: ItemOrcamento ItemOrcamento_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemOrcamento"
    ADD CONSTRAINT "ItemOrcamento_pkey" PRIMARY KEY (id);


--
-- Name: ItemReconciliacao ItemReconciliacao_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemReconciliacao"
    ADD CONSTRAINT "ItemReconciliacao_pkey" PRIMARY KEY (id);


--
-- Name: ItemVenda ItemVenda_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemVenda"
    ADD CONSTRAINT "ItemVenda_pkey" PRIMARY KEY (id);


--
-- Name: MoodEntry MoodEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."MoodEntry"
    ADD CONSTRAINT "MoodEntry_pkey" PRIMARY KEY (id);


--
-- Name: Notificacao Notificacao_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Notificacao"
    ADD CONSTRAINT "Notificacao_pkey" PRIMARY KEY (id);


--
-- Name: ObjetivoAnual ObjetivoAnual_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ObjetivoAnual"
    ADD CONSTRAINT "ObjetivoAnual_pkey" PRIMARY KEY (id);


--
-- Name: ObjetivoMensal ObjetivoMensal_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ObjetivoMensal"
    ADD CONSTRAINT "ObjetivoMensal_pkey" PRIMARY KEY (id);


--
-- Name: ObjetivoTrimestral ObjetivoTrimestral_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ObjetivoTrimestral"
    ADD CONSTRAINT "ObjetivoTrimestral_pkey" PRIMARY KEY (id);


--
-- Name: ObjetivoVarioProduto ObjetivoVarioProduto_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ObjetivoVarioProduto"
    ADD CONSTRAINT "ObjetivoVarioProduto_pkey" PRIMARY KEY (id);


--
-- Name: ObjetivoVario ObjetivoVario_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ObjetivoVario"
    ADD CONSTRAINT "ObjetivoVario_pkey" PRIMARY KEY (id);


--
-- Name: Orcamento Orcamento_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Orcamento"
    ADD CONSTRAINT "Orcamento_pkey" PRIMARY KEY (id);


--
-- Name: Parcela Parcela_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Parcela"
    ADD CONSTRAINT "Parcela_pkey" PRIMARY KEY (id);


--
-- Name: PremioAnual PremioAnual_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."PremioAnual"
    ADD CONSTRAINT "PremioAnual_pkey" PRIMARY KEY (id);


--
-- Name: PremioMensal PremioMensal_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."PremioMensal"
    ADD CONSTRAINT "PremioMensal_pkey" PRIMARY KEY (id);


--
-- Name: PremioTrimestral PremioTrimestral_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."PremioTrimestral"
    ADD CONSTRAINT "PremioTrimestral_pkey" PRIMARY KEY (id);


--
-- Name: PrevisaoVendas PrevisaoVendas_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."PrevisaoVendas"
    ADD CONSTRAINT "PrevisaoVendas_pkey" PRIMARY KEY (id);


--
-- Name: Produto Produto_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Produto"
    ADD CONSTRAINT "Produto_pkey" PRIMARY KEY (id);


--
-- Name: ProspectoTactic ProspectoTactic_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ProspectoTactic"
    ADD CONSTRAINT "ProspectoTactic_pkey" PRIMARY KEY (id);


--
-- Name: Prospecto Prospecto_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Prospecto"
    ADD CONSTRAINT "Prospecto_pkey" PRIMARY KEY (id);


--
-- Name: ReconciliacaoMensal ReconciliacaoMensal_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ReconciliacaoMensal"
    ADD CONSTRAINT "ReconciliacaoMensal_pkey" PRIMARY KEY (id);


--
-- Name: RotaSalva RotaSalva_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."RotaSalva"
    ADD CONSTRAINT "RotaSalva_pkey" PRIMARY KEY (id);


--
-- Name: Tarefa Tarefa_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Tarefa"
    ADD CONSTRAINT "Tarefa_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Venda Venda_pkey; Type: CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Venda"
    ADD CONSTRAINT "Venda_pkey" PRIMARY KEY (id);


--
-- Name: AcordoParceria_ano_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "AcordoParceria_ano_idx" ON public."AcordoParceria" USING btree (ano);


--
-- Name: AcordoParceria_ativo_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "AcordoParceria_ativo_idx" ON public."AcordoParceria" USING btree (ativo);


--
-- Name: AcordoParceria_clienteId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "AcordoParceria_clienteId_idx" ON public."AcordoParceria" USING btree ("clienteId");


--
-- Name: AcordoParceria_clienteId_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "AcordoParceria_clienteId_key" ON public."AcordoParceria" USING btree ("clienteId");


--
-- Name: Amostra_clienteId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Amostra_clienteId_idx" ON public."Amostra" USING btree ("clienteId");


--
-- Name: Amostra_produtoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Amostra_produtoId_idx" ON public."Amostra" USING btree ("produtoId");


--
-- Name: Amostra_prospectoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Amostra_prospectoId_idx" ON public."Amostra" USING btree ("prospectoId");


--
-- Name: Amostra_userId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Amostra_userId_idx" ON public."Amostra" USING btree ("userId");


--
-- Name: CampanhaProduto_campanhaId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "CampanhaProduto_campanhaId_idx" ON public."CampanhaProduto" USING btree ("campanhaId");


--
-- Name: CampanhaProduto_produtoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "CampanhaProduto_produtoId_idx" ON public."CampanhaProduto" USING btree ("produtoId");


--
-- Name: CampanhaVenda_campanhaId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "CampanhaVenda_campanhaId_idx" ON public."CampanhaVenda" USING btree ("campanhaId");


--
-- Name: CampanhaVenda_vendaId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "CampanhaVenda_vendaId_idx" ON public."CampanhaVenda" USING btree ("vendaId");


--
-- Name: Campanha_ativo_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Campanha_ativo_idx" ON public."Campanha" USING btree (ativo);


--
-- Name: Campanha_mes_ano_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Campanha_mes_ano_idx" ON public."Campanha" USING btree (mes, ano);


--
-- Name: Campanha_userId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Campanha_userId_idx" ON public."Campanha" USING btree ("userId");


--
-- Name: ClienteHealth_clienteId_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "ClienteHealth_clienteId_key" ON public."ClienteHealth" USING btree ("clienteId");


--
-- Name: ClienteHealth_risco_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ClienteHealth_risco_idx" ON public."ClienteHealth" USING btree (risco);


--
-- Name: ClienteHealth_scoreGeral_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ClienteHealth_scoreGeral_idx" ON public."ClienteHealth" USING btree ("scoreGeral");


--
-- Name: ClienteInsight_clienteId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ClienteInsight_clienteId_idx" ON public."ClienteInsight" USING btree ("clienteId");


--
-- Name: ClienteSegmento_clienteId_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "ClienteSegmento_clienteId_key" ON public."ClienteSegmento" USING btree ("clienteId");


--
-- Name: ClienteSegmento_segmento_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ClienteSegmento_segmento_idx" ON public."ClienteSegmento" USING btree (segmento);


--
-- Name: Cliente_codigo_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "Cliente_codigo_key" ON public."Cliente" USING btree (codigo);


--
-- Name: Cliente_userId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Cliente_userId_idx" ON public."Cliente" USING btree ("userId");


--
-- Name: Cobranca_clienteId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Cobranca_clienteId_idx" ON public."Cobranca" USING btree ("clienteId");


--
-- Name: Cobranca_pago_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Cobranca_pago_idx" ON public."Cobranca" USING btree (pago);


--
-- Name: Comunicacao_clienteId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Comunicacao_clienteId_idx" ON public."Comunicacao" USING btree ("clienteId");


--
-- Name: Comunicacao_dataContacto_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Comunicacao_dataContacto_idx" ON public."Comunicacao" USING btree ("dataContacto");


--
-- Name: Comunicacao_prospectoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Comunicacao_prospectoId_idx" ON public."Comunicacao" USING btree ("prospectoId");


--
-- Name: Comunicacao_userId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Comunicacao_userId_idx" ON public."Comunicacao" USING btree ("userId");


--
-- Name: Configuracao_chave_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "Configuracao_chave_key" ON public."Configuracao" USING btree (chave);


--
-- Name: Devolucao_estado_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Devolucao_estado_idx" ON public."Devolucao" USING btree (estado);


--
-- Name: Devolucao_vendaId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Devolucao_vendaId_idx" ON public."Devolucao" USING btree ("vendaId");


--
-- Name: ImagemDevolucao_devolucaoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ImagemDevolucao_devolucaoId_idx" ON public."ImagemDevolucao" USING btree ("devolucaoId");


--
-- Name: ImpersonationLog_impersonatorId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ImpersonationLog_impersonatorId_idx" ON public."ImpersonationLog" USING btree ("impersonatorId");


--
-- Name: ImpersonationLog_startedAt_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ImpersonationLog_startedAt_idx" ON public."ImpersonationLog" USING btree ("startedAt");


--
-- Name: ItemDevolucao_devolucaoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ItemDevolucao_devolucaoId_idx" ON public."ItemDevolucao" USING btree ("devolucaoId");


--
-- Name: ItemDevolucao_itemVendaId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ItemDevolucao_itemVendaId_idx" ON public."ItemDevolucao" USING btree ("itemVendaId");


--
-- Name: ItemOrcamento_orcamentoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ItemOrcamento_orcamentoId_idx" ON public."ItemOrcamento" USING btree ("orcamentoId");


--
-- Name: ItemOrcamento_produtoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ItemOrcamento_produtoId_idx" ON public."ItemOrcamento" USING btree ("produtoId");


--
-- Name: ItemReconciliacao_clienteId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ItemReconciliacao_clienteId_idx" ON public."ItemReconciliacao" USING btree ("clienteId");


--
-- Name: ItemReconciliacao_corresponde_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ItemReconciliacao_corresponde_idx" ON public."ItemReconciliacao" USING btree (corresponde);


--
-- Name: ItemReconciliacao_reconciliacaoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ItemReconciliacao_reconciliacaoId_idx" ON public."ItemReconciliacao" USING btree ("reconciliacaoId");


--
-- Name: ItemVenda_produtoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ItemVenda_produtoId_idx" ON public."ItemVenda" USING btree ("produtoId");


--
-- Name: ItemVenda_vendaId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ItemVenda_vendaId_idx" ON public."ItemVenda" USING btree ("vendaId");


--
-- Name: MoodEntry_date_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "MoodEntry_date_idx" ON public."MoodEntry" USING btree (date);


--
-- Name: MoodEntry_userId_date_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "MoodEntry_userId_date_key" ON public."MoodEntry" USING btree ("userId", date);


--
-- Name: MoodEntry_userId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "MoodEntry_userId_idx" ON public."MoodEntry" USING btree ("userId");


--
-- Name: Notificacao_createdAt_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Notificacao_createdAt_idx" ON public."Notificacao" USING btree ("createdAt");


--
-- Name: Notificacao_lida_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Notificacao_lida_idx" ON public."Notificacao" USING btree (lida);


--
-- Name: ObjetivoAnual_ano_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "ObjetivoAnual_ano_key" ON public."ObjetivoAnual" USING btree (ano);


--
-- Name: ObjetivoMensal_mes_ano_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "ObjetivoMensal_mes_ano_key" ON public."ObjetivoMensal" USING btree (mes, ano);


--
-- Name: ObjetivoTrimestral_trimestre_ano_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "ObjetivoTrimestral_trimestre_ano_key" ON public."ObjetivoTrimestral" USING btree (trimestre, ano);


--
-- Name: ObjetivoVarioProduto_objetivoVarioId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ObjetivoVarioProduto_objetivoVarioId_idx" ON public."ObjetivoVarioProduto" USING btree ("objetivoVarioId");


--
-- Name: ObjetivoVarioProduto_produtoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ObjetivoVarioProduto_produtoId_idx" ON public."ObjetivoVarioProduto" USING btree ("produtoId");


--
-- Name: ObjetivoVario_ativo_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ObjetivoVario_ativo_idx" ON public."ObjetivoVario" USING btree (ativo);


--
-- Name: ObjetivoVario_mes_ano_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ObjetivoVario_mes_ano_idx" ON public."ObjetivoVario" USING btree (mes, ano);


--
-- Name: ObjetivoVario_userId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ObjetivoVario_userId_idx" ON public."ObjetivoVario" USING btree ("userId");


--
-- Name: Orcamento_clienteId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Orcamento_clienteId_idx" ON public."Orcamento" USING btree ("clienteId");


--
-- Name: Orcamento_estado_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Orcamento_estado_idx" ON public."Orcamento" USING btree (estado);


--
-- Name: Orcamento_numero_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "Orcamento_numero_key" ON public."Orcamento" USING btree (numero);


--
-- Name: Orcamento_prospectoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Orcamento_prospectoId_idx" ON public."Orcamento" USING btree ("prospectoId");


--
-- Name: Orcamento_userId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Orcamento_userId_idx" ON public."Orcamento" USING btree ("userId");


--
-- Name: Parcela_cobrancaId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Parcela_cobrancaId_idx" ON public."Parcela" USING btree ("cobrancaId");


--
-- Name: Parcela_cobrancaId_numero_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "Parcela_cobrancaId_numero_key" ON public."Parcela" USING btree ("cobrancaId", numero);


--
-- Name: Parcela_dataVencimento_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Parcela_dataVencimento_idx" ON public."Parcela" USING btree ("dataVencimento");


--
-- Name: Parcela_pago_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Parcela_pago_idx" ON public."Parcela" USING btree (pago);


--
-- Name: PremioAnual_minimo_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "PremioAnual_minimo_key" ON public."PremioAnual" USING btree (minimo);


--
-- Name: PremioMensal_minimo_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "PremioMensal_minimo_key" ON public."PremioMensal" USING btree (minimo);


--
-- Name: PremioTrimestral_minimo_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "PremioTrimestral_minimo_key" ON public."PremioTrimestral" USING btree (minimo);


--
-- Name: PrevisaoVendas_mes_ano_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "PrevisaoVendas_mes_ano_key" ON public."PrevisaoVendas" USING btree (mes, ano);


--
-- Name: Produto_codigo_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "Produto_codigo_key" ON public."Produto" USING btree (codigo);


--
-- Name: ProspectoTactic_prospectoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ProspectoTactic_prospectoId_idx" ON public."ProspectoTactic" USING btree ("prospectoId");


--
-- Name: Prospecto_cidade_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Prospecto_cidade_idx" ON public."Prospecto" USING btree (cidade);


--
-- Name: Prospecto_estado_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Prospecto_estado_idx" ON public."Prospecto" USING btree (estado);


--
-- Name: Prospecto_userId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Prospecto_userId_idx" ON public."Prospecto" USING btree ("userId");


--
-- Name: ReconciliacaoMensal_estado_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "ReconciliacaoMensal_estado_idx" ON public."ReconciliacaoMensal" USING btree (estado);


--
-- Name: ReconciliacaoMensal_mes_ano_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "ReconciliacaoMensal_mes_ano_key" ON public."ReconciliacaoMensal" USING btree (mes, ano);


--
-- Name: RotaSalva_concluida_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "RotaSalva_concluida_idx" ON public."RotaSalva" USING btree (concluida);


--
-- Name: RotaSalva_data_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "RotaSalva_data_idx" ON public."RotaSalva" USING btree (data);


--
-- Name: RotaSalva_userId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "RotaSalva_userId_idx" ON public."RotaSalva" USING btree ("userId");


--
-- Name: Tarefa_clienteId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Tarefa_clienteId_idx" ON public."Tarefa" USING btree ("clienteId");


--
-- Name: Tarefa_dataVencimento_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Tarefa_dataVencimento_idx" ON public."Tarefa" USING btree ("dataVencimento");


--
-- Name: Tarefa_estado_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Tarefa_estado_idx" ON public."Tarefa" USING btree (estado);


--
-- Name: Tarefa_prioridade_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Tarefa_prioridade_idx" ON public."Tarefa" USING btree (prioridade);


--
-- Name: Tarefa_prospectoId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Tarefa_prospectoId_idx" ON public."Tarefa" USING btree ("prospectoId");


--
-- Name: Tarefa_userId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Tarefa_userId_idx" ON public."Tarefa" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: carolina
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: User_status_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "User_status_idx" ON public."User" USING btree (status);


--
-- Name: Venda_clienteId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Venda_clienteId_idx" ON public."Venda" USING btree ("clienteId");


--
-- Name: Venda_mes_ano_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Venda_mes_ano_idx" ON public."Venda" USING btree (mes, ano);


--
-- Name: Venda_objetivoVarioId_idx; Type: INDEX; Schema: public; Owner: carolina
--

CREATE INDEX "Venda_objetivoVarioId_idx" ON public."Venda" USING btree ("objetivoVarioId");


--
-- Name: AcordoParceria AcordoParceria_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."AcordoParceria"
    ADD CONSTRAINT "AcordoParceria_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Amostra Amostra_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Amostra"
    ADD CONSTRAINT "Amostra_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Amostra Amostra_produtoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Amostra"
    ADD CONSTRAINT "Amostra_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES public."Produto"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Amostra Amostra_prospectoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Amostra"
    ADD CONSTRAINT "Amostra_prospectoId_fkey" FOREIGN KEY ("prospectoId") REFERENCES public."Prospecto"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Amostra Amostra_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Amostra"
    ADD CONSTRAINT "Amostra_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CampanhaProduto CampanhaProduto_campanhaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."CampanhaProduto"
    ADD CONSTRAINT "CampanhaProduto_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES public."Campanha"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CampanhaProduto CampanhaProduto_produtoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."CampanhaProduto"
    ADD CONSTRAINT "CampanhaProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES public."Produto"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CampanhaVenda CampanhaVenda_campanhaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."CampanhaVenda"
    ADD CONSTRAINT "CampanhaVenda_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES public."Campanha"(id) ON DELETE CASCADE;


--
-- Name: CampanhaVenda CampanhaVenda_vendaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."CampanhaVenda"
    ADD CONSTRAINT "CampanhaVenda_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES public."Venda"(id) ON DELETE CASCADE;


--
-- Name: Campanha Campanha_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Campanha"
    ADD CONSTRAINT "Campanha_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ClienteInsight ClienteInsight_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ClienteInsight"
    ADD CONSTRAINT "ClienteInsight_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClienteSegmento ClienteSegmento_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ClienteSegmento"
    ADD CONSTRAINT "ClienteSegmento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Cliente Cliente_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Cliente"
    ADD CONSTRAINT "Cliente_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Cobranca Cobranca_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Cobranca"
    ADD CONSTRAINT "Cobranca_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Cobranca Cobranca_vendaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Cobranca"
    ADD CONSTRAINT "Cobranca_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES public."Venda"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comunicacao Comunicacao_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Comunicacao"
    ADD CONSTRAINT "Comunicacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comunicacao Comunicacao_prospectoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Comunicacao"
    ADD CONSTRAINT "Comunicacao_prospectoId_fkey" FOREIGN KEY ("prospectoId") REFERENCES public."Prospecto"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comunicacao Comunicacao_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Comunicacao"
    ADD CONSTRAINT "Comunicacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Devolucao Devolucao_vendaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Devolucao"
    ADD CONSTRAINT "Devolucao_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES public."Venda"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ImagemDevolucao ImagemDevolucao_devolucaoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ImagemDevolucao"
    ADD CONSTRAINT "ImagemDevolucao_devolucaoId_fkey" FOREIGN KEY ("devolucaoId") REFERENCES public."Devolucao"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ItemDevolucao ItemDevolucao_devolucaoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemDevolucao"
    ADD CONSTRAINT "ItemDevolucao_devolucaoId_fkey" FOREIGN KEY ("devolucaoId") REFERENCES public."Devolucao"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ItemDevolucao ItemDevolucao_itemVendaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemDevolucao"
    ADD CONSTRAINT "ItemDevolucao_itemVendaId_fkey" FOREIGN KEY ("itemVendaId") REFERENCES public."ItemVenda"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ItemDevolucao ItemDevolucao_substituicaoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemDevolucao"
    ADD CONSTRAINT "ItemDevolucao_substituicaoId_fkey" FOREIGN KEY ("substituicaoId") REFERENCES public."Produto"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ItemOrcamento ItemOrcamento_orcamentoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemOrcamento"
    ADD CONSTRAINT "ItemOrcamento_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES public."Orcamento"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ItemOrcamento ItemOrcamento_produtoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemOrcamento"
    ADD CONSTRAINT "ItemOrcamento_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES public."Produto"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ItemReconciliacao ItemReconciliacao_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemReconciliacao"
    ADD CONSTRAINT "ItemReconciliacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ItemReconciliacao ItemReconciliacao_reconciliacaoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemReconciliacao"
    ADD CONSTRAINT "ItemReconciliacao_reconciliacaoId_fkey" FOREIGN KEY ("reconciliacaoId") REFERENCES public."ReconciliacaoMensal"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ItemReconciliacao ItemReconciliacao_vendaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemReconciliacao"
    ADD CONSTRAINT "ItemReconciliacao_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES public."Venda"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ItemVenda ItemVenda_produtoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemVenda"
    ADD CONSTRAINT "ItemVenda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES public."Produto"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ItemVenda ItemVenda_vendaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ItemVenda"
    ADD CONSTRAINT "ItemVenda_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES public."Venda"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MoodEntry MoodEntry_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."MoodEntry"
    ADD CONSTRAINT "MoodEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ObjetivoVarioProduto ObjetivoVarioProduto_objetivoVarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ObjetivoVarioProduto"
    ADD CONSTRAINT "ObjetivoVarioProduto_objetivoVarioId_fkey" FOREIGN KEY ("objetivoVarioId") REFERENCES public."ObjetivoVario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ObjetivoVarioProduto ObjetivoVarioProduto_produtoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ObjetivoVarioProduto"
    ADD CONSTRAINT "ObjetivoVarioProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES public."Produto"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ObjetivoVario ObjetivoVario_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ObjetivoVario"
    ADD CONSTRAINT "ObjetivoVario_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Orcamento Orcamento_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Orcamento"
    ADD CONSTRAINT "Orcamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Orcamento Orcamento_prospectoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Orcamento"
    ADD CONSTRAINT "Orcamento_prospectoId_fkey" FOREIGN KEY ("prospectoId") REFERENCES public."Prospecto"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Orcamento Orcamento_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Orcamento"
    ADD CONSTRAINT "Orcamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Parcela Parcela_cobrancaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Parcela"
    ADD CONSTRAINT "Parcela_cobrancaId_fkey" FOREIGN KEY ("cobrancaId") REFERENCES public."Cobranca"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProspectoTactic ProspectoTactic_prospectoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."ProspectoTactic"
    ADD CONSTRAINT "ProspectoTactic_prospectoId_fkey" FOREIGN KEY ("prospectoId") REFERENCES public."Prospecto"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Prospecto Prospecto_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Prospecto"
    ADD CONSTRAINT "Prospecto_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RotaSalva RotaSalva_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."RotaSalva"
    ADD CONSTRAINT "RotaSalva_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Tarefa Tarefa_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Tarefa"
    ADD CONSTRAINT "Tarefa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Tarefa Tarefa_prospectoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Tarefa"
    ADD CONSTRAINT "Tarefa_prospectoId_fkey" FOREIGN KEY ("prospectoId") REFERENCES public."Prospecto"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Tarefa Tarefa_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Tarefa"
    ADD CONSTRAINT "Tarefa_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Venda Venda_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Venda"
    ADD CONSTRAINT "Venda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Venda Venda_objetivoVarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: carolina
--

ALTER TABLE ONLY public."Venda"
    ADD CONSTRAINT "Venda_objetivoVarioId_fkey" FOREIGN KEY ("objetivoVarioId") REFERENCES public."ObjetivoVario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict Rye2wc2UyLjGGkPa0GYjh6ITPrfpDCzGrB1Erp1GzSJzbcJnbXPBrfachHY6UOQ

