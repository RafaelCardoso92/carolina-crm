import { ActionCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaborellaTool, ToolContext, ToolResult } from "../types";

export const clientesProximos: BaborellaTool = {
  name: "clientes_proximos",
  category: ActionCategory.MAPA,
  description: "Find clients near a location or within a city.",
  descriptionPt: "Encontrar clientes proximos",
  parameters: {
    cidade: {
      type: "string",
      description: "City to search in",
      required: false,
    },
    latitude: {
      type: "number",
      description: "Center latitude for radius search",
      required: false,
    },
    longitude: {
      type: "number",
      description: "Center longitude for radius search",
      required: false,
    },
    raioKm: {
      type: "number",
      description: "Search radius in km (default 10)",
      required: false,
    },
    limit: {
      type: "number",
      description: "Maximum results (default 20)",
      required: false,
    },
  },
  requiresApproval: false,
  getActionDescription: (params) => {
    if (params.cidade) return "Clientes em " + params.cidade;
    if (params.latitude && params.longitude) return "Clientes num raio de " + (params.raioKm || 10) + "km";
    return "Pesquisar clientes no mapa";
  },
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { cidade, latitude, longitude, raioKm = 10, limit = 20 } = params as {
        cidade?: string;
        latitude?: number;
        longitude?: number;
        raioKm?: number;
        limit?: number;
      };

      let clientes;

      if (cidade) {
        clientes = await prisma.cliente.findMany({
          where: {
            userId: context.userId,
            ativo: true,
            cidade: { contains: cidade, mode: "insensitive" },
          },
          select: {
            id: true,
            nome: true,
            morada: true,
            cidade: true,
            telefone: true,
            latitude: true,
            longitude: true,
            ultimoContacto: true,
          },
          take: limit,
        });
      } else if (latitude && longitude) {
        // For radius search, get all with coordinates and filter
        const allClientes = await prisma.cliente.findMany({
          where: {
            userId: context.userId,
            ativo: true,
            latitude: { not: null },
            longitude: { not: null },
          },
          select: {
            id: true,
            nome: true,
            morada: true,
            cidade: true,
            telefone: true,
            latitude: true,
            longitude: true,
            ultimoContacto: true,
          },
        });

        // Calculate distance and filter
        clientes = allClientes
          .map(c => {
            const dist = calculateDistance(latitude, longitude, c.latitude!, c.longitude!);
            return { ...c, distancia: dist };
          })
          .filter(c => c.distancia <= raioKm)
          .sort((a, b) => a.distancia - b.distancia)
          .slice(0, limit);
      } else {
        // Just return clients with coordinates
        clientes = await prisma.cliente.findMany({
          where: {
            userId: context.userId,
            ativo: true,
            latitude: { not: null },
          },
          select: {
            id: true,
            nome: true,
            morada: true,
            cidade: true,
            telefone: true,
            latitude: true,
            longitude: true,
            ultimoContacto: true,
          },
          take: limit,
        });
      }

      return {
        success: true,
        message: "Encontrados " + clientes.length + " clientes",
        data: clientes,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao pesquisar clientes",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const clientesSemVisita: BaborellaTool = {
  name: "clientes_sem_visita",
  category: ActionCategory.MAPA,
  description: "Find clients who havent been contacted recently.",
  descriptionPt: "Clientes sem contacto recente",
  parameters: {
    dias: {
      type: "number",
      description: "Days since last contact (default 30)",
      required: false,
    },
    cidade: {
      type: "string",
      description: "Filter by city",
      required: false,
    },
    limit: {
      type: "number",
      description: "Maximum results (default 20)",
      required: false,
    },
  },
  requiresApproval: false,
  getActionDescription: (params) => "Clientes sem contacto ha " + (params.dias || 30) + "+ dias",
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { dias = 30, cidade, limit = 20 } = params as {
        dias?: number;
        cidade?: string;
        limit?: number;
      };

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dias);

      const clientes = await prisma.cliente.findMany({
        where: {
          userId: context.userId,
          ativo: true,
          ...(cidade && { cidade: { contains: cidade, mode: "insensitive" } }),
          OR: [
            { ultimoContacto: { lt: cutoffDate } },
            { ultimoContacto: null },
          ],
        },
        select: {
          id: true,
          nome: true,
          cidade: true,
          telefone: true,
          ultimoContacto: true,
          latitude: true,
          longitude: true,
        },
        orderBy: { ultimoContacto: "asc" },
        take: limit,
      });

      return {
        success: true,
        message: clientes.length + " clientes sem contacto ha mais de " + dias + " dias",
        data: clientes,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao pesquisar clientes",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const prospectosNaArea: BaborellaTool = {
  name: "prospectos_na_area",
  category: ActionCategory.MAPA,
  description: "Find prospects in a specific city or area.",
  descriptionPt: "Prospectos numa cidade/area",
  parameters: {
    cidade: {
      type: "string",
      description: "City to search in",
      required: true,
    },
    limit: {
      type: "number",
      description: "Maximum results (default 20)",
      required: false,
    },
  },
  requiresApproval: false,
  getActionDescription: (params) => "Prospectos em " + params.cidade,
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { cidade, limit = 20 } = params as { cidade: string; limit?: number };

      const prospectos = await prisma.prospecto.findMany({
        where: {
          userId: context.userId,
          ativo: true,
          cidade: { contains: cidade, mode: "insensitive" },
        },
        select: {
          id: true,
          nomeEmpresa: true,
          tipoNegocio: true,
          cidade: true,
          telefone: true,
          estado: true,
          latitude: true,
          longitude: true,
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
      });

      return {
        success: true,
        message: prospectos.length + " prospectos em " + cidade,
        data: prospectos,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao pesquisar prospectos",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export const mapaTools = [clientesProximos, clientesSemVisita, prospectosNaArea];
