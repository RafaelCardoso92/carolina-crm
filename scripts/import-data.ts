import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import "dotenv/config"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Customers from PDF - only add if they don't exist (by codigo)
const customers = [
  { codigo: "00036", nome: "MARIA TERESA PINHO DUARTE", telefone: "262832745" },
  { codigo: "00055", nome: "TRINDADE DA COSTA LUIS", telefone: "262841072" },
  { codigo: "00148", nome: "PAULA GRACA J.SILVA", telefone: "918721574" },
  { codigo: "00538", nome: "INSTITUTO DE BELEZA CAB.LDA", telefone: "219430009" },
  { codigo: "00918", nome: "LURDES MARTA-ESTETICA E PERFUMARIA, LDA.", telefone: "232435916" },
  { codigo: "03330", nome: "ESPAÇO ESTÉTICO DE FILIPA ESTEVES LDA", telefone: "210987032" },
  { codigo: "03404", nome: "FERNANDA MARIA FERREIRA PINTO", telefone: "917331420" },
  { codigo: "04166", nome: "LUCIA BATISTA UNIPESSOAL LDA", telefone: "967916563" },
  { codigo: "04184", nome: "ANA MARIA MAIA VILAS", telefone: "239472908" },
  { codigo: "04984", nome: "ANABELA DOMINGUES PEREIRA", telefone: "919361753" },
  { codigo: "05290", nome: "ANDREIA DORIA ALVES ALFREDO BENTO", telefone: "964447138" },
  { codigo: "05307", nome: "PEQUENOS NADAS BELEZA E DECORAÇÃO, LDA", telefone: "213525519" },
  { codigo: "06394", nome: "TERESA LEONOR FAIA PEREIRA", telefone: "217960158" },
  { codigo: "06511", nome: "FLOAT IN, BEM-ESTAR, LDA", telefone: "213880193" },
  { codigo: "06636", nome: "BE CARE AND BEAUTY - ACSR UNIPESSOAL LDA", telefone: "211378389" },
  { codigo: "07099", nome: "KRISTELL DA GRAÇA RODRIGUES RIBEIRO", telefone: "919523013" },
  { codigo: "07124", nome: "MARIA ISABEL DOS SANTOS SOARES BRANDÃO", telefone: "914195624" },
  { codigo: "07160", nome: "CARLA FERREIRA, SAUDE E BELEZA, UNIPESSOAL LDA", telefone: "962912651" },
  { codigo: "07293", nome: "ALDA DOS SANTOS DIOGO", telefone: null },
  { codigo: "07400", nome: "NUTRILEIRIA UNIPESSOAL LDA", telefone: "244814100" },
  { codigo: "07487", nome: "SUSANA ISABEL ALMEIDA RODRIGUES PINTO", telefone: null },
  { codigo: "07542", nome: "HELENA CRISTINA FERNANDES MATEUS", telefone: "931103959" },
  { codigo: "07849", nome: "DIANA CARINA FERREIRA FLORINDO", telefone: null },
  { codigo: "07911", nome: "DAVICATI - CABELEIREIRO UNIPESSOAL LDA", telefone: null },
  { codigo: "09927", nome: "LA DONNA - ESTETICA & CABELEIREIRO UNIPESSOAL LDA", telefone: "918307523" },
  { codigo: "10320", nome: "VONTADES MODERNAS INST. DE BEL. E CAB.UNIPES. LDA", telefone: "960342337" },
  { codigo: "12707", nome: "SILVIA MARIA DIAS FAVITA DA CRUZ", telefone: "915610983" },
  { codigo: "12887", nome: "AUGE D'ELEGANCIA - LDA", telefone: "966910674" },
  { codigo: "13017", nome: "ADVANCE MOURA, UNIPESSOAL LDA", telefone: "917758773" },
  { codigo: "13407", nome: "NAJAH BEAUTY, LDA", telefone: "926214170" },
  { codigo: "14167", nome: "ANDREIA MANUELA COLAÇO MATEUS", telefone: "916108814" },
  { codigo: "14190", nome: "MARIA ELISABETE LOURENÇO DA COSTA", telefone: "968922266" },
  { codigo: "14481", nome: "SUSANA LOPES CABELEIREIROS LDA", telefone: "234386136" },
  { codigo: "14689", nome: "CUIDAME CABELEIREIRO E ESTÉTICA, UNIP. LDA", telefone: "219332665" },
  { codigo: "15164", nome: "ELEGANCIA SEM FRONTEIRAS EST.CAB.UNIPESSOAL LDA", telefone: "925913970" },
  { codigo: "15198", nome: "SANDRA SUSANA MARTINS-INST.DE BELEZA UNIPESSOAL LDA", telefone: "969053955" },
  { codigo: "15409", nome: "PURA BELEZA - ROSARIO UNIPESSOAL LDA", telefone: "966910674" },
  { codigo: "15681", nome: "IVONE MADALENA DA SILVA RAMOS", telefone: "914171212" },
  { codigo: "16415", nome: "FISIBELA - CENTRO FISIOTERAPIA E REABILITAÇÃO FISICA LDA", telefone: "219379780" },
  { codigo: "16687", nome: "CRISTINA MARIA REBELO MONTEIRO DE BRITO", telefone: "913355305" },
  { codigo: "16760", nome: "PARAISO LILAS UNIPESSOAL LDA", telefone: "933799197" },
]

// Products from Excel - prices are ex VAT
const products = [
  // CLEANSING SYSTEM
  { codigo: "BBA1C300", nome: "HY-OL CLEANSER 200 ML", categoria: "Cleansing System", preco: 18.18 },
  { codigo: "BBA1C301", nome: "PHYTO HY-OL BOOSTER HYDRATING 100 ML", categoria: "Cleansing System", preco: 16.24 },
  { codigo: "BBA1C303", nome: "PHYTO HY-OL BOOSTER BALANCING 100 ML", categoria: "Cleansing System", preco: 16.24 },
  { codigo: "BBA1C304", nome: "PHYTO HY-OL BOOSTER REACTIVATING 100 ML", categoria: "Cleansing System", preco: 16.24 },
  { codigo: "BBA1C309", nome: "CLEAN GENTLE CLEANSING CREAM 100 ML", categoria: "Cleansing System", preco: 13.75 },
  { codigo: "BBA1C341", nome: "DEEP CLEANSING FOAM 200 ML", categoria: "Cleansing System", preco: 20.56 },
  { codigo: "BBA1C311", nome: "REFINING ENZYME & VITAMIN C CLEANSER 40 GR", categoria: "Cleansing System", preco: 20.56 },
  { codigo: "BBA1C312", nome: "GEL & TONIC CLEANSER 200 ML", categoria: "Cleansing System", preco: 17.15 },
  { codigo: "BBA1C314", nome: "NATURAL CLEANSING BAR REFILL 65 GR", categoria: "Cleansing System", preco: 17.07 },
  { codigo: "BBA1C315", nome: "EYE & HEAVY MAKE UP REMOVER 100 ML", categoria: "Cleansing System", preco: 13.75 },
  { codigo: "BBA1C317", nome: "GENTLE PEELING CREAM 50 ML", categoria: "Cleansing System", preco: 15.82 },
  { codigo: "BBA1C318", nome: "CLARIFYING PEELING CREAM 50 ML", categoria: "Cleansing System", preco: 15.82 },
  { codigo: "BBA1C327", nome: "NATURAL CLEANSING BAR + CAN 65 GR", categoria: "Cleansing System", preco: 20.56 },
  { codigo: "BBA1C336", nome: "PERFECT GLOW 14 ML", categoria: "Cleansing System", preco: 24.14 },
  { codigo: "BBA1C337", nome: "CLE SOOTHING ROSE TONER 200 ML", categoria: "Cleansing System", preco: 21.06 },
  { codigo: "BBA1C338", nome: "CLE HYALURONIC CLEANSING BALM 150 ML", categoria: "Cleansing System", preco: 34.99 },
  { codigo: "BBA1C339", nome: "CLE PHYTO HY-OL BOOSTER CALMING 100 ML", categoria: "Cleansing System", preco: 16.55 },

  // AMPOULES
  { codigo: "BBF1C315", nome: "ACTIVE NIGHT 14 ML", categoria: "Ampoules", preco: 28.32 },
  { codigo: "BBF1C317", nome: "7 DAYS PERFECT SKIN COLLECTION", categoria: "Ampoules", preco: 19.87 },
  { codigo: "BBF1C300", nome: "HYDRA PLUS 7X2 ML", categoria: "Ampoules", preco: 15.39 },
  { codigo: "BBF1C301", nome: "PERFECT GLOW 7X2 ML", categoria: "Ampoules", preco: 21.90 },
  { codigo: "BBF1C309", nome: "ALGAE VITALIZER 7X2 ML", categoria: "Ampoules", preco: 21.90 },
  { codigo: "BBF1C302", nome: "3D FIRMING 7X2 ML", categoria: "Ampoules", preco: 25.70 },
  { codigo: "BBF1C303", nome: "LIFT EXPRESS 7X2 ML", categoria: "Ampoules", preco: 27.80 },
  { codigo: "BBF1C304", nome: "COLLAGEN BOOSTER 7X2 ML", categoria: "Ampoules", preco: 27.80 },
  { codigo: "BBF1C305", nome: "SOS CALMING 7X2 ML", categoria: "Ampoules", preco: 22.31 },
  { codigo: "BBF1C308", nome: "ACTIVE PURIFYIER 7X2 ML", categoria: "Ampoules", preco: 18.55 },
  { codigo: "BBF1C306", nome: "ACTIVE NIGHT 7X2 ML", categoria: "Ampoules", preco: 27.80 },
  { codigo: "BBF1C307", nome: "MULTI VITAMIN 7X2 ML", categoria: "Ampoules", preco: 18.92 },
  { codigo: "BBF1C500", nome: "NUTRI RESTORE 14 ML", categoria: "Ampoules", preco: 24.06 },
  { codigo: "BBF1C310", nome: "AMP WHITE COLLECTION 7X2 ML", categoria: "Ampoules", preco: 16.07 },

  // SKINOVAGE
  { codigo: "BBS2C100", nome: "SKINOVAGE CALMING CREAM", categoria: "Skinovage", preco: 43.09 },
  { codigo: "BBS2C101", nome: "SKINOVAGE CALMING CREAM RICH", categoria: "Skinovage", preco: 44.47 },
  { codigo: "BBS2C102", nome: "SKINOVAGE CALMING SERUM", categoria: "Skinovage", preco: 43.09 },
  { codigo: "BBS3C100", nome: "SKINOVAGE BALANCING CREAM", categoria: "Skinovage", preco: 43.09 },
  { codigo: "BBS3C102", nome: "SKINOVAGE BALANCING SERUM", categoria: "Skinovage", preco: 43.09 },
  { codigo: "BBS3C103", nome: "SKINOVAGE BALANCING CREAM RICH", categoria: "Skinovage", preco: 41.95 },
  { codigo: "BBS4C101", nome: "SKINOVAGE VITALIZING CREAM RICH 50 ML", categoria: "Skinovage", preco: 44.47 },
  { codigo: "BBS4C102", nome: "SKINOVAGE VITALIZING EYE CREAM 15 ML", categoria: "Skinovage", preco: 29.87 },
  { codigo: "BBS4C103", nome: "SKINOVAGE VITALIZING SERUM", categoria: "Skinovage", preco: 43.09 },
  { codigo: "BBS4C104", nome: "SKINOVAGE VITALIZING MASK", categoria: "Skinovage", preco: 22.74 },
  { codigo: "BBS5C101", nome: "SKINOVAGE PURIFYING CREAM RICH", categoria: "Skinovage", preco: 38.78 },
  { codigo: "BBS5C102", nome: "SKINOVAGE PURIFYING MASK", categoria: "Skinovage", preco: 22.74 },
  { codigo: "BBS5C103", nome: "PURIFYING CREAM 50 ML", categoria: "Skinovage", preco: 40.65 },
  { codigo: "BBS8C100", nome: "SKINOVAGE MOISTURIZING CREAM", categoria: "Skinovage", preco: 43.09 },
  { codigo: "BBS8C101", nome: "SKINOVAGE MOIST+ LIPID CREAM 50 ML", categoria: "Skinovage", preco: 44.47 },
  { codigo: "BBS8C102", nome: "SKINOVAGE MOISTURIZING SERUM", categoria: "Skinovage", preco: 43.09 },
  { codigo: "BBS8C103", nome: "SK. MOIST. EYE GEL-CREAM", categoria: "Skinovage", preco: 29.87 },
  { codigo: "BBS8C104", nome: "SKINOVAGE MOIST FOAM MASK", categoria: "Skinovage", preco: 24.14 },

  // CLASSICS
  { codigo: "BBS6C100", nome: "CLASSICS COMPLEX C CREAM", categoria: "Classics", preco: 43.09 },
  { codigo: "BBS6C101", nome: "CLASSICS MIMICAL CONTROL", categoria: "Classics", preco: 43.83 },
  { codigo: "BBS6C102", nome: "CLASSICS ARGAN CREAM", categoria: "Classics", preco: 43.09 },
  { codigo: "BBS6C104", nome: "THERMAL SPRAY", categoria: "Classics", preco: 7.26 },
  { codigo: "BBS6C105", nome: "REJUVENATING FACE OIL", categoria: "Classics", preco: 30.53 },

  // HSR
  { codigo: "BBB8C75", nome: "HSR LIFTING CREAM 50 ML", categoria: "HSR", preco: 66.44 },
  { codigo: "BBB8C76", nome: "HSR LIFTING CREAM RICH 50 ML", categoria: "HSR", preco: 69.91 },
  { codigo: "BBB8C77", nome: "HSR LIFTING EYE CREAM 30 ML", categoria: "HSR", preco: 54.22 },
  { codigo: "BBB8C78", nome: "HSR LIFTING SERUM 30 ML", categoria: "HSR", preco: 81.36 },
  { codigo: "BBB8C80", nome: "HSR LIFTING NECK & DECOLLETE CREAM 50 ML", categoria: "HSR", preco: 61.03 },
  { codigo: "BBB8C82", nome: "HSR LIFTING OVERNIGHT MASK 50 ML", categoria: "HSR", preco: 65.14 },

  // SEA CREATION
  { codigo: "BBC9C020", nome: "SEACREATION THE CREAM 50 ML", categoria: "Sea Creation", preco: 261.63 },
  { codigo: "BBC9C021", nome: "SEACREATION THE CREAM RICH 50 ML", categoria: "Sea Creation", preco: 296.08 },
  { codigo: "BBC9C022", nome: "SEACREATION THE SERUM 30 ML", categoria: "Sea Creation", preco: 147.90 },
  { codigo: "BBC9C023", nome: "SEACREATION THE EYE CREAM 15 ML", categoria: "Sea Creation", preco: 106.90 },
  { codigo: "BBC9C024", nome: "SEACREATION THE MASK 50 ML", categoria: "Sea Creation", preco: 119.41 },

  // DR. BABOR
  { codigo: "BBE1C8101", nome: "REGENERATION REBALANCING TONER 200 ML", categoria: "Dr. Babor", preco: 22.76 },
  { codigo: "BBE1C8102", nome: "REGENERATION ECM REPAIR SERUM 30 ML", categoria: "Dr. Babor", preco: 42.32 },
  { codigo: "BBE1C8103", nome: "REGENERATION THE CURE GEL CREAM 50 ML", categoria: "Dr. Babor", preco: 74.92 },
  { codigo: "BBE1C8107", nome: "DOC REGENERATION THE CURE CREAM 50 ML", categoria: "Dr. Babor", preco: 79.65 },
  { codigo: "BBE1C8200", nome: "LIFTING DERMA FILLER SERUM 30 ML", categoria: "Dr. Babor", preco: 65.14 },
  { codigo: "BBE1C8202", nome: "LIFTING COLLAGEN-PEPTIDE BOOSTER CREAM 50 ML", categoria: "Dr. Babor", preco: 74.92 },
  { codigo: "BBE1C8301", nome: "HYDRATION 10D HYALURONIC AMPOULE SERUM 14 ML", categoria: "Dr. Babor", preco: 29.28 },
  { codigo: "BBE1C8302", nome: "HYDRATION HYDRO FILLER SERUM 30 ML", categoria: "Dr. Babor", preco: 52.10 },
  { codigo: "BBE1C8303", nome: "HYDRATION HYDRO REPLENISHING GEL CREAM 50 ML", categoria: "Dr. Babor", preco: 55.36 },
  { codigo: "BBE1C8400", nome: "RESURFACE REFINING CLEANSING OIL BALM 150 ML", categoria: "Dr. Babor", preco: 32.54 },
  { codigo: "BBE1C8404", nome: "RESURFACE RENEWAL CREAM 50 ML", categoria: "Dr. Babor", preco: 78.18 },
  { codigo: "BBE1C8500", nome: "SENSITIVE SOOTHING CREAM CLEANSER 150 ML", categoria: "Dr. Babor", preco: 19.50 },
  { codigo: "BBE1C8503", nome: "SENSITIVE INSTANT RELIEF LOTION 150 ML", categoria: "Dr. Babor", preco: 32.54 },
  { codigo: "BBE1C8602", nome: "CLARIFYING IMPURITY SOS SPOT TREATMENT 15 ML", categoria: "Dr. Babor", preco: 19.50 },

  // BABOR SPA
  { codigo: "BBE5C110", nome: "SPA SHAPING SHOWER FOAM 200 ML", categoria: "Babor SPA", preco: 17.49 },
  { codigo: "BBE5C111", nome: "SPA SHAPING PEELING CREAM 200 ML", categoria: "Babor SPA", preco: 18.92 },
  { codigo: "BBE5C112", nome: "SPA SHAPING BODY LOTION 200 ML", categoria: "Babor SPA", preco: 18.92 },
  { codigo: "BBE5C113", nome: "SPA SHAPING VITAMIN ACE BODY CREAM 200ML", categoria: "Babor SPA", preco: 32.44 },
  { codigo: "BBE5C114", nome: "SPA SHAPING DAILY HAND CREAM 100 ML", categoria: "Babor SPA", preco: 12.40 },
  { codigo: "BBE5C115", nome: "SPA SHAPING DRY GLOW OIL 100 ML", categoria: "Babor SPA", preco: 26.90 },
  { codigo: "BBE5C211", nome: "SPA ENERGIZING BODY SCRUB 200 ML", categoria: "Babor SPA", preco: 16.66 },
  { codigo: "BBE5C212", nome: "SPA ENERGIZING BODY LOTION 200 ML", categoria: "Babor SPA", preco: 17.49 },
  { codigo: "BBE5C213", nome: "SPA ENERGIZING REP HAND & MANI CREAM 100 ML", categoria: "Babor SPA", preco: 16.66 },

  // MAQUILHAGEM - Lips
  { codigo: "BBMKC200", nome: "CREAMY LIPSTICK 01 ON FIRE 4GR", categoria: "Maquilhagem", preco: 17.86 },
  { codigo: "BBMKC201", nome: "CREAMY LIPSTICK 02 HOT BLOODED 4GR", categoria: "Maquilhagem", preco: 17.86 },
  { codigo: "BBMKC202", nome: "CREAMY LIPSTICK 03 METALLIC PINK 4GR", categoria: "Maquilhagem", preco: 17.86 },
  { codigo: "BBMKC203", nome: "CREAMY LIPSTICK 04 NUDE ROSE 4GR", categoria: "Maquilhagem", preco: 17.86 },
  { codigo: "BBMKC204", nome: "CREAMY LIPSTICK 05 NUDE PINK 4GR", categoria: "Maquilhagem", preco: 17.86 },
  { codigo: "BBMKC205", nome: "CREAMY LIPSTICK 06 POWDERY PEACH 4GR", categoria: "Maquilhagem", preco: 17.86 },
  { codigo: "BBMKC210", nome: "MATTE LIPSTICK 11 VERY CHERRY MATT 4GR", categoria: "Maquilhagem", preco: 17.86 },
  { codigo: "BBMKC211", nome: "MATTE LIPSTICK 12 SO NATURAL MATTE 4GR", categoria: "Maquilhagem", preco: 17.86 },
  { codigo: "BBMKC216", nome: "LIP LINER 01 PEACH NUDE 1GR", categoria: "Maquilhagem", preco: 10.08 },
  { codigo: "BBMKC217", nome: "LIP LINER 02 RED 1GR", categoria: "Maquilhagem", preco: 10.08 },
  { codigo: "BBMKC220", nome: "SUPER SOFT LIP OIL 01 PEARL PINK 6,5 ML", categoria: "Maquilhagem", preco: 14.53 },
  { codigo: "BBMKC221", nome: "SUPER SOFT LIP OIL 02 JUICY RED 6,5 ML", categoria: "Maquilhagem", preco: 14.53 },

  // MAQUILHAGEM - Eyes
  { codigo: "BBMKC300", nome: "LINE CORRECTING PENCIL 1GR", categoria: "Maquilhagem", preco: 10.08 },
  { codigo: "BBMKC301", nome: "EYE SHADOW PENCIL 01 SHINY ROSE 2GR", categoria: "Maquilhagem", preco: 12.68 },
  { codigo: "BBMKC311", nome: "EYE CONTOUR PENCIL 01 BLACK 1GR", categoria: "Maquilhagem", preco: 10.08 },
  { codigo: "BBMKC315", nome: "LIQUID EYELINER DEEP BLACK 1ML", categoria: "Maquilhagem", preco: 18.00 },
  { codigo: "BBMKC316", nome: "EYE BROW PENCIL 01 LIGHT BROWN 1GR", categoria: "Maquilhagem", preco: 10.08 },
  { codigo: "BBMKC318", nome: "EYE BROW MASCARA 01 ASH 3GR", categoria: "Maquilhagem", preco: 14.25 },
  { codigo: "BBMKC322", nome: "ULTIMATE STYLE&VOLUME MASCARA BLACK 10ML", categoria: "Maquilhagem", preco: 18.37 },
  { codigo: "BBMKC323", nome: "EXTRA CURL & VOLUME MASCARA BLACK 10ML", categoria: "Maquilhagem", preco: 18.37 },
  { codigo: "BBMKC326", nome: "EYE SHADOW QUATTRO 01 NUDES 4GR", categoria: "Maquilhagem", preco: 24.72 },

  // MAQUILHAGEM - Face
  { codigo: "BBMKC105", nome: "CREAMY COMPACT FOUNDATION SPF50 03 SUNNY 10GR", categoria: "Maquilhagem", preco: 19.82 },
  { codigo: "BBMKC107", nome: "COLLAGEN DELUXE FDT 01 PORCELAIN 30ML", categoria: "Maquilhagem", preco: 30.13 },
  { codigo: "BBMKC112", nome: "3D FIRMING SERUM FDT 01 PORCELAIN 30ML", categoria: "Maquilhagem", preco: 35.17 },
  { codigo: "BBMKC117", nome: "MATTE FINISH FDT 01 PORCELAIN 30ML", categoria: "Maquilhagem", preco: 24.95 },
  { codigo: "BBMKC124", nome: "HYDRA LIQUID FDT 04 PORCELAIN 30ML", categoria: "Maquilhagem", preco: 26.68 },
  { codigo: "BBMKC136", nome: "3D FIRMING CONCEALER 01 PORCELAIN 4GR", categoria: "Maquilhagem", preco: 18.03 },
  { codigo: "BBMKC144", nome: "MINERAL POWDER FDT 01 LIGHT 20GR", categoria: "Maquilhagem", preco: 20.44 },
  { codigo: "BBMKC149", nome: "MATTIFYING FIXING POWDER 20GR", categoria: "Maquilhagem", preco: 13.55 },
  { codigo: "BBMKC150", nome: "BEAUTIFYING POWDER 3,5GR", categoria: "Maquilhagem", preco: 21.03 },
  { codigo: "BBMKC151", nome: "SATIN BLUSH 01 PEACH 5,8GR", categoria: "Maquilhagem", preco: 21.03 },
  { codigo: "BBMKC153", nome: "SATIN DUO BRONZER 6GR", categoria: "Maquilhagem", preco: 21.03 },
  { codigo: "BBMKC154", nome: "SATIN DUO HIGHLIGHTER 6GR", categoria: "Maquilhagem", preco: 19.82 },

  // DR. BABOR PRO
  { codigo: "BBE1C9000", nome: "DOC PRO EXO YOUTH SERUM 30 ML", categoria: "Dr. Babor Pro", preco: 79.65 },
  { codigo: "BBE1C9001", nome: "DOC PRO EXO YOUTH CREAM 50 ML", categoria: "Dr. Babor Pro", preco: 79.65 },
  { codigo: "BBE1C9002", nome: "DOC PRO LONGEVITY SERUM 30 ML", categoria: "Dr. Babor Pro", preco: 79.65 },
  { codigo: "BBE1C9003", nome: "DOC PRO HYALURONIC ACID PLUMP.SERUM 50 ML", categoria: "Dr. Babor Pro", preco: 59.72 },
  { codigo: "BBE1C9010", nome: "DOC PRO RETINOL REFINING SERUM 30 ML", categoria: "Dr. Babor Pro", preco: 76.33 },
  { codigo: "BBE1C9011", nome: "DOC PRO VITAMIN C-20 SERUM 30 ML", categoria: "Dr. Babor Pro", preco: 76.33 },

  // PRO CONCENTRATES
  { codigo: "BBE1C900", nome: "PRO C VITAMIN C CONCENTRATE", categoria: "Pro Concentrates", preco: 74.68 },
  { codigo: "BBE1C902", nome: "PRO HA HYALU. ACID CONCENTRATE", categoria: "Pro Concentrates", preco: 57.93 },
  { codigo: "BBE1C904", nome: "PRO CE CERAMIDE CONCENTRATE", categoria: "Pro Concentrates", preco: 28.69 },
  { codigo: "BBE1C905", nome: "PRO BG BETA GLUCAN CONCENTRATE", categoria: "Pro Concentrates", preco: 25.42 },
  { codigo: "BBE1C907", nome: "PRO BA BOSWELLIA ACID CONCENTRATE", categoria: "Pro Concentrates", preco: 25.42 },
  { codigo: "BBE1C929", nome: "PRO RETINOL CONCENTRATE A 30 ML", categoria: "Pro Concentrates", preco: 37.71 },

  // SKINVISIBLES (Sun Protection)
  { codigo: "SKVC001", nome: "AQUA SENSE HYALURONIC SPF50 50 ML", categoria: "Skinvisibles", preco: 17.50 },
  { codigo: "SKVC002", nome: "GLOW SENSE SPF50 50 ML", categoria: "Skinvisibles", preco: 17.50 },
  { codigo: "SKVC003", nome: "EVEN SENSE SPF50 50 ML", categoria: "Skinvisibles", preco: 17.50 },
  { codigo: "SKVC004", nome: "TRANSPARENT SENSE SPF50+ 50 ML", categoria: "Skinvisibles", preco: 19.00 },
  { codigo: "SKVC005", nome: "INVISIBLE SENSE SPRAY SPF50+ 200 ML", categoria: "Skinvisibles", preco: 19.00 },
]

async function main() {
  console.log("Starting import...")

  // Import customers - only if they don't exist by codigo
  let customersAdded = 0
  let customersSkipped = 0

  for (const customer of customers) {
    const existing = await prisma.cliente.findFirst({
      where: { codigo: customer.codigo }
    })

    if (!existing) {
      await prisma.cliente.create({
        data: {
          nome: customer.nome,
          codigo: customer.codigo,
          telefone: customer.telefone,
          ativo: true
        }
      })
      customersAdded++
      console.log(`Added customer: ${customer.nome}`)
    } else {
      customersSkipped++
    }
  }

  console.log(`\nCustomers: ${customersAdded} added, ${customersSkipped} already existed`)

  // Import products - upsert by codigo
  let productsAdded = 0
  let productsUpdated = 0

  for (const product of products) {
    const existing = await prisma.produto.findFirst({
      where: { codigo: product.codigo }
    })

    if (!existing) {
      await prisma.produto.create({
        data: {
          nome: product.nome,
          codigo: product.codigo,
          categoria: product.categoria,
          ativo: true
        }
      })
      productsAdded++
    } else {
      await prisma.produto.update({
        where: { id: existing.id },
        data: {
          nome: product.nome,
          categoria: product.categoria
        }
      })
      productsUpdated++
    }
  }

  console.log(`Products: ${productsAdded} added, ${productsUpdated} updated`)
  console.log("\nImport complete!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
